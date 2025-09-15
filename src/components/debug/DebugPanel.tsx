'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bug,
  Server,
  Database,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Settings,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface APIStatus {
  endpoint: string;
  name: string;
  status: 'success' | 'error' | 'pending';
  responseTime: number;
  error?: string;
  data?: any;
}

interface SystemHealth {
  jiraConnection: boolean;
  supabaseConnection: boolean;
  envVariables: boolean;
  apiEndpoints: APIStatus[];
  buildInfo: {
    version: string;
    lastUpdate: string;
    nodeVersion: string;
    nextVersion: string;
  };
}

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const apiEndpoints = [
    { endpoint: '/api/jira/test-connection', name: 'Jira 연결' },
    { endpoint: '/api/jira/security-events', name: '보안 이벤트' },
    { endpoint: '/api/jira/unresolved-events', name: '미해결 이벤트' },
    { endpoint: '/api/jira/customer-status', name: '고객사 현황' },
    { endpoint: '/api/ai/analyze-event', name: 'AI 분석' },
    { endpoint: '/api/db/unresolved-events', name: 'DB 미해결 이벤트' },
    { endpoint: '/api/sync/status', name: '동기화 상태' }
  ];

  const checkSystemHealth = async () => {
    setIsChecking(true);
    const startTime = Date.now();

    const healthData: SystemHealth = {
      jiraConnection: false,
      supabaseConnection: false,
      envVariables: false,
      apiEndpoints: [],
      buildInfo: {
        version: 'v3.0.1',
        lastUpdate: new Date().toLocaleString('ko-KR'),
        nodeVersion: '20.x',
        nextVersion: '14.2.32'
      }
    };

    // 환경 변수 확인
    try {
      const envCheck = await fetch('/api/debug/env-check');
      healthData.envVariables = envCheck.ok;
    } catch {
      healthData.envVariables = false;
    }

    // API 엔드포인트 상태 확인
    for (const api of apiEndpoints) {
      const apiStartTime = Date.now();
      try {
        let response;

        // API별 적절한 요청 방식 사용
        if (api.endpoint === '/api/ai/analyze-event') {
          response = await fetch(api.endpoint + '?issueKey=TEST', { method: 'POST' });
        } else if (api.endpoint.includes('customer-status')) {
          response = await fetch(api.endpoint + '?days=1');
        } else if (api.endpoint.includes('security-events')) {
          response = await fetch(api.endpoint + '?days=1&maxResults=1');
        } else {
          response = await fetch(api.endpoint);
        }

        const responseTime = Date.now() - apiStartTime;
        const data = response.ok ? await response.json() : null;

        healthData.apiEndpoints.push({
          ...api,
          status: response.ok ? 'success' : 'error',
          responseTime,
          error: response.ok ? undefined : `${response.status} ${response.statusText}`,
          data: response.ok ? data : null
        });

        // Jira 연결 상태 확인
        if (api.endpoint === '/api/jira/test-connection' && response.ok) {
          healthData.jiraConnection = true;
        }

        // Supabase 연결 상태 확인 (DB API 응답으로 판단)
        if (api.endpoint === '/api/db/unresolved-events' && response.ok) {
          healthData.supabaseConnection = true;
        }

      } catch (error) {
        const responseTime = Date.now() - apiStartTime;
        healthData.apiEndpoints.push({
          ...api,
          status: 'error',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setSystemHealth(healthData);
    setIsChecking(false);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getHealthScore = () => {
    if (!systemHealth) return 0;

    let score = 0;
    const total = systemHealth.apiEndpoints.length + 3; // APIs + Jira + Supabase + Env

    if (systemHealth.jiraConnection) score++;
    if (systemHealth.supabaseConnection) score++;
    if (systemHealth.envVariables) score++;

    systemHealth.apiEndpoints.forEach(api => {
      if (api.status === 'success') score++;
    });

    return Math.round((score / total) * 100);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 bg-background border-dashed border-orange-500 hover:bg-orange-50"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-background">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              MetaWatch Debug Panel
            </CardTitle>
            <CardDescription>
              시스템 상태 및 API 엔드포인트 모니터링
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={checkSystemHealth} disabled={isChecking} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? '확인 중...' : '상태 확인'}
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="outline" size="sm">
              닫기
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {systemHealth && (
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">전체 시스템 상태</span>
              </div>
              <Progress value={getHealthScore()} className="flex-1" />
              <Badge variant={getHealthScore() > 80 ? 'default' : getHealthScore() > 60 ? 'secondary' : 'destructive'}>
                {getHealthScore()}%
              </Badge>
            </div>
          )}

          <Tabs defaultValue="overview" className="h-[60vh]">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="apis">API 상태</TabsTrigger>
              <TabsTrigger value="connections">연결 상태</TabsTrigger>
              <TabsTrigger value="system">시스템 정보</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      핵심 서비스
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Jira 연결</span>
                      {systemHealth?.jiraConnection ?
                        <Badge variant="default">정상</Badge> :
                        <Badge variant="destructive">오류</Badge>
                      }
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Supabase DB</span>
                      {systemHealth?.supabaseConnection ?
                        <Badge variant="default">정상</Badge> :
                        <Badge variant="destructive">오류</Badge>
                      }
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">환경 변수</span>
                      {systemHealth?.envVariables ?
                        <Badge variant="default">정상</Badge> :
                        <Badge variant="destructive">오류</Badge>
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      빠른 테스트
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('/api/jira/test-connection', '_blank')}
                    >
                      Jira 연결 테스트
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('/api/jira/security-events?days=1&maxResults=1', '_blank')}
                    >
                      보안 이벤트 API
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('/api/jira/customer-status?days=1', '_blank')}
                    >
                      고객사 현황 API
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="apis" className="mt-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-3">
                  {systemHealth?.apiEndpoints.map((api, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(api.status)}
                            <span className="font-medium">{api.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{api.responseTime}ms</Badge>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {api.endpoint}
                            </code>
                          </div>
                        </div>
                        {api.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            {api.error}
                          </div>
                        )}
                        {api.data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              응답 데이터 보기
                            </summary>
                            <pre className="mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(api.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="connections" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">외부 연결 상태</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Jira REST API v3</div>
                        <div className="text-sm text-gray-600">mcsoc.atlassian.net</div>
                      </div>
                      {systemHealth?.jiraConnection ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">연결됨</Badge>
                      ) : (
                        <Badge variant="destructive">연결 실패</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Supabase PostgreSQL</div>
                        <div className="text-sm text-gray-600">Database-First Architecture</div>
                      </div>
                      {systemHealth?.supabaseConnection ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">연결됨</Badge>
                      ) : (
                        <Badge variant="destructive">연결 실패</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Azure OpenAI</div>
                        <div className="text-sm text-gray-600">AI 보안 분석 시스템</div>
                      </div>
                      <Badge variant="secondary">선택적</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="system" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">빌드 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">버전</span>
                      <code className="text-sm">{systemHealth?.buildInfo.version}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">마지막 업데이트</span>
                      <span className="text-sm">{systemHealth?.buildInfo.lastUpdate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Node.js</span>
                      <code className="text-sm">{systemHealth?.buildInfo.nodeVersion}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Next.js</span>
                      <code className="text-sm">{systemHealth?.buildInfo.nextVersion}</code>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">아키텍처 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Database-First Architecture</div>
                      <div className="text-gray-600">Supabase PostgreSQL 기반 고성능</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">실시간 동기화</div>
                      <div className="text-gray-600">1분마다 자동 + 일일 전체 동기화</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">성능 최적화</div>
                      <div className="text-gray-600">25만개 → 1만개 수준 쿼리 최적화</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}