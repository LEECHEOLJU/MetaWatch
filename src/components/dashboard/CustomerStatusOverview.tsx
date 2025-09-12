import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Filter, ExternalLink, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber, cn } from '@/lib/utils';
import { getCustomerColor, CUSTOMER_COLOR_ARRAY } from '@/lib/customer-colors';

interface CustomerStatusResponse {
  customerStats: {
    customer: string;
    customerName: string;
    statusCounts: Record<string, number>;
    total: number;
    resolved: number;
    unresolved: number;
    pending: number;
  }[];
  totalStats: {
    totalEvents: number;
    totalResolved: number;
    totalUnresolved: number;
    totalPending: number;
  };
  query: any;
  lastUpdated: string;
}

export function CustomerStatusOverview() {
  const [selectedDays, setSelectedDays] = useState(1);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDays, setCustomDays] = useState('');
  
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['jira-customer-status', selectedDays],
    queryFn: async (): Promise<CustomerStatusResponse> => {
      const response = await fetch(`/api/jira/customer-status?days=${selectedDays}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || response.statusText;
        throw new Error(errorMessage);
      }
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3분간 캐시 유지 (여러 API 호출이므로 길게)
    refetchInterval: 3 * 60 * 1000, // 3분마다 업데이트 (42개 API 호출이므로 자주 하지 않음)
    refetchIntervalInBackground: true,
    retry: 1,
    retryDelay: 2000, // 많은 API 호출이므로 2초 간격
  });

  // 상태명 축약 매핑
  const getStatusDisplayName = (status: string): string => {
    const statusMapping: Record<string, string> = {
      "오탐 확인 완료": "오탐",
      "협의된 차단 완료": "협의차단",
      "정탐(승인필요 대상)": "정탐",
      "기 차단 완료": "기차단",
      "승인 대기": "승인대기",
      "차단 미승인 완료": "미승인"
    };
    return statusMapping[status] || status;
  };

  // 상태별 색상 매핑
  const getStatusColor = (status: string): string => {
    const colorMapping: Record<string, string> = {
      "오탐 확인 완료": "#94a3b8", // 밝은 회색
      "협의된 차단 완료": "#10b981", // 초록색
      "정탐(승인필요 대상)": "#f59e0b", // 주황색
      "기 차단 완료": "#06b6d4", // 청록색
      "승인 대기": "#60a5fa", // 밝은 파랑색 (blue-400) - 어두운 배경에서 잘 보임
      "차단 미승인 완료": "#ec4899", // 분홍색
    };
    
    // 매핑된 색상이 있으면 사용, 없으면 미해결(빨간색 계열) 또는 기본(파란색)
    if (colorMapping[status]) {
      return colorMapping[status];
    }
    
    // 해결 상태가 아닌 경우 빨간색 계열로 처리
    // const resolvedStates = data?.stats?.resolvedStates || [];
    // if (!resolvedStates.includes(status)) {
    //   return "#ef4444"; // 기본 빨간색
    // }
    
    return "#3b82f6"; // 기본 파란색
  };

  // 동적 상태 컬럼 생성 (우선순위 순서: 승인대기, 정탐, 협의차단, 기차단, 오탐)
  const statusColumns = React.useMemo(() => {
    if (!data?.customerStats?.length) return [];
    
    // 우선순위 순서 정의 (중요도 높은 순)
    const statusPriority = [
      "승인 대기",          // 1순위
      "정탐(승인필요 대상)", // 2순위
      "협의된 차단 완료",   // 3순위
      "기 차단 완료",       // 4순위
      "오탐 확인 완료",     // 5순위
      "차단 미승인 완료",   // 6순위
      "미해결"             // 7순위
    ];
    
    // 해결완료, 미해결, 대기 상태 구분
    const resolvedStates = ["기 차단 완료", "협의된 차단 완료", "차단 미승인 완료", "오탐 확인 완료"];
    const unresolvedStates = ["정탐(승인필요 대상)", "미해결"];
    const pendingStates = ["승인 대기"];
    
    const statusCountMap: Record<string, number> = {};
    
    // 모든 고객사의 모든 상태를 수집
    data.customerStats.forEach(customer => {
      Object.entries(customer.statusCounts).forEach(([status, count]) => {
        if (count > 0) {
          statusCountMap[status] = (statusCountMap[status] || 0) + count;
        }
      });
    });
    
    // 우선순위 순서대로 정렬 (존재하는 상태만)
    const sortedStatuses = statusPriority.filter(status => statusCountMap[status] > 0);
    
    return sortedStatuses.map(status => {
      let isResolved = true;
      if (unresolvedStates.includes(status)) isResolved = false;
      if (pendingStates.includes(status)) isResolved = false; // 대기 상태도 미해결로 처리
      
      return {
        status,
        displayName: getStatusDisplayName(status),
        color: getStatusColor(status),
        isResolved,
        count: statusCountMap[status]
      };
    });
  }, [data?.customerStats]);

  // 고객사별 상태별 데이터 매트릭스
  const customerStatusMatrix = React.useMemo(() => {
    if (!data?.customerStats?.length || !statusColumns.length) return [];

    // API 응답에서 직접 고객사 데이터 사용
    return data.customerStats.map(customerData => ({
      customer: customerData.customer,
      customerName: customerData.customerName,
      statusCounts: customerData.statusCounts, // 각 상태별 건수
      total: customerData.total,
      resolved: customerData.resolved,
      unresolved: customerData.unresolved,
      pending: customerData.pending,
    }));
  }, [data?.customerStats, statusColumns]);

  const totalEvents = data?.totalStats?.totalEvents || 0;
  
  // 상태별 총계 계산
  const statusTotals = React.useMemo(() => {
    return statusColumns.reduce((acc, col) => {
      acc[col.status] = col.count;
      return acc;
    }, {} as Record<string, number>);
  }, [statusColumns]);

  const totalUnresolved = data?.totalStats?.totalUnresolved || 0;
  const totalResolved = data?.totalStats?.totalResolved || 0;

  const handleCellClick = (customer: string, statusFilter?: string, isResolved?: boolean) => {
    let jqlQuery = `project = "${customer}" AND issuetype="보안이벤트"`;
    if (statusFilter) {
      jqlQuery += ` AND status="${statusFilter}"`;
    } 
    // else if (isResolved !== undefined) {
    //   // 해결/미해결 필터링
    //   if (isResolved && data?.stats?.resolvedStates) {
    //     const resolvedStatusList = data.stats.resolvedStates.map(s => `"${s}"`).join(',');
    //     jqlQuery += ` AND status IN (${resolvedStatusList})`;
    //   } else if (!isResolved && data?.stats?.resolvedStates) {
    //     const resolvedStatusList = data.stats.resolvedStates.map(s => `"${s}"`).join(',');
    //     jqlQuery += ` AND status NOT IN (${resolvedStatusList})`;
    //   }
    // }
    
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
          <span className="font-medium text-green-400">
            해결완료: {formatNumber(totalResolved)}건
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
          <div className="overflow-x-auto max-w-full">
            <motion.table 
              className="w-full text-sm border-separate border-spacing-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ minWidth: `${Math.max(800, statusColumns.length * 100 + 300)}px` }}
            >
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 font-semibold text-foreground sticky left-0 bg-background z-20 border-r border-border">
                    고객사
                  </th>
                  {statusColumns.map((col, index) => (
                    <th 
                      key={col.status}
                      className="text-center p-3 font-semibold text-sm min-w-24 h-16 border-l border-border/50"
                      title={`${col.status} (전체 ${col.count}건)`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <div 
                          className="font-semibold whitespace-nowrap mb-1"
                          style={{ color: col.color }}
                        >
                          {col.displayName}
                        </div>
                        <div 
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{
                            borderColor: col.color,
                            color: col.color,
                            backgroundColor: 'transparent'
                          }}
                        >
                          {col.count}건
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="text-center p-3 font-semibold text-blue-300 sticky right-0 bg-background z-20 border-l border-border">
                    총계
                  </th>
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
                    <td className="p-3 font-medium sticky left-0 bg-background border-r border-border/50">
                      <span 
                        className="font-semibold"
                        style={{ color: getCustomerColor(row.customer).primary }}
                      >
                        {row.customerName}
                      </span>
                    </td>
                    {statusColumns.map((col) => {
                      const count = row.statusCounts[col.status] || 0;
                      return (
                        <StatusCell
                          key={col.status}
                          value={count}
                          customColor={col.color}
                          onClick={count > 0 ? () => handleCellClick(row.customer, col.status) : undefined}
                          className="min-w-24"
                        />
                      );
                    })}
                    <StatusCell
                      value={row.total}
                      color="blue"
                      onClick={() => handleCellClick(row.customer)}
                      className="sticky right-0 bg-background"
                    />
                  </motion.tr>
                ))}
                
                {/* 총계 행 */}
                <tr className="border-t-2 border-border font-semibold bg-muted/30">
                  <td className="p-3 text-foreground sticky left-0 bg-muted/30 z-10 border-r border-border">
                    총계
                  </td>
                  {statusColumns.map((col) => (
                    <td
                      key={col.status}
                      className="p-3 text-center font-semibold min-w-24 border-l border-border/50"
                      style={{ color: col.color }}
                    >
                      {(statusTotals[col.status] || 0) > 0 ? (
                        <span className="font-bold">
                          {formatNumber(statusTotals[col.status] || 0)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-center font-semibold text-blue-300 sticky right-0 bg-muted/30 z-10 border-l border-border">
                    {formatNumber(totalEvents)}
                  </td>
                </tr>
              </tbody>
            </motion.table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCell({ 
  value, 
  color,
  customColor,
  onClick,
  className
}: { 
  value: number; 
  color?: 'red' | 'yellow' | 'green' | 'blue';
  customColor?: string;
  onClick?: () => void;
  className?: string;
}) {
  const colorClasses = {
    red: 'text-red-300 hover:bg-red-500/10',
    yellow: 'text-yellow-300 hover:bg-yellow-500/10',
    green: 'text-green-300 hover:bg-green-500/10',
    blue: 'text-blue-300 hover:bg-blue-500/10',
  };

  // 가시성 개선된 셀 스타일
  const cellStyle = customColor ? {
    color: customColor,
    backgroundColor: 'transparent'
  } : {};

  const cellClassName = customColor ? 
    "p-4 text-center transition-all duration-200 border-l border-border/50" :
    cn(
      "p-4 text-center transition-colors border-l border-border/50",
      color && colorClasses[color]
    );

  return (
    <td 
      className={cn(
        cellClassName,
        onClick && value > 0 && "cursor-pointer hover:bg-accent/30",
        className
      )}
      style={cellStyle}
      onClick={onClick}
      title={onClick && value > 0 ? `클릭하여 Jira에서 보기 (${value}건)` : undefined}
    >
      {value > 0 ? (
        <div className="flex flex-col items-center">
          <div 
            className="font-bold text-lg leading-tight"
            style={{
              color: customColor || '#6b7280'
            }}
          >
            {formatNumber(value)}
          </div>
          <div 
            className="w-6 h-1 mt-1 rounded-sm"
            style={{
              backgroundColor: customColor || '#6b7280'
            }}
          />
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      )}
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