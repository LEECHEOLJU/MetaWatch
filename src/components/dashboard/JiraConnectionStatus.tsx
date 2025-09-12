import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, RefreshCw, Server, User, FolderOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JiraConnectionResponse {
  status: 'connected' | 'error';
  domain: string;
  user?: {
    accountId: string;
    displayName: string;
    emailAddress: string;
  };
  projects?: Array<{
    key: string;
    name: string;
  }>;
  responseTime?: number;
  error?: string;
  timestamp: string;
}

export function JiraConnectionStatus() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['jira-connection-status'],
    queryFn: async (): Promise<JiraConnectionResponse> => {
      const response = await fetch('/api/jira/test-connection');
      if (!response.ok) {
        throw new Error('Failed to check Jira connection');
      }
      return response.json();
    },
    refetchInterval: 2 * 60 * 1000, // 2분마다 자동 확인
    refetchIntervalInBackground: true,
  });

  const isConnected = data?.status === 'connected';
  const hasError = error || data?.status === 'error';

  return (
    <Card className={cn(
      "transition-all duration-200",
      isConnected && "border-green-500/30 bg-green-500/5",
      hasError && "border-red-500/30 bg-red-500/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoading || isRefetching ? (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            ) : isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <CardTitle className="text-base">Jira 연결 상태</CardTitle>
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className={cn(
                "text-xs",
                isConnected && "bg-green-500/20 text-green-300 border-green-500/30",
                hasError && "bg-red-500/20 text-red-300 border-red-500/30"
              )}
            >
              {isLoading ? "확인중..." : isConnected ? "연결됨" : "연결 실패"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <CardContent className="pt-0 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* 연결 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 도메인 */}
                    <div className="flex items-center gap-2 text-sm">
                      <Server className="h-4 w-4 text-blue-400" />
                      <div>
                        <div className="text-xs text-muted-foreground">도메인</div>
                        <div className="font-medium">{data?.domain}</div>
                      </div>
                    </div>

                    {/* 사용자 정보 */}
                    {data?.user && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-green-400" />
                        <div>
                          <div className="text-xs text-muted-foreground">로그인 계정</div>
                          <div className="font-medium truncate">{data.user.displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">{data.user.emailAddress}</div>
                        </div>
                      </div>
                    )}

                    {/* 프로젝트 수 */}
                    {data?.projects && (
                      <div className="flex items-center gap-2 text-sm">
                        <FolderOpen className="h-4 w-4 text-purple-400" />
                        <div>
                          <div className="text-xs text-muted-foreground">연동 프로젝트</div>
                          <div className="font-medium">{data.projects.length}개</div>
                        </div>
                      </div>
                    )}

                    {/* 응답 시간 */}
                    {data?.responseTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <div>
                          <div className="text-xs text-muted-foreground">응답 시간</div>
                          <div className="font-medium">{data.responseTime}ms</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 프로젝트 목록 */}
                  {data?.projects && data.projects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">연동된 프로젝트</h4>
                      <div className="flex flex-wrap gap-1">
                        {data.projects.map((project) => (
                          <Badge key={project.key} variant="outline" className="text-xs">
                            {project.key}: {project.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 에러 메시지 */}
                  {hasError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">연결 오류</span>
                      </div>
                      <div className="text-sm text-red-300 mt-1">
                        {error?.message || data?.error || '알 수 없는 오류가 발생했습니다'}
                      </div>
                    </div>
                  )}

                  {/* 마지막 확인 시간 */}
                  {data?.timestamp && (
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
                      마지막 확인: {new Date(data.timestamp).toLocaleString('ko-KR')}
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}