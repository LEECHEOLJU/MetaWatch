import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Mail, Edit3, Trash2, CheckCircle, AlertCircle, Tag, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CustomerIssue, PRIORITY_COLORS, REQUEST_TYPES } from '@/types/customer-issues';
import { getCustomerColor } from '@/lib/customer-colors';

interface CustomerIssueCardProps {
  issue: CustomerIssue;
  onEdit?: (issue: CustomerIssue) => void;
  onDelete?: (issueId: string) => void;
  onStatusChange?: (issueId: string, priority: CustomerIssue['priority']) => void;
  onViewEmail?: (issue: CustomerIssue) => void;
  className?: string;
}

export function CustomerIssueCard({ 
  issue, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onViewEmail,
  className 
}: CustomerIssueCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const priority = PRIORITY_COLORS[issue.priority];
  const customerColors = getCustomerColor(issue.customer_code);
  
  // 요청 타입 찾기
  const requestType = REQUEST_TYPES.find(type => 
    issue.ai_analysis?.request_type?.toLowerCase().includes(type.id) ||
    issue.title.toLowerCase().includes(type.label.toLowerCase())
  ) || REQUEST_TYPES.find(type => type.id === 'other')!;

  // 만료일 계산
  const getDaysUntilDue = () => {
    if (!issue.due_date) return null;
    const now = new Date();
    const due = new Date(issue.due_date);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 1;

  return (
    <motion.div
      className={cn('h-full', className)}
      whileHover={{ y: -1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layout
    >
      <Card 
        className={cn(
          'h-full transition-all duration-200 cursor-pointer',
          priority.border,
          priority.bg,
          'hover:shadow-md hover:shadow-black/10',
          issue.priority === 'urgent' && 'animate-pulse',
          isOverdue && 'ring-1 ring-red-500/30'
        )}
      >
        <CardContent className="p-3 h-full flex flex-col">
          {/* 컴팩트 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: customerColors.primary }}
              />
              <span 
                className="font-medium text-xs"
                style={{ color: customerColors.primary }}
              >
                {issue.customer_name}
              </span>
              <span className="text-sm">{requestType.icon}</span>
            </div>
            
            <div className="flex items-center gap-1">
              {/* 수기 작성 표시 */}
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-1 py-0">
                ✏️
              </Badge>
            </div>
          </div>

          {/* 제목 (더 간결하게) */}
          <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight mb-2">
            {issue.title}
          </h4>

          {/* 요약 설명 (한 줄만) */}
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2 flex-1">
            {issue.description}
          </p>

          {/* 관련 IP들 (더 간결하게) */}
          {issue.related_ips && issue.related_ips.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {issue.related_ips.slice(0, 1).map((ip, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                    {ip}
                  </Badge>
                ))}
                {issue.related_ips.length > 1 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{issue.related_ips.length - 1}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 간단한 날짜 및 액션 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(issue.created_at).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}</span>
            </div>

            <div className="flex items-center gap-1">
              {/* 편집 */}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(issue);
                  }}
                  title="편집"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}

              {/* 완료 처리 */}
              {onStatusChange && issue.priority !== 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-green-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(issue.id, 'completed');
                  }}
                  title="완료 처리"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}

              {/* 삭제 */}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(issue.id);
                  }}
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}