import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SecurityEventsResponse {
  events: any[];
  stats: {
    byStatus: Record<string, number>;
    byCustomer: Record<string, number>;
    byPriority: Record<string, number>;
    resolvedCount: number;
    unresolvedCount: number;
    urgentCount: number;
    recentCount: number;
    resolvedStates: string[];
  };
  query: any;
  lastUpdated: string;
}

type ChartType = 'customer' | 'status' | 'priority';

const COLORS = {
  customer: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  status: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
  priority: ['#ef4444', '#f59e0b', '#10b981', '#6b7280'],
};

export function SecurityStatsChart() {
  const [chartType, setChartType] = useState<ChartType>('customer');
  const [selectedDays, setSelectedDays] = useState(1);
  
  const { data, isLoading, error, isRefetching, refetch } = useQuery({
    queryKey: ['db-security-events', 'stats', selectedDays],
    queryFn: async (): Promise<SecurityEventsResponse> => {
      const response = await fetch(`/api/db/security-events?days=${selectedDays}&maxResults=500`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || response.statusText;
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30초간 캐시 유지 (DB이므로 더 짧게)
    refetchInterval: 5 * 60 * 1000, // 5분마다 업데이트 (DB 기반으로 더 자주)
    refetchIntervalInBackground: true,
    retry: 2,
    retryDelay: 1000, // DB 쿼리는 빠르므로 1초 간격
  });

  const chartData = React.useMemo(() => {
    if (!data?.stats) return [];

    switch (chartType) {
      case 'customer':
        return Object.entries(data.stats.byCustomer).map(([key, value]) => ({
          name: getCustomerName(key),
          value,
          color: COLORS.customer[Object.keys(data.stats.byCustomer).indexOf(key) % COLORS.customer.length]
        }));
      case 'status':
        return Object.entries(data.stats.byStatus).map(([key, value]) => ({
          name: getStatusDisplayName(key),
          originalName: key,
          value,
          color: getStatusColor(key)
        }));
      case 'priority':
        return Object.entries(data.stats.byPriority).map(([key, value]) => ({
          name: key,
          value,
          color: getPriorityColor(key)
        }));
      default:
        return [];
    }
  }, [data?.stats, chartType]);

  const totalEvents = chartData.reduce((sum, item) => sum + item.value, 0);

  if (error) {
    console.error('SecurityStatsChart error:', error);
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              통계를 불러올 수 없습니다
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              새로고침
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <CardTitle>보안이벤트 통계</CardTitle>
            {isRefetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[
                { label: '24시간', value: 1 },
                { label: '3일', value: 3 },
                { label: '7일', value: 7 },
                { label: '30일', value: 30 },
              ].map(option => (
                <Button
                  key={option.value}
                  variant={selectedDays === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDays(option.value)}
                  className="whitespace-nowrap"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant={chartType === 'customer' ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType('customer')}
          >
            고객사별
          </Button>
          <Button
            variant={chartType === 'status' ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType('status')}
          >
            상태별
          </Button>
          <Button
            variant={chartType === 'priority' ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType('priority')}
          >
            우선순위별
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-foreground">
                {totalEvents}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedDays === 1 ? '최근 24시간' : `최근 ${selectedDays}일간`} 총 이벤트
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 바 차트 */}
              <div className="h-64">
                <h4 className="text-sm font-medium mb-2 text-center">분포도</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1b', 
                        border: '1px solid #27272a',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 파이 차트 */}
              <div className="h-64">
                <h4 className="text-sm font-medium mb-2 text-center">비율</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <RechartsPieChart dataKey="value" data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1b', 
                        border: '1px solid #27272a',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 데이터 테이블 */}
            <div className="bg-muted/20 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">상세 데이터</h4>
              <div className="space-y-1">
                {chartData
                  .sort((a, b) => b.value - a.value)
                  .map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="font-medium">
                        {item.value} ({((item.value / totalEvents) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function getCustomerName(projectKey: string): string {
  const customerNames: Record<string, string> = {
    '굿리치': '굿리치',
    '핀다': '핀다', 
    '삼구아이앤씨': '삼구',
    '한화위캠버스': '한화',
    'GLN': 'GLN',
    '컬리': '컬리',
    '이수시스템': '이수',
  };
  return customerNames[projectKey] || projectKey;
}

function getStatusDisplayName(status: string): string {
  const statusMapping: Record<string, string> = {
    "오탐 확인 완료": "오탐",
    "협의된 차단 완료": "협의차단",
    "정탐(승인필요 대상)": "정탐",
    "기 차단 완료": "기차단",
    "승인 대기": "대기",
    "차단 미승인 완료": "미승인"
  };
  return statusMapping[status] || status;
}

function getStatusColor(status: string): string {
  const colorMapping: Record<string, string> = {
    "오탐 확인 완료": "#94a3b8", // 밝은 회색
    "협의된 차단 완료": "#10b981", // 초록색
    "정탐(승인필요 대상)": "#f59e0b", // 주황색
    "기 차단 완료": "#06b6d4", // 청록색
    "승인 대기": "#eab308", // 노란색
    "차단 미승인 완료": "#ec4899", // 분홍색
  };
  
  // 매핑된 색상이 있으면 사용
  if (colorMapping[status]) {
    return colorMapping[status];
  }
  
  // 기본 색상들
  if (status.includes('미해결')) return '#ef4444';
  if (status.includes('대기')) return '#f59e0b';
  if (status.includes('완료')) return '#10b981';
  return '#3b82f6';
}

function getPriorityColor(priority: string): string {
  if (priority.includes('High')) return '#ef4444';
  if (priority.includes('Medium')) return '#f59e0b';
  if (priority.includes('Low')) return '#10b981';
  return '#6b7280';
}