import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Building2, FileText, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CustomerIssue, REQUEST_TYPES } from '@/types/customer-issues';
import { getCustomerColor } from '@/lib/customer-colors';

interface EditIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issueId: string, updates: Partial<CustomerIssue>) => Promise<void>;
  issue: CustomerIssue | null;
}

const CUSTOMERS = [
  { code: 'GLN', name: 'GLN' },
  { code: 'GOODRICH', name: '굿리치' },
  { code: 'FINDA', name: '핀다' },
  { code: 'SAMKOO', name: '삼구아이앤씨' },
  { code: 'WCVS', name: '한화위캠버스' },
  { code: 'KURLY', name: '컬리' },
  { code: 'ISU', name: '이수시스템' },
];

export function EditIssueModal({ isOpen, onClose, onSave, issue }: EditIssueModalProps) {
  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    title: '',
    description: '',
    request_type: 'other',
    related_ips: '',
    tags: '',
    due_date: '',
    has_due_date: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이슈 데이터를 폼에 로드
  useEffect(() => {
    if (issue && isOpen) {
      const dueDate = issue.due_date ? new Date(issue.due_date).toISOString().split('T')[0] : '';
      setFormData({
        customer_code: issue.customer_code,
        customer_name: issue.customer_name,
        title: issue.title,
        description: issue.description,
        request_type: issue.ai_analysis?.request_type || 'other',
        related_ips: issue.related_ips?.join(', ') || '',
        tags: issue.tags?.join(', ') || '',
        due_date: dueDate,
        has_due_date: !!issue.due_date,
      });
    }
  }, [issue, isOpen]);

  const handleCustomerChange = (customerCode: string) => {
    const customer = CUSTOMERS.find(c => c.code === customerCode);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_code: customer.code,
        customer_name: customer.name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !issue) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<CustomerIssue> = {
        customer_code: formData.customer_code,
        customer_name: formData.customer_name,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: 'normal',
        related_ips: formData.related_ips.trim() 
          ? formData.related_ips.split(',').map(ip => ip.trim()).filter(ip => ip)
          : [],
        tags: formData.tags.trim()
          ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          : [],
        due_date: formData.has_due_date && formData.due_date 
          ? new Date(formData.due_date + 'T23:59:59Z').toISOString()
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      await onSave(issue.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to update issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCustomer = CUSTOMERS.find(c => c.code === formData.customer_code);
  const customerColors = selectedCustomer ? getCustomerColor(selectedCustomer.code) : null;
  const selectedRequestType = REQUEST_TYPES.find(t => t.id === formData.request_type) || REQUEST_TYPES[0];

  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-auto"
      >
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                요청사항 수정
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 고객사 선택 */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  고객사
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMERS.map((customer) => {
                    const colors = getCustomerColor(customer.code);
                    const isSelected = formData.customer_code === customer.code;
                    return (
                      <button
                        key={customer.code}
                        type="button"
                        onClick={() => handleCustomerChange(customer.code)}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-md border transition-all duration-200',
                          isSelected 
                            ? 'border-2 font-medium' 
                            : 'border opacity-60 hover:opacity-100'
                        )}
                        style={{
                          borderColor: colors.primary,
                          backgroundColor: isSelected ? colors.light + '20' : 'transparent',
                          color: colors.primary
                        }}
                      >
                        {customer.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 요청 타입 */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">
                  📋 요청 카테고리 *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/10">
                  {REQUEST_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, request_type: type.id }))}
                      className={cn(
                        'p-2 text-left text-xs rounded-md border transition-all duration-200 hover:bg-muted/50',
                        formData.request_type === type.id 
                          ? 'border-2 border-primary bg-primary/10 font-medium' 
                          : 'border bg-background'
                      )}
                      title={type.description}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{type.icon}</span>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-muted-foreground text-xs leading-tight">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  제목 *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="요청사항 제목을 입력하세요"
                  required
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  설명 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="상세 설명을 입력하세요"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none"
                  required
                />
              </div>

              {/* 관련 IP */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  관련 IP 주소
                </label>
                <Input
                  value={formData.related_ips}
                  onChange={(e) => setFormData(prev => ({ ...prev, related_ips: e.target.value }))}
                  placeholder="192.168.1.1, 10.0.0.1 (쉼표로 구분)"
                />
              </div>

              {/* 태그 */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  <Tag className="h-4 w-4 inline mr-1" />
                  태그
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="긴급, 보안, VPN (쉼표로 구분)"
                />
              </div>

              {/* 만료날짜 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="edit_has_due_date"
                    checked={formData.has_due_date}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      has_due_date: e.target.checked,
                      due_date: e.target.checked ? prev.due_date : ''
                    }))}
                    className="h-4 w-4"
                  />
                  <label htmlFor="edit_has_due_date" className="text-sm font-medium text-foreground">
                    📅 만료일 지정
                  </label>
                </div>
                {formData.has_due_date && (
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-2"
                  />
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!formData.title.trim() || !formData.description.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}