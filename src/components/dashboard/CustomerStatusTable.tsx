import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Filter, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomerStatusCount } from '@/types/jira';
import { formatNumber, cn } from '@/lib/utils';
import { UPDATE_INTERVALS } from '@/lib/constants';

interface CustomerStatusResponse {
  data: CustomerStatusCount[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  lastUpdated: string;
}

export function CustomerStatusTable() {
  const [selectedDays, setSelectedDays] = useState(7);
  
  const { data, isLoading, error, isRefetching, refetch } = useQuery({
    queryKey: ['customer-status', selectedDays],
    queryFn: async (): Promise<CustomerStatusResponse> => {
      const response = await fetch(`/api/jira/customer-status?days=${selectedDays}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer status');
      }
      return response.json();
    },
    refetchInterval: UPDATE_INTERVALS.STATUS_TABLE,
    refetchIntervalInBackground: true,
  });

  const statusData = data?.data || [];
  const totalCounts = calculateTotals(statusData);

  const handleCellClick = (customer: string, status: string, count: number) => {
    if (count === 0) return;
    
    // 해당 조건의 Jira 검색 페이지로 이동
    const jqlQuery = encodeURIComponent(
      `project = "${customer}" AND issuetype="보안이벤트" AND status="${getStatusName(status)}"`
    );
    const jiraUrl = `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/issues/?jql=${jqlQuery}`;
    window.open(jiraUrl, '_blank');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Building2 className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              고객사 현황을 불러올 수 없습니다
            </p>
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
            <CardTitle>고객사별 티켓 현황</CardTitle>
            {isRefetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <DateRangeFilter
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
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
        
        {data?.dateRange && (
          <p className="text-sm text-muted-foreground">
            기간: {data.dateRange.startDate} ~ {data.dateRange.endDate}
          </p>
        )}
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
                  <th className="text-center p-3 font-medium text-orange-300">승인필요</th>
                  <th className="text-center p-3 font-medium text-gray-300">오탐확인</th>
                  <th className="text-center p-3 font-medium text-yellow-300">미승인</th>
                  <th className="text-center p-3 font-medium text-yellow-300">승인대기</th>
                  <th className="text-center p-3 font-medium text-green-300">기차단</th>
                  <th className="text-center p-3 font-medium text-green-300">승인차단</th>
                  <th className="text-center p-3 font-medium text-green-300">협의차단</th>
                  <th className="text-center p-3 font-medium text-blue-300">총계</th>
                </tr>
              </thead>
              <tbody>
                {statusData.map((row, index) => (
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
                      onClick={() => handleCellClick(row.customer, 'unresolved', row.unresolved)}
                    />
                    <StatusCell
                      value={row.requiresApproval}
                      color="orange"
                      onClick={() => handleCellClick(row.customer, 'requiresApproval', row.requiresApproval)}
                    />
                    <StatusCell
                      value={row.falsePositive}
                      color="gray"
                      onClick={() => handleCellClick(row.customer, 'falsePositive', row.falsePositive)}
                    />
                    <StatusCell
                      value={row.unapprovedBlocking}
                      color="yellow"
                      onClick={() => handleCellClick(row.customer, 'unapprovedBlocking', row.unapprovedBlocking)}
                    />
                    <StatusCell
                      value={row.pendingApproval}
                      color="yellow"
                      onClick={() => handleCellClick(row.customer, 'pendingApproval', row.pendingApproval)}
                    />
                    <StatusCell
                      value={row.preBlocked}
                      color="green"
                      onClick={() => handleCellClick(row.customer, 'preBlocked', row.preBlocked)}
                    />
                    <StatusCell
                      value={row.approvedBlocking}
                      color="green"
                      onClick={() => handleCellClick(row.customer, 'approvedBlocking', row.approvedBlocking)}
                    />
                    <StatusCell
                      value={row.agreedBlocking}
                      color="green"
                      onClick={() => handleCellClick(row.customer, 'agreedBlocking', row.agreedBlocking)}
                    />
                    <StatusCell
                      value={row.total}
                      color="blue"
                      onClick={() => handleCellClick(row.customer, 'total', row.total)}
                    />
                  </motion.tr>
                ))}
                
                {/* 총계 행 */}
                <tr className="border-t-2 border-border font-medium bg-accent/10">
                  <td className="p-3 text-foreground">총계</td>
                  <StatusCell value={totalCounts.unresolved} color="red" />
                  <StatusCell value={totalCounts.requiresApproval} color="orange" />
                  <StatusCell value={totalCounts.falsePositive} color="gray" />
                  <StatusCell value={totalCounts.unapprovedBlocking} color="yellow" />
                  <StatusCell value={totalCounts.pendingApproval} color="yellow" />
                  <StatusCell value={totalCounts.preBlocked} color="green" />
                  <StatusCell value={totalCounts.approvedBlocking} color="green" />
                  <StatusCell value={totalCounts.agreedBlocking} color="green" />
                  <StatusCell value={totalCounts.total} color="blue" />
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
  onClick 
}: { 
  value: number; 
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray';
  onClick?: () => void;
}) {
  const colorClasses = {
    red: 'text-red-300 hover:bg-red-500/10',
    orange: 'text-orange-300 hover:bg-orange-500/10',
    yellow: 'text-yellow-300 hover:bg-yellow-500/10',
    green: 'text-green-300 hover:bg-green-500/10',
    blue: 'text-blue-300 hover:bg-blue-500/10',
    gray: 'text-gray-300 hover:bg-gray-500/10',
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
}: {
  selectedDays: number;
  onDaysChange: (days: number) => void;
}) {
  const options = [
    { label: '1일', value: 1 },
    { label: '3일', value: 3 },
    { label: '7일', value: 7 },
    { label: '30일', value: 30 },
  ];

  return (
    <div className="flex items-center gap-1">
      <Filter className="h-4 w-4 text-muted-foreground" />
      {options.map(option => (
        <Button
          key={option.value}
          variant={selectedDays === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onDaysChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function calculateTotals(data: CustomerStatusCount[]) {
  return data.reduce((totals, row) => ({
    unresolved: totals.unresolved + row.unresolved,
    requiresApproval: totals.requiresApproval + row.requiresApproval,
    falsePositive: totals.falsePositive + row.falsePositive,
    unapprovedBlocking: totals.unapprovedBlocking + row.unapprovedBlocking,
    pendingApproval: totals.pendingApproval + row.pendingApproval,
    preBlocked: totals.preBlocked + row.preBlocked,
    approvedBlocking: totals.approvedBlocking + row.approvedBlocking,
    agreedBlocking: totals.agreedBlocking + row.agreedBlocking,
    total: totals.total + row.total,
  }), {
    unresolved: 0,
    requiresApproval: 0,
    falsePositive: 0,
    unapprovedBlocking: 0,
    pendingApproval: 0,
    preBlocked: 0,
    approvedBlocking: 0,
    agreedBlocking: 0,
    total: 0,
  });
}

function getStatusName(statusKey: string): string {
  const statusMap: Record<string, string> = {
    unresolved: '미해결',
    requiresApproval: '정탐(승인필요 대상)',
    falsePositive: '오탐 확인 완료',
    unapprovedBlocking: '차단 미승인 완료',
    pendingApproval: '승인 대기',
    preBlocked: '기 차단 완료',
    approvedBlocking: '승인 후 차단 완료',
    agreedBlocking: '협의된 차단 완료',
  };
  
  return statusMap[statusKey] || statusKey;
}