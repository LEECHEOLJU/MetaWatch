import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wifi, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConnectionTestResponse {
  message: string;
  user: {
    displayName: string;
    emailAddress: string;
  };
  projects: Array<{
    key: string;
    name: string;
  }>;
  config: {
    domain: string;
    baseUrl: string;
  };
}

export function ConnectionTestWidget() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['connection-test'],
    queryFn: async (): Promise<ConnectionTestResponse> => {
      const response = await fetch('/api/jira/test-connection');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection test failed');
      }
      return response.json();
    },
    retry: false,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-500">Jira 연결 실패</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button 
              onClick={() => refetch()} 
              disabled={isRefetching}
              variant="outline" 
              size="sm"
            >
              {isRefetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : '다시 시도'}
            </Button>
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
            <Wifi className="h-5 w-5 text-green-500" />
            <CardTitle>Jira 연결 상태</CardTitle>
            {isRefetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isRefetching}
            variant="ghost" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        ) : data ? (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 연결 상태 */}
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">연결됨</span>
              <Badge variant="outline" className="text-xs">
                {data.config.domain}
              </Badge>
            </div>

            {/* 사용자 정보 */}
            <div>
              <h4 className="text-sm font-medium mb-1 text-muted-foreground">로그인 사용자</h4>
              <p className="text-sm text-foreground">{data.user.displayName}</p>
              <p className="text-xs text-muted-foreground">{data.user.emailAddress}</p>
            </div>

            {/* 사용 가능한 프로젝트 */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                사용 가능한 프로젝트 ({data.projects.length}개)
              </h4>
              <div className="flex flex-wrap gap-1">
                {data.projects.slice(0, 10).map((project) => (
                  <Badge key={project.key} variant="secondary" className="text-xs">
                    {project.key}
                  </Badge>
                ))}
                {data.projects.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.projects.length - 10}개 더
                  </Badge>
                )}
              </div>
            </div>

            {/* 중요한 프로젝트 확인 */}
            <div>
              <h4 className="text-sm font-medium mb-1 text-muted-foreground">보안이벤트 프로젝트 확인</h4>
              <div className="flex flex-wrap gap-1">
                {['GOODRICH', 'KURLY', 'FINDA', 'SAMKOO', 'WCVS', 'GLN', 'ISU'].map(key => {
                  const hasProject = data.projects.some(p => p.key === key);
                  return (
                    <Badge 
                      key={key} 
                      variant={hasProject ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {key} {hasProject ? '✓' : '✗'}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </CardContent>
    </Card>
  );
}