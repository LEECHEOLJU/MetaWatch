import React, { useState } from 'react';
import { Brain, Search, FileText, Zap, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIAnalysisModal } from '@/components/ai/AIAnalysisModal';
import { motion } from 'framer-motion';

export function AIAnalysisDashboard() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeTicket = () => {
    if (!ticketNumber.trim()) {
      setError('티켓 번호를 입력해주세요.');
      return;
    }

    // 간단한 티켓 번호 형식 검증 (예: GOODRICH-123, FINDA-456)
    const ticketPattern = /^[A-Z]+-\d+$/;
    if (!ticketPattern.test(ticketNumber.trim())) {
      setError('올바른 티켓 번호 형식을 입력해주세요. (예: GOODRICH-123)');
      return;
    }

    // 가상의 티켓 객체 생성 (실제로는 Jira API에서 가져와야 함)
    const mockEvent = {
      id: `analysis-${Date.now()}`,
      key: ticketNumber.trim(),
      summary: `${ticketNumber.trim()} - 분석 대상 보안 이벤트`,
      status: '분석 중',
      priority: 'High',
      customer: ticketNumber.split('-')[0],
      customerName: ticketNumber.split('-')[0],
      created: new Date().toISOString(),
      assignee: '분석가',
      age: 1
    };

    setCurrentTicket(mockEvent);
    setIsAnalysisModalOpen(true);
    setError(null);
  };

  const handleOpenJira = () => {
    if (ticketNumber.trim()) {
      window.open(
        `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/browse/${ticketNumber.trim()}`,
        '_blank'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* AI 분석 헤더 */}
      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border">
        <Brain className="h-8 w-8 text-purple-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI 보안 분석</h1>
          <p className="text-sm text-muted-foreground">Jira 티켓 데이터를 기반으로 한 지능형 위협 분석</p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30">
            베타 버전
          </Badge>
        </div>
      </div>

      {/* 티켓 분석 입력 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            티켓 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 티켓 번호 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jira 티켓 번호</label>
              <div className="flex gap-2">
                <Input
                  placeholder="예: GOODRICH-123, FINDA-456"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeTicket()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAnalyzeTicket}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Brain className="h-4 w-4" />
                  AI 분석
                </Button>
                {ticketNumber.trim() && (
                  <Button 
                    variant="outline"
                    onClick={handleOpenJira}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Jira 열기
                  </Button>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Jira 커스텀 필드 추출</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-green-500" />
                <span>IP 평판 및 위협 분석</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>AI 기반 종합 분석</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 향후 개발 예정 기능 */}
      <Card>
        <CardHeader>
          <CardTitle>향후 개발 예정 기능</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">고급 AI 분석</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 실시간 AI 모니터링</li>
                <li>• 예측적 위협 탐지</li>
                <li>• 자동 대응 권장</li>
                <li>• 머신러닝 기반 이상 탐지</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">통합 분석</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 외부 위협 인텔리전스 연동</li>
                <li>• 다중 데이터 소스 통합</li>
                <li>• 자동화된 보고서 생성</li>
                <li>• API 기반 타 시스템 연동</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 분석 모달 */}
      {currentTicket && (
        <AIAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => {
            setIsAnalysisModalOpen(false);
            setCurrentTicket(null);
          }}
          event={currentTicket}
        />
      )}
    </div>
  );
}