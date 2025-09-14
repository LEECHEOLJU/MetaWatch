import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CustomerIssueCard } from './CustomerIssueCard';
import { ManualIssueModal } from './ManualIssueModal';
import { EditIssueModal } from './EditIssueModal';
import { CustomerIssue, IssuePriority } from '@/types/customer-issues';

interface CustomerIssuesManagerProps {
  className?: string;
}

export function CustomerIssuesManager({ className }: CustomerIssuesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<IssuePriority | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<CustomerIssue | null>(null);
  
  const queryClient = useQueryClient();

  // 이슈 목록 조회
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['customer-issues', searchTerm, selectedCustomer, selectedPriority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCustomer) params.append('customer', selectedCustomer);
      if (selectedPriority) params.append('priority', selectedPriority);
      
      const response = await fetch(`/api/customer-issues?${params}`);
      if (!response.ok) throw new Error('Failed to fetch issues');
      return response.json();
    },
    refetchInterval: 30000, // 30초마다 자동 업데이트
  });

  // 이슈 생성 뮤테이션
  const createIssueMutation = useMutation({
    mutationFn: async (issueData: Partial<CustomerIssue>) => {
      const response = await fetch('/api/customer-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });
      if (!response.ok) throw new Error('Failed to create issue');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-issues'] });
    }
  });

  // 이슈 업데이트 뮤테이션  
  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomerIssue> & { id: string }) => {
      const response = await fetch(`/api/customer-issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update issue');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-issues'] });
    }
  });

  // 이슈 삭제 뮤테이션
  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customer-issues/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete issue');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-issues'] });
    }
  });


  // 이슈 상태 변경 핸들러
  const handleStatusChange = useCallback((issueId: string, priority: IssuePriority) => {
    updateIssueMutation.mutate({
      id: issueId,
      priority,
      updated_at: new Date().toISOString()
    });
  }, [updateIssueMutation]);

  // 이슈 삭제 핸들러
  const handleDelete = useCallback((issueId: string) => {
    if (confirm('이 요청사항을 삭제하시겠습니까?')) {
      deleteIssueMutation.mutate(issueId);
    }
  }, [deleteIssueMutation]);

  // 이슈 편집 핸들러
  const handleEdit = useCallback((issue: CustomerIssue) => {
    setEditingIssue(issue);
  }, []);

  // 이슈 편집 저장 핸들러
  const handleEditSave = useCallback(async (issueId: string, updates: Partial<CustomerIssue>) => {
    await updateIssueMutation.mutateAsync({ id: issueId, ...updates });
    setEditingIssue(null);
  }, [updateIssueMutation]);

  // 고객사명 매핑
  const getCustomerName = (code: string): string => {
    const mapping: Record<string, string> = {
      'GLN': 'GLN',
      'GOODRICH': '굿리치',
      'FINDA': '핀다',
      'SAMKOO': '삼구아이앤씨',
      'WCVS': '한화위캠버스',
      'KURLY': '컬리',
      'ISU': '이수시스템',
      'UNKNOWN': '미분류'
    };
    return mapping[code] || code;
  };

  // 필터링된 이슈들
  const filteredIssues = issues.filter((issue: CustomerIssue) => {
    if (selectedCustomer && issue.customer_code !== selectedCustomer) return false;
    if (selectedPriority && issue.priority !== selectedPriority) return false;
    if (searchTerm && !issue.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !issue.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // 통계 계산
  const stats = {
    total: filteredIssues.length,
    urgent: filteredIssues.filter(i => i.priority === 'urgent').length,
    normal: filteredIssues.filter(i => i.priority === 'normal').length,
    completed: filteredIssues.filter(i => i.priority === 'completed').length,
    on_hold: filteredIssues.filter(i => i.priority === 'on_hold').length
  };

  // 고객사 목록
  const customers: string[] = Array.from(new Set(issues.map((issue: any) => issue.customer_code))) as string[];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">🗂️ 고객사별 요청사항 관리</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              고객사별 보안 관련 요청사항을 체계적으로 관리하세요
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 통계 배지들 */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                긴급 {stats.urgent}
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                보통 {stats.normal}
              </Badge>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                완료 {stats.completed}
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                총 {stats.total}
              </Badge>
            </div>
            
            {/* 요청사항 추가 버튼 */}
            <Button 
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              요청사항 추가
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">        
        {/* 필터 및 검색 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="요청사항 제목이나 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* 고객사 필터 */}
          <select
            value={selectedCustomer || ''}
            onChange={(e) => setSelectedCustomer(e.target.value || null)}
            className="px-3 py-2 text-sm border border-input bg-background rounded-md"
          >
            <option value="">모든 고객사</option>
            {customers.map(customer => (
              <option key={customer} value={customer}>
                {getCustomerName(customer)}
              </option>
            ))}
          </select>
          
          {/* 우선순위 필터 */}
          <select
            value={selectedPriority || ''}
            onChange={(e) => setSelectedPriority((e.target.value as IssuePriority) || null)}
            className="px-3 py-2 text-sm border border-input bg-background rounded-md"
          >
            <option value="">모든 상태</option>
            <option value="urgent">긴급</option>
            <option value="normal">보통</option>
            <option value="completed">완료</option>
            <option value="on_hold">보류</option>
          </select>
        </div>

        {/* 이슈 카드 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card className="h-32 bg-muted/50" />
              </div>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">요청사항이 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedCustomer || selectedPriority 
                ? '검색 조건에 맞는 요청사항이 없습니다.' 
                : '"요청사항 추가" 버튼을 클릭하여 새 요청사항을 등록하세요.'}
            </p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            layout
          >
            <AnimatePresence>
              {filteredIssues.map((issue: CustomerIssue) => (
                <motion.div
                  key={issue.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CustomerIssueCard
                    issue={issue}
                    onEdit={handleEdit}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </CardContent>
      
      {/* 요청사항 추가 모달 */}
      <ManualIssueModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSave={createIssueMutation.mutateAsync}
      />
      
      {/* 요청사항 편집 모달 */}
      <EditIssueModal
        isOpen={!!editingIssue}
        onClose={() => setEditingIssue(null)}
        onSave={handleEditSave}
        issue={editingIssue}
      />
    </Card>
  );
}