import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, AlertTriangle, Clock, Shield, Globe, Server, Activity, TrendingUp, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { getCustomerColor, CUSTOMER_COLOR_ARRAY } from '@/lib/customer-colors';

interface CustomerDashboardProps {
  customerName: string;
  customerKey: string;
}

// 차트 색상 팔레트 (고객사별 시그니처 색상 사용)
const COLORS = CUSTOMER_COLOR_ARRAY;

// 심각도별 색상 매핑
const SEVERITY_COLORS: Record<string, string> = {
  'Critical': '#DC2626',
  'High': '#EF4444', 
  'Medium': '#F59E0B',
  'Low': '#10B981',
  'Info': '#6B7280'
};

export function CustomerDashboard({ customerName, customerKey }: CustomerDashboardProps) {
  const { setCurrentTab } = useApp();
  const [selectedEquipment, setSelectedEquipment] = useState<'all' | 'ips' | 'waf'>('all');

  // 24시간 보안 이벤트 데이터 조회 (Supabase 캐시 우선)
  const { data: securityData, isLoading, error } = useQuery({
    queryKey: ['customer-security-stats', customerKey, selectedEquipment],
    queryFn: async () => {
      // 먼저 Supabase 캐시된 통계 API 시도
      const response = await fetch(`/api/stats/customer/${customerKey.toLowerCase()}?equipment=${selectedEquipment}&days=1`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer security data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    cacheTime: 30 * 60 * 1000, // 30분간 캐시 보관
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 업데이트 (기존 2분 → 5분)
    refetchOnWindowFocus: false, // 윈도우 포커스시 재요청 방지
  });

  // 통계 데이터 가공 (Supabase에서 이미 가공된 데이터 사용)
  const stats = useMemo(() => {
    if (!securityData) {
      return {
        totalEvents: 0,
        severityStats: [],
        topSignatures: [],
        topAttackIPs: [],
        topCountries: [],
        hourlyTrend: []
      };
    }

    // Supabase API에서 이미 가공된 통계 데이터 사용
    return {
      totalEvents: securityData.totalEvents || 0,
      severityStats: securityData.severityStats || [],
      topSignatures: securityData.topSignatures || [],
      topAttackIPs: securityData.topAttackIPs || [],
      topCountries: securityData.topCountries || [],
      hourlyTrend: securityData.hourlyTrend || []
    };
  }, [securityData]);

  const handleBackClick = () => {
    setCurrentTab('dashboard');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                데이터를 불러올 수 없습니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 고객사 헤더 */}
      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Building2 className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customerName}</h1>
          <p className="text-sm text-muted-foreground">24시간 보안 통계 대시보드 ({customerKey})</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* 캐시 상태 표시 */}
          {securityData?.lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
              <div className={`w-2 h-2 rounded-full ${securityData.cached ? 'bg-green-500' : 'bg-blue-500'}`} />
              <span>{securityData.cached ? '캐시됨' : '실시간'}</span>
              <span>•</span>
              <span>{new Date(securityData.lastUpdated).toLocaleTimeString('ko-KR')}</span>
            </div>
          )}
          
          <Button
            variant={selectedEquipment === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEquipment('all')}
          >
            전체
          </Button>
          <Button
            variant={selectedEquipment === 'ips' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEquipment('ips')}
          >
            IPS
          </Button>
          <Button
            variant={selectedEquipment === 'waf' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEquipment('waf')}
          >
            WAF
          </Button>
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 이벤트</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '--' : stats.totalEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">지난 24시간</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 심각도</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {isLoading ? '--' : (stats.severityStats[0]?.name || 'N/A')}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? '' : `${stats.severityStats[0]?.value || 0}건 탐지`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">상위 공격 IP</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '--' : (stats.topAttackIPs[0]?.name || 'N/A')}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? '' : `${stats.topAttackIPs[0]?.value || 0}회 탐지`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">장비 구분</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedEquipment === 'all' ? '전체' : selectedEquipment.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground">현재 필터</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 심각도별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              심각도별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.severityStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.severityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 시간별 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              시간별 트렌드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 통계 테이블 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 상위 시그니처 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상위 시그니처</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topSignatures.slice(0, 8).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm truncate flex-1 mr-2">{item.name}</span>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 상위 공격 IP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상위 공격 IP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topAttackIPs.slice(0, 8).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-mono">{item.name}</span>
                  <Badge variant="destructive">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 상위 국가 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상위 국가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCountries.slice(0, 8).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="outline">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}