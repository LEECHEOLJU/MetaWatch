import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, User, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UrgentTicketSummary } from '@/types/jira';
import { getPriorityColor, cn } from '@/lib/utils';
import { TimeDisplay } from '@/components/ui/time-display';
import { UPDATE_INTERVALS } from '@/lib/constants';
import CountUp from 'react-countup';

interface UrgentTicketsResponse {
  tickets: UrgentTicketSummary[];
  total: number;
  lastUpdated: string;
}

export function UrgentTicketsWidget() {
  const { data, isLoading, error, isRefetching } = useQuery({
    queryKey: ['urgent-tickets'],
    queryFn: async (): Promise<UrgentTicketsResponse> => {
      const response = await fetch('/api/jira/urgent-tickets');
      if (!response.ok) {
        throw new Error('Failed to fetch urgent tickets');
      }
      return response.json();
    },
    refetchInterval: UPDATE_INTERVALS.URGENT_TICKETS,
    refetchIntervalInBackground: true,
  });

  const urgentTickets = data?.tickets || [];
  const totalCount = data?.total || 0;

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              긴급 티켓을 불러올 수 없습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-xl">긴급 미해결 티켓</CardTitle>
            {isRefetching && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-red-500">
                <CountUp end={totalCount} duration={0.8} />
              </div>
              <div className="text-xs text-muted-foreground">총 건수</div>
            </div>
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
        ) : urgentTickets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-lg font-medium text-green-500 mb-1">
              긴급 티켓이 없습니다!
            </p>
            <p className="text-sm text-muted-foreground">
              모든 티켓이 정상적으로 처리되었습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {urgentTickets.slice(0, 10).map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TicketCard ticket={ticket} />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {urgentTickets.length > 10 && (
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  상위 10개 티켓만 표시 중 (총 {urgentTickets.length}건)
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TicketCard({ ticket }: { ticket: UrgentTicketSummary }) {
  const priorityColor = getPriorityColor(ticket.priority);
  const isVeryOld = ticket.age > 24; // More than 24 hours
  
  const handleOpenJira = () => {
    window.open(
      `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/browse/${ticket.key}`,
      '_blank'
    );
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer",
        isVeryOld ? "border-red-500/30 bg-red-500/5" : "border-border bg-card/50"
      )}
      onClick={handleOpenJira}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={priorityColor as any}
              className={cn(
                "text-xs",
                priorityColor === 'red' && "bg-red-500/20 text-red-300 border-red-500/30"
              )}
            >
              {ticket.priority}
            </Badge>
            <span className="text-sm font-mono text-muted-foreground">
              {ticket.key}
            </span>
            <span className="text-sm text-blue-400">
              {ticket.customer}
            </span>
          </div>
          
          <h4 className="font-medium text-foreground line-clamp-1 mb-2">
            {ticket.summary}
          </h4>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <TimeDisplay 
                date={ticket.created}
                className={cn(
                  isVeryOld && "text-red-400 font-medium"
                )}
              />
              {isVeryOld && (
                <span className="text-red-400 font-medium">
                  ({ticket.age}시간 경과)
                </span>
              )}
            </div>
            
            {ticket.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{ticket.assignee}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenJira();
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}