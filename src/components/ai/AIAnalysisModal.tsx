import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  X, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Loader2,
  TrendingUp,
  Eye,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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

interface AIAnalysisResult {
  analysis: {
    summary: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    attackType: string;
    recommendation: string;
    confidence: number;
    detailedAnalysis?: {
      threatLevel: string;
      section1: string;
      section2: string;
      section3: string;
      section4: string;
      section5: string;
    };
    rawContent?: string;
  };
  ipReputation: {
    virusTotal: {
      malicious: number;
      suspicious: number;
      clean: number;
      undetected: number;
      reputation: number;
    };
    abuseipdb: {
      abuseConfidence: number;
      countryCode: string;
      usageType: string;
      isp: string;
    };
  };
  extractedData: {
    sourceIp: string;
    destinationIp: string;
    payload: string;
    customer: string;
    summary: string;
    severity: string;
    attackType: string;
    attackCategory: string;
    scenarioName: string;
    detectionTime: string;
    detectionDevice: string;
    url: string;
    httpMethod: string;
    userAgent: string;
    [key: string]: any;
  };
  analysisTime: string;
}

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: SecurityEvent;
}

export function AIAnalysisModal({ isOpen, onClose, event }: AIAnalysisModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analysisSteps = [
    'Jira 데이터 추출 중...',
    'VirusTotal IP 평판 조회 중...',
    'AbuseIPDB 신뢰도 확인 중...',
    'AI 종합 분석 중...',
    '분석 완료'
  ];

  useEffect(() => {
    if (isOpen && !result && !error) {
      startAnalysis();
    }
  }, [isOpen]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentStep(analysisSteps[i]);
        setProgress((i / (analysisSteps.length - 1)) * 100);
        
        if (i < analysisSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }
      }

      // API 호출
      const response = await fetch('/api/ai/analyze-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventKey: event.key,
          eventId: event.id
        }),
      });

      if (!response.ok) {
        throw new Error('분석 중 오류가 발생했습니다.');
      }

      const analysisResult = await response.json();
      setResult(analysisResult);
      setProgress(100);
      setCurrentStep('분석 완료');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const handleOpenJira = () => {
    window.open(
      `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/browse/${event.key}`,
      '_blank'
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI 보안 분석 결과
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenJira}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {event.key}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{event.summary}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Section */}
          {isAnalyzing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    <span className="text-sm font-medium">{currentStep}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    AI가 보안 이벤트를 종합적으로 분석하고 있습니다...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Section */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">분석 실패</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <Button 
                  onClick={startAnalysis}
                  className="mt-4"
                  size="sm"
                >
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results - 2열 레이아웃 */}
          {result && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* 왼쪽: 이벤트 정보 */}
              <div className="space-y-6">
                {/* 추출된 Jira 데이터 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      이벤트 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 기본 정보 */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-green-600">📊 기본 정보</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">고객사:</span>
                            <p className="font-medium">{result.extractedData.customer || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">국가:</span>
                            <p className="font-medium">{result.extractedData.country || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">심각도:</span>
                            <p className="font-medium">{result.extractedData.severity || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">우선순위:</span>
                            <p className="font-medium">{result.extractedData.priority || '데이터 없음'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">요약:</span>
                            <p className="font-medium text-sm">{result.extractedData.summary || '데이터 없음'}</p>
                          </div>
                        </div>
                      </div>

                      {/* 네트워크 정보 */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-blue-600">🌐 네트워크 정보</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">출발지 IP:</span>
                            <p className="font-mono font-medium">{result.extractedData.sourceIp || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">목적지 IP:</span>
                            <p className="font-mono font-medium">{result.extractedData.destinationIp || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">출발지 포트:</span>
                            <p className="font-medium">{result.extractedData.sourcePort || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">목적지 포트:</span>
                            <p className="font-medium">{result.extractedData.destinationPort || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">방향:</span>
                            <p className="font-medium">{result.extractedData.direction || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">HTTP 메소드:</span>
                            <p className="font-medium">{result.extractedData.httpMethod || '데이터 없음'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">URL:</span>
                            <p className="font-mono text-sm break-all">{result.extractedData.url || '데이터 없음'}</p>
                          </div>
                        </div>
                      </div>

                      {/* 위협 정보 */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-red-600">🚨 위협 정보</h4>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">공격 유형:</span>
                            <p className="font-medium">{result.extractedData.attackType || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">공격 분류:</span>
                            <p className="font-medium">{result.extractedData.attackCategory || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">시나리오명:</span>
                            <p className="font-medium text-sm">{result.extractedData.scenarioName || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">액션:</span>
                            <p className="font-medium">{result.extractedData.action || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">해시값:</span>
                            <p className="font-mono text-sm break-all">{result.extractedData.hashValue || '데이터 없음'}</p>
                          </div>
                        </div>
                      </div>

                      {/* 탐지 정보 */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-purple-600">🔍 탐지 정보</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">탐지 시간:</span>
                            <p className="font-medium text-sm">{result.extractedData.detectionTime || '데이터 없음'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">탐지 장비:</span>
                            <p className="font-medium text-sm">{result.extractedData.detectionDevice || '데이터 없음'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">탐지명:</span>
                            <p className="font-medium text-sm">{result.extractedData.detectionName || '데이터 없음'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">User-Agent:</span>
                            <p className="font-mono text-sm break-all">{result.extractedData.userAgent || '데이터 없음'}</p>
                          </div>
                        </div>
                      </div>

                      {/* 페이로드 정보 */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-orange-600">💾 페이로드</h4>
                        <div className="text-sm">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="font-mono text-sm break-all whitespace-pre-wrap">
                              {result.extractedData.payload || '데이터 없음'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* IP 평판 정보 */}
                <div className="grid grid-cols-1 gap-4">
                  {/* VirusTotal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-500" />
                        VirusTotal 평판
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>악성:</span>
                          <span className="font-medium text-red-500">{result.ipReputation.virusTotal.malicious}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>의심:</span>
                          <span className="font-medium text-orange-500">{result.ipReputation.virusTotal.suspicious}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>정상:</span>
                          <span className="font-medium text-green-500">{result.ipReputation.virusTotal.clean}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>미탐지:</span>
                          <span className="font-medium text-gray-500">{result.ipReputation.virusTotal.undetected}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AbuseIPDB */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        AbuseIPDB 신뢰도
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">악성 신뢰도:</span>
                          <Progress value={result.ipReputation.abuseipdb.abuseConfidence} className="flex-1 h-2" />
                          <span className="text-sm">{result.ipReputation.abuseipdb.abuseConfidence}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <span className="text-muted-foreground">국가</span>
                            <p className="font-medium">{result.ipReputation.abuseipdb.countryCode || 'N/A'}</p>
                          </div>
                          <div className="text-center">
                            <span className="text-muted-foreground">용도</span>
                            <p className="font-medium text-xs">{result.ipReputation.abuseipdb.usageType || 'N/A'}</p>
                          </div>
                          <div className="text-center">
                            <span className="text-muted-foreground">ISP</span>
                            <p className="font-medium text-xs truncate">{result.ipReputation.abuseipdb.isp || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 오른쪽: 상세 분석 결과 */}
              <div className="space-y-6">
                {/* 위협도 판단 헤더 */}
                <Card className={cn("border", getRiskColor(result.analysis.riskLevel))}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      보안 분석 보고서
                      <Badge className={getRiskColor(result.analysis.riskLevel)}>
                        {result.analysis.riskLevel.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-2">
                      <div className="text-2xl font-bold text-foreground">
                        {result.analysis.detailedAnalysis?.threatLevel || `${result.analysis.confidence}% (보통)`}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 상세 분석 섹션들 */}
                {result.analysis.detailedAnalysis ? (
                  <div className="space-y-4">
                    {/* 1. 탐지 이벤트 분석 요약 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">1. 🛡️ 탐지 이벤트 분석 요약</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {result.analysis.detailedAnalysis.section1}
                        </p>
                      </CardContent>
                    </Card>

                    {/* 2. 상세 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">2. 🔍 상세 분석</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {result.analysis.detailedAnalysis.section2}
                        </p>
                      </CardContent>
                    </Card>

                    {/* 3. 영향 받는 제품 및 조건 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">3. ⚠️ 영향 받는 제품 및 조건</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {result.analysis.detailedAnalysis.section3}
                        </p>
                      </CardContent>
                    </Card>

                    {/* 4. 대응 방안 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">4. 🕵️ 대응 방안</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {result.analysis.detailedAnalysis.section4}
                        </p>
                      </CardContent>
                    </Card>

                    {/* 5. 추가 탐지 내역 / 평판 조회 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">5. 🚨 추가 탐지 내역 / 평판 조회</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {result.analysis.detailedAnalysis.section5}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <p>상세 분석 데이터를 불러오는 중...</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Payload 표시 (하단) */}
          {result && result.extractedData.payload && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  페이로드 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {result.extractedData.payload}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}