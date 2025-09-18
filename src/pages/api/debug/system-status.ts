import { NextApiRequest, NextApiResponse } from 'next';

interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  responseTime?: number;
  lastCheck: number;
  uptime: number;
  errorCount: number;
  description: string;
}

// 메모리 기반 상태 추적 (실제 운영에서는 Redis나 DB 사용)
let systemStatus: { [key: string]: SystemService } = {};
let incidentHistory: Array<{
  id: string;
  service: string;
  status: string;
  startTime: number;
  endTime?: number;
  description: string;
}> = [];

// 시스템 상태 업데이트 함수
export function updateServiceStatus(
  serviceName: string,
  status: SystemService['status'],
  responseTime?: number,
  error?: string
) {
  const now = Date.now();

  if (!systemStatus[serviceName]) {
    systemStatus[serviceName] = {
      name: serviceName,
      status: 'operational',
      lastCheck: now,
      uptime: 100,
      errorCount: 0,
      description: getServiceDescription(serviceName)
    };
  }

  const service = systemStatus[serviceName];
  const previousStatus = service.status;

  // 상태 업데이트
  service.status = status;
  service.lastCheck = now;
  if (responseTime !== undefined) {
    service.responseTime = responseTime;
  }

  // 오류 카운트 업데이트
  if (status === 'outage' || status === 'degraded') {
    service.errorCount++;
  }

  // Uptime 계산 (최근 24시간 기준)
  // 실제로는 더 정교한 계산이 필요하지만 간단히 구현
  if (status === 'operational') {
    service.uptime = Math.min(99.9, service.uptime + 0.1);
  } else {
    service.uptime = Math.max(0, service.uptime - 1);
  }

  // 인시던트 기록
  if (previousStatus !== status && status !== 'operational') {
    const incidentId = `${serviceName}-${now}`;
    incidentHistory.push({
      id: incidentId,
      service: serviceName,
      status,
      startTime: now,
      description: error || `${serviceName} status changed to ${status}`
    });
  }

  // 복구된 경우 인시던트 종료
  if (previousStatus !== 'operational' && status === 'operational') {
    const activeIncident = incidentHistory.find(
      incident => incident.service === serviceName && !incident.endTime
    );
    if (activeIncident) {
      activeIncident.endTime = now;
    }
  }
}

function getServiceDescription(serviceName: string): string {
  const descriptions = {
    'jira-api': 'Jira REST API 연결 및 데이터 조회',
    'supabase-db': 'Supabase PostgreSQL 데이터베이스',
    'azure-openai': 'Azure OpenAI GPT-4 AI 분석 서비스',
    'virustotal-api': 'VirusTotal 위협 인텔리전스 API',
    'abuseipdb-api': 'AbuseIPDB IP 평판 조회 API',
    'next-js': 'Next.js 웹 애플리케이션 서버',
    'render-deployment': 'Render.com 배포 플랫폼'
  };
  return descriptions[serviceName] || serviceName;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 실시간 서비스 상태 체크
    await checkAllServices();

    // 전체 시스템 상태 계산
    const services = Object.values(systemStatus);
    const operationalCount = services.filter(s => s.status === 'operational').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const outageCount = services.filter(s => s.status === 'outage').length;

    let overallStatus: 'operational' | 'degraded' | 'outage';
    if (outageCount > 0) {
      overallStatus = 'outage';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'operational';
    }

    // 최근 인시던트 (최근 24시간)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentIncidents = incidentHistory
      .filter(incident => incident.startTime >= oneDayAgo)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 10);

    // 평균 uptime 계산
    const avgUptime = services.length > 0 ?
      services.reduce((sum, service) => sum + service.uptime, 0) / services.length : 100;

    const statusData = {
      overall: {
        status: overallStatus,
        uptime: Math.round(avgUptime * 100) / 100,
        servicesCount: {
          total: services.length,
          operational: operationalCount,
          degraded: degradedCount,
          outage: outageCount
        }
      },
      services: systemStatus,
      incidents: recentIncidents,
      lastUpdated: Date.now()
    };

    res.status(200).json(statusData);
  } catch (error) {
    console.error('System Status Error:', error);
    res.status(500).json({
      error: 'Failed to get system status',
      details: error.message
    });
  }
}

async function checkAllServices() {
  const services = [
    { name: 'jira-api', url: '/api/jira/test-connection' },
    { name: 'supabase-db', url: '/api/db/health-check' },
    { name: 'azure-openai', url: '/api/ai/test' },
    { name: 'next-js', url: '/api/debug/env-check' }
  ];

  for (const service of services) {
    try {
      const startTime = Date.now();

      // 간단한 헬스체크 (실제로는 각 서비스별로 적절한 체크 로직 필요)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${service.url}`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        updateServiceStatus(service.name, 'operational', responseTime);
      } else if (response.status >= 500) {
        updateServiceStatus(service.name, 'outage', responseTime, `HTTP ${response.status}`);
      } else {
        updateServiceStatus(service.name, 'degraded', responseTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      updateServiceStatus(service.name, 'outage', undefined, error.message);
    }
  }

  // Supabase 별도 체크
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      updateServiceStatus('supabase-db', 'operational');
    } else {
      updateServiceStatus('supabase-db', 'degraded', undefined, 'Environment variables not set');
    }
  } catch (error) {
    updateServiceStatus('supabase-db', 'outage', undefined, error.message);
  }
}