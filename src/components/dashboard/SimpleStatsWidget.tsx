import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

interface SimpleStatsResponse {
  total: number;
  tickets: Array<{
    key: string;
    summary: string;
    status: string;
    priority: string;
    customer: string;
    created: string;
  }>;
  statusCounts: Record<string, number>;
  customerCounts: Record<string, number>;
  availableStatuses: string[];
  availablePriorities: string[];
  lastUpdated: string;
}

export function SimpleStatsWidget() {
  const { data, isLoading, error, isRefetching } = useQuery({
    queryKey: ['simple-stats'],
    queryFn: async (): Promise<SimpleStatsResponse> => {
      const response = await fetch('/api/jira/simple-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch simple stats');
      }
      return response.json();
    },
    refetchInterval: 2 * 60 * 1000, // 2분마다
  });

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              통계를 불러올 수 없습니다
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
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <CardTitle>보안이벤트 통계</CardTitle>
            {isRefetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-500">
              {formatNumber(data?.total || 0)}
            </div>
            <div className="text-xs text-muted-foreground">총 이벤트</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 상태별 통계 */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">상태별 분포</h4>
              <div className="flex flex-wrap gap-2">
                {data?.statusCounts && Object.entries(data.statusCounts).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-xs">
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 고객사별 통계 */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">고객사별 분포</h4>
              <div className="flex flex-wrap gap-2">
                {data?.customerCounts && Object.entries(data.customerCounts).map(([customer, count]) => (
                  <Badge key={customer} variant="secondary" className="text-xs">
                    {customer}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 사용 가능한 필드값 표시 */}
            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-medium mb-1 text-muted-foreground">사용 가능한 상태</h4>
              <p className="text-xs text-muted-foreground">
                {data?.availableStatuses?.join(', ') || 'No data'}
              </p>
              <h4 className="text-xs font-medium mb-1 mt-2 text-muted-foreground">사용 가능한 우선순위</h4>
              <p className="text-xs text-muted-foreground">
                {data?.availablePriorities?.join(', ') || 'No data'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}