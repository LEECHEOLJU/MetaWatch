import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Database, 
  RefreshCw, 
  Play, 
  Settings, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatNumber } from '@/lib/utils';
import { TimeDisplay } from '@/components/ui/time-display';

interface SyncStatus {
  status: string;
  timestamp: string;
  overview: {
    totalTickets: number;
    todaysTickets: number;
    syncEnabled: boolean;
    hasRunningSyncs: boolean;
  };
  runningSyncs: Array<{
    id: string;
    type: string;
    startedAt: string;
    processed: number;
    runningFor: number;
  }>;
  lastSuccessful: Array<{
    type: string;
    completedAt: string;
    processed: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    status: string;
    startedAt: string;
    completedAt: string;
    processed: number;
    duration: number;
  }>;
  settings: {
    lastFullSync: string;
    lastIncrementalSync: string;
    fullSyncIntervalHours: number;
    incrementalSyncIntervalMinutes: number;
  };
  nextScheduled: {
    fullSync: string;
    incrementalSync: string;
  };
}

export function SyncManagementDashboard() {
  const queryClient = useQueryClient();
  
  const { data: syncStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async (): Promise<SyncStatus> => {
      const response = await fetch('/api/sync/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      return response.json();
    },
    refetchInterval: 10 * 1000, // 10초마다 업데이트
    refetchIntervalInBackground: true,
  });

  // 동기화 실행 뮤테이션
  const fullSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/full-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Full sync failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    }
  });

  const incrementalSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/incremental-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Incremental sync failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    }
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Sync setup failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    }
  });

  if (error) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              동기화 상태를 불러올 수 없습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overview = syncStatus?.overview;
  const runningSyncs = syncStatus?.runningSyncs || [];
  const recentActivity = syncStatus?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* 상단 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OverviewCard
          title="총 티켓 수"
          value={overview?.totalTickets || 0}
          icon={Database}
          color="blue"
          isLoading={isLoading}
        />
        <OverviewCard
          title="오늘 동기화"
          value={overview?.todaysTickets || 0}
          icon={RefreshCw}
          color="green"
          isLoading={isLoading}
        />
        <OverviewCard
          title="동기화 상태"
          value={overview?.syncEnabled ? "활성화" : "비활성화"}
          icon={Settings}
          color={overview?.syncEnabled ? "green" : "red"}
          isLoading={isLoading}
        />
        <OverviewCard
          title="실행 중"
          value={runningSyncs.length}
          icon={Activity}
          color={runningSyncs.length > 0 ? "yellow" : "gray"}
          isLoading={isLoading}
        />
      </div>

      {/* 실행 버튼들 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              <CardTitle>동기화 관리</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm">초기 설정</span>
              {setupMutation.isPending && (
                <div className="h-1 bg-blue-500 rounded animate-pulse w-full" />
              )}
            </Button>

            <Button
              onClick={() => fullSyncMutation.mutate()}
              disabled={fullSyncMutation.isPending || runningSyncs.some(s => s.type === 'full')}
              className="h-16 flex flex-col gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Database className="h-5 w-5" />
              <span className="text-sm">전체 동기화</span>
              {fullSyncMutation.isPending && (
                <div className="h-1 bg-white rounded animate-pulse w-full" />
              )}
            </Button>

            <Button
              onClick={() => incrementalSyncMutation.mutate()}
              disabled={incrementalSyncMutation.isPending || runningSyncs.some(s => s.type === 'incremental')}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-sm">증분 동기화</span>
              {incrementalSyncMutation.isPending && (
                <div className="h-1 bg-green-500 rounded animate-pulse w-full" />
              )}
            </Button>

            <Button
              variant="outline"
              disabled
              className="h-16 flex flex-col gap-1 opacity-50"
            >
              <Activity className="h-5 w-5" />
              <span className="text-sm">실시간 동기화</span>
              <span className="text-xs text-muted-foreground">자동 실행</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 실행 중인 동기화 */}
      {runningSyncs.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />
              실행 중인 동기화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runningSyncs.map(sync => (
                <div key={sync.id} className="p-3 border rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        {sync.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm">처리됨: {sync.processed}건</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      실행 시간: {Math.floor(sync.runningFor / 60)}분 {sync.runningFor % 60}초
                    </div>
                  </div>
                  <Progress value={Math.min(sync.processed / 10, 100)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            최근 동기화 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted/50 rounded" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              최근 동기화 활동이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {activity.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : activity.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={activity.status === 'completed' ? 'secondary' : 'destructive'}
                          >
                            {activity.type.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {activity.processed}건 처리
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <TimeDisplay date={activity.startedAt} />
                          {activity.duration && (
                            <span> • 소요시간: {activity.duration}초</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={activity.status === 'completed' ? 'secondary' : 'destructive'}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  isLoading: boolean;
}) {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
    yellow: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    gray: 'border-gray-500/30 bg-gray-500/5 text-gray-400'
  };

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted/50 rounded animate-pulse" />
              ) : typeof value === 'number' ? (
                formatNumber(value)
              ) : (
                value
              )}
            </div>
          </div>
          <Icon className="h-8 w-8 opacity-60" />
        </div>
      </CardContent>
    </Card>
  );
}