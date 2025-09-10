import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Filter, ExternalLink, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber, cn } from '@/lib/utils';

interface SecurityEventsResponse {
  events: any[];
  stats: {
    byStatus: Record<string, number>;
    byCustomer: Record<string, number>;
  };
  query: any;
  lastUpdated: string;
}

export function CustomerStatusOverview() {
  const [selectedDays, setSelectedDays] = useState(7);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDays, setCustomDays] = useState('');
  
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['security-events', 'overview', selectedDays, 'v3'],
    queryFn: async (): Promise<SecurityEventsResponse> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25초 타임아웃
      
      try {
        const response = await fetch(`/api/jira/security-events?days=${selectedDays}&maxResults=500`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - try reducing the date range or refresh the page');
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2분간 캐시 유지
    refetchInterval: 5 * 60 * 1000, // 5분마다 업데이트 (부하 감소)
    refetchIntervalInBackground: true,
    retry: 2, // 최대 2번 재시도
    retryDelay: 3000, // 3초 간격으로 재시도
  });

  // 고객사별 상태 집계
  const customerStatusMatrix = React.useMemo(() => {
    if (!data?.events) return [];

    const customers = ['GOODRICH', 'FINDA', 'SAMKOO', 'WCVS', 'GLN', 'KURLY', 'ISU'];
    const customerNames: Record<string, string> = {
      'GOODRICH': '굿리치',
      'FINDA': '핀다',
      'SAMKOO': '삼구아이앤씨',
      'WCVS': '한화위캠버스',
      'GLN': 'GLN',
      'KURLY': '컬리',
      'ISU': '이수시스템',
    };

    return customers.map(customer => {
      const customerEvents = data.events.filter(e => e.customer === customer);
      
      // 상태별 집계
      const statusCounts = customerEvents.reduce((acc, event) => {
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const unresolved = statusCounts['미해결'] || 0;
      const pending = Object.keys(statusCounts).filter(s => s.includes('대기')).reduce((sum, s) => sum + statusCounts[s], 0);
      const completed = Object.keys(statusCounts).filter(s => s.includes('완료')).reduce((sum, s) => sum + statusCounts[s], 0);
      const total = customerEvents.length;

      return {
        customer,
        customerName: customerNames[customer],
        unresolved,
        pending,
        completed,
        total,
        allStatuses: statusCounts,
        events: customerEvents,
      };
    });
  }, [data?.events]);

  const totalEvents = data?.events?.length || 0;
  const totalUnresolved = customerStatusMatrix.reduce((sum, c) => sum + c.unresolved, 0);

  const handleCellClick = (customer: string, statusFilter?: string) => {
    let jqlQuery = `project = "${customer}" AND issuetype="보안이벤트"`;
    if (statusFilter) {
      jqlQuery += ` AND status="${statusFilter}"`;
    }
    
    const jiraUrl = `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/issues/?jql=${encodeURIComponent(jqlQuery)}`;
    window.open(jiraUrl, '_blank');
  };

  if (error) {
    console.error('CustomerStatusOverview error:', error);
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Building2 className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              고객사 현황을 불러올 수 없습니다
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <button 
              onClick={() => refetch()} 
              className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
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
            <Building2 className="h-5 w-5 text-blue-500" />
            <CardTitle>고객사별 보안이벤트 현황</CardTitle>
            {isRefetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <DateRangeFilter
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
              showCustomPicker={showCustomPicker}
              customDays={customDays}
              onShowCustomPicker={setShowCustomPicker}
              onCustomDaysChange={setCustomDays}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>기간: {selectedDays === 1 ? '최근 24시간' : `최근 ${selectedDays}일`}</span>
          <span>•</span>
          <span>전체: {formatNumber(totalEvents)}건</span>
          <span>•</span>
          <span className={cn(
            "font-medium",
            totalUnresolved > 0 ? "text-red-400" : "text-green-400"
          )}>
            미해결: {formatNumber(totalUnresolved)}건
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <motion.table 
              className="w-full text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-foreground">고객사</th>
                  <th className="text-center p-3 font-medium text-red-300">미해결</th>
                  <th className="text-center p-3 font-medium text-yellow-300">대기중</th>
                  <th className="text-center p-3 font-medium text-green-300">완료</th>
                  <th className="text-center p-3 font-medium text-blue-300">총계</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">상세</th>
                </tr>
              </thead>
              <tbody>
                {customerStatusMatrix.map((row, index) => (
                  <motion.tr
                    key={row.customer}
                    className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="p-3 font-medium text-foreground">
                      {row.customerName}
                    </td>
                    <StatusCell
                      value={row.unresolved}
                      color="red"
                      onClick={() => handleCellClick(row.customer, '미해결')}
                    />
                    <StatusCell
                      value={row.pending}
                      color="yellow"
                      onClick={() => handleCellClick(row.customer)}
                    />
                    <StatusCell
                      value={row.completed}
                      color="green"
                      onClick={() => handleCellClick(row.customer)}
                    />
                    <StatusCell
                      value={row.total}
                      color="blue"
                      onClick={() => handleCellClick(row.customer)}
                    />
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCellClick(row.customer)}
                        className="h-8 w-8"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
                
                {/* 총계 행 */}
                <tr className="border-t-2 border-border font-medium bg-accent/10">
                  <td className="p-3 text-foreground">총계</td>
                  <StatusCell 
                    value={customerStatusMatrix.reduce((sum, c) => sum + c.unresolved, 0)} 
                    color="red" 
                  />
                  <StatusCell 
                    value={customerStatusMatrix.reduce((sum, c) => sum + c.pending, 0)} 
                    color="yellow" 
                  />
                  <StatusCell 
                    value={customerStatusMatrix.reduce((sum, c) => sum + c.completed, 0)} 
                    color="green" 
                  />
                  <StatusCell 
                    value={customerStatusMatrix.reduce((sum, c) => sum + c.total, 0)} 
                    color="blue" 
                  />
                  <td className="p-3"></td>
                </tr>
              </tbody>
            </motion.table>
            
            {/* 상태별 상세 정보 */}
            <div className="mt-4 p-3 bg-muted/20 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">발견된 상태 유형</h4>
              <div className="flex flex-wrap gap-1">
                {data?.stats?.byStatus && Object.entries(data.stats.byStatus).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-xs">
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCell({ 
  value, 
  color, 
  onClick 
}: { 
  value: number; 
  color: 'red' | 'yellow' | 'green' | 'blue';
  onClick?: () => void;
}) {
  const colorClasses = {
    red: 'text-red-300 hover:bg-red-500/10',
    yellow: 'text-yellow-300 hover:bg-yellow-500/10',
    green: 'text-green-300 hover:bg-green-500/10',
    blue: 'text-blue-300 hover:bg-blue-500/10',
  };

  return (
    <td 
      className={cn(
        "p-3 text-center transition-colors font-medium",
        colorClasses[color],
        onClick && value > 0 && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {formatNumber(value)}
    </td>
  );
}

function DateRangeFilter({
  selectedDays,
  onDaysChange,
  showCustomPicker,
  customDays,
  onShowCustomPicker,
  onCustomDaysChange,
}: {
  selectedDays: number;
  onDaysChange: (days: number) => void;
  showCustomPicker: boolean;
  customDays: string;
  onShowCustomPicker: (show: boolean) => void;
  onCustomDaysChange: (days: string) => void;
}) {
  const options = [
    { label: '최근 24시간', value: 1 },
    { label: '최근 3일', value: 3 },
    { label: '최근 7일', value: 7 },
    { label: '최근 30일', value: 30 },
  ];

  const handleCustomSubmit = () => {
    const days = parseInt(customDays);
    if (days > 0 && days <= 365) {
      onDaysChange(days);
      onShowCustomPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    }
    if (e.key === 'Escape') {
      onShowCustomPicker(false);
      onCustomDaysChange('');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Filter className="h-4 w-4 text-muted-foreground" />
      {options.map(option => (
        <Button
          key={option.value}
          variant={selectedDays === option.value && !showCustomPicker ? "default" : "outline"}
          size="sm"
          onClick={() => {
            onDaysChange(option.value);
            onShowCustomPicker(false);
          }}
          className="whitespace-nowrap"
        >
          {option.label}
        </Button>
      ))}
      
      {/* 커스텀 기간 선택 */}
      {!showCustomPicker ? (
        <Button
          variant={!options.find(opt => opt.value === selectedDays) ? "default" : "outline"}
          size="sm"
          onClick={() => onShowCustomPicker(true)}
          className="whitespace-nowrap"
        >
          <Calendar className="h-3 w-3 mr-1" />
          기간선택
        </Button>
      ) : (
        <div className="flex items-center gap-1 bg-background border rounded px-2 py-1">
          <input
            type="number"
            value={customDays}
            onChange={(e) => onCustomDaysChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="일수"
            className="w-16 bg-transparent text-sm border-none outline-none"
            min="1"
            max="365"
            autoFocus
          />
          <span className="text-xs text-muted-foreground">일</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCustomSubmit}
            className="h-6 px-1"
          >
            ✓
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onShowCustomPicker(false);
              onCustomDaysChange('');
            }}
            className="h-6 px-1"
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
}