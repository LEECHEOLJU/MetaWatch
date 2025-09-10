import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, User, ExternalLink, RefreshCw, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TimeDisplay } from '@/components/ui/time-display';
import CountUp from 'react-countup';

interface SecurityEvent {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  customer: string;
  customerName: string;
  created: string;
  assignee: string;
  age: number;
}

interface SecurityEventsResponse {
  events: SecurityEvent[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byCustomer: Record<string, number>;
    byPriority: Record<string, number>;
    urgentCount: number;
    recentCount: number;
  };
  query: any;
  lastUpdated: string;
}

export function UrgentSecurityEventsWidget() {
  const { data, isLoading, error, isRefetching } = useQuery({
    queryKey: ['unresolved-events'],
    queryFn: async (): Promise<SecurityEventsResponse> => {
      const response = await fetch('/api/jira/unresolved-events?maxResults=100');
      if (!response.ok) {
        throw new Error('Failed to fetch unresolved events');
      }
      return response.json();
    },
    refetchInterval: 30 * 1000, // 30초마다 업데이트
    refetchIntervalInBackground: true,
  });

  // 모든 미해결 이벤트 표시
  const unresolvedEvents = data?.events || [];
  const totalUnresolved = unresolvedEvents.length;
  const veryOldEvents = unresolvedEvents.filter(e => e.age > 8); // 8시간 이상 된 것들

  if (error) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              보안이벤트를 불러올 수 없습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      totalUnresolved > 0 ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {totalUnresolved > 0 ? (
              <Bell className="h-5 w-5 text-red-500 animate-pulse" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-green-500" />
            )}
            <CardTitle className="text-xl">미해결 보안이벤트</CardTitle>
            {isRefetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={cn(
                "text-3xl font-bold",
                totalUnresolved > 0 ? "text-red-500" : "text-green-500"
              )}>
                <CountUp end={totalUnresolved} duration={0.8} />
              </div>
              <div className="text-xs text-muted-foreground">미해결 건수</div>
            </div>
            {data?.stats && (
              <div className="text-right">
                <div className="text-lg font-medium text-blue-400">
                  <CountUp end={data.stats.total} duration={0.8} />
                </div>
                <div className="text-xs text-muted-foreground">전체 미해결</div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted/50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : unresolvedEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-lg font-medium text-green-500 mb-1">
              미해결 보안이벤트가 없습니다!
            </p>
            <p className="text-sm text-muted-foreground">
              모든 이벤트가 정상적으로 처리되었습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {unresolvedEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <SecurityEventCard 
                    event={event} 
                    isVeryOld={event.age > 8}
                    isNew={event.age < 1}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {veryOldEvents.length > 0 && (
              <div className="col-span-full mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    ⚠️ {veryOldEvents.length}건의 오래된 이벤트가 있습니다 (8시간 이상)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityEventCard({ 
  event, 
  isVeryOld = false, 
  isNew = false 
}: { 
  event: SecurityEvent; 
  isVeryOld?: boolean; 
  isNew?: boolean; 
}) {
  const handleOpenJira = () => {
    window.open(
      `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/browse/${event.key}`,
      '_blank'
    );
  };

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer h-full flex flex-col",
        isVeryOld && "border-orange-500/30 bg-orange-500/5",
        isNew && "border-blue-500/30 bg-blue-500/5",
        !isVeryOld && !isNew && "border-border bg-card/50"
      )}
      onClick={handleOpenJira}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 flex-wrap">
          {isNew && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs animate-pulse">
              NEW
            </Badge>
          )}
          <Badge 
            variant={getStatusVariant(event.status)}
            className="text-xs"
          >
            {event.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenJira();
          }}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="text-xs font-mono text-muted-foreground mb-1">
        {event.key}
      </div>
      
      <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2 flex-1">
        {event.summary}
      </h4>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-blue-400 truncate">
            {event.customerName}
          </span>
          <Badge 
            variant={getPriorityVariant(event.priority)}
            className="text-xs"
          >
            {event.priority}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <TimeDisplay 
              date={event.created}
              className={cn(
                "truncate",
                isVeryOld && "text-orange-400 font-medium",
                isNew && "text-blue-400 font-medium"
              )}
            />
          </div>
          
          {event.assignee !== 'Unassigned' && (
            <div className="flex items-center gap-1 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate text-xs">{event.assignee}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusVariant(status: string): "default" | "destructive" | "secondary" | "outline" {
  if (status.includes('미해결')) return 'destructive';
  if (status.includes('완료')) return 'secondary';
  if (status.includes('대기')) return 'outline';
  return 'default';
}

function getPriorityVariant(priority: string): "default" | "destructive" | "secondary" | "outline" {
  if (priority.includes('High')) return 'destructive';
  if (priority.includes('Medium')) return 'outline';
  if (priority.includes('Low')) return 'secondary';
  return 'default';
}