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
  FileText,
  Globe,
  Server,
  Wifi,
  Flag,
  Users,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import CompactThreatScore from './CompactThreatScore';

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
    threatScores?: {
      virusTotalScore: number;
      abuseipdbScore: number;
      frequencyScore: number;
      aiAnalysisScore: number;
      detectionSeverityScore: number;
      payloadRiskScore: number;
      totalScore: number;
      calculatedRiskLevel: 'critical' | 'high' | 'medium' | 'low';
      breakdown: {
        virusTotal: string;
        abuseipdb: string;
        frequency: string;
        aiAnalysis: string;
        detectionSeverity: string;
        payloadRisk: string;
      };
    };
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
      totalReports: number;
      numDistinctUsers: number;
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
  debugInfo?: {
    originalResponse?: string;
    originalTextLength?: number;
    parsedSections?: number;
    validSections?: number;
    sectionLengths?: number[];
    parsingLogs?: string[];
  };
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
  const [showDebugInfo, setShowDebugInfo] = useState(false);

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
          ticketKey: event.key
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('AI Analysis API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`분석 실패: ${errorData.error || response.statusText} (${response.status})`);
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
            <div className="flex items-center gap-2">
              {result?.debugInfo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="flex items-center gap-2 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  {showDebugInfo ? 'DEBUG OFF' : 'DEBUG'}
                </Button>
              )}
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

          {/* Debug Section */}
          {result?.debugInfo && showDebugInfo && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  🐛 DEBUG 정보 (관리자 전용)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">📊 텍스트 파싱 통계</h4>
                  <div className="bg-black p-3 rounded text-xs font-mono text-white">
                    <p><strong>원본 텍스트 길이:</strong> {result.debugInfo.originalTextLength || 'N/A'}</p>
                    <p><strong>파싱된 섹션 수:</strong> {result.debugInfo.parsedSections || 'N/A'}</p>
                    <p><strong>유효한 섹션 수:</strong> {result.debugInfo.validSections || 'N/A'}</p>
                    <p><strong>섹션 길이 분포:</strong> {result.debugInfo.sectionLengths ? JSON.stringify(result.debugInfo.sectionLengths) : 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">🤖 AI 원본 응답</h4>
                  <div className="bg-black p-3 rounded text-xs font-mono max-h-60 overflow-y-auto text-white">
                    <pre className="whitespace-pre-wrap break-words">{result.debugInfo.originalResponse || result.analysis?.rawContent || 'N/A'}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">⚙️ 파싱 로그</h4>
                  <div className="bg-black p-3 rounded text-xs font-mono max-h-40 overflow-y-auto text-white">
                    {result.debugInfo.parsingLogs ? (
                      result.debugInfo.parsingLogs.map((log: string, index: number) => (
                        <div key={index}>{log}</div>
                      ))
                    ) : (
                      <p>파싱 로그 없음</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Analysis Results - 2열 레이아웃 */}
          {result && (
            <div className="space-y-6">
              {/* MCSOC 정/오탐 분석 (최상단) */}
              <Card className={cn(
                "border-2 shadow-lg",
                getMCSOCAnalysisColor(result)
              )}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Shield className="h-6 w-6 text-blue-400" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      </div>
                      <span className="text-lg font-bold text-blue-300">MCSOC 차단 기준 분석</span>
                    </div>
                    <Badge className={cn(
                      "px-3 py-1 font-bold text-sm",
                      getMCSOCAnalysisColor(result)
                    )}>
                      {getMCSOCAnalysisResult(result)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 분석 기준 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 다발성 기준 */}
                      <div className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200",
                        getFrequencyAnalysisColor(result)
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium text-sm">다발성 분석</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">24시간 발생 횟수:</span>
                            <span className="font-mono font-bold">
                              {parseInt(result.extractedData.count || '0')}건
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">기준:</span>
                            <span className="font-medium">10건 이상 = 정탐</span>
                          </div>
                          <div className={cn(
                            "text-xs font-bold text-center py-1 rounded",
                            parseInt(result.extractedData.count || '0') >= 10
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                          )}>
                            {parseInt(result.extractedData.count || '0') >= 10 ? "⚠️ 정탐" : "✅ 기준 미달"}
                          </div>
                        </div>
                      </div>

                      {/* VirusTotal 기준 */}
                      <div className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200",
                        getVirusTotalAnalysisColor(result)
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4" />
                          <span className="font-medium text-sm">VirusTotal</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Community Score:</span>
                            <span className="font-mono font-bold">
                              {result.ipReputation.virusTotal.malicious}/94
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">기준:</span>
                            <span className="font-medium">5개 이상 = 정탐</span>
                          </div>
                          <div className={cn(
                            "text-xs font-bold text-center py-1 rounded",
                            result.ipReputation.virusTotal.malicious >= 5
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                          )}>
                            {result.ipReputation.virusTotal.malicious >= 5 ? "⚠️ 정탐" : "✅ 기준 미달"}
                          </div>
                        </div>
                      </div>

                      {/* AbuseIPDB 기준 */}
                      <div className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200",
                        getAbuseIPDBAnalysisColor(result)
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium text-sm">AbuseIPDB</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">신고 건수:</span>
                            <span className="font-mono font-bold">
                              {result.ipReputation.abuseipdb.totalReports || 0}건
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">기준:</span>
                            <span className="font-medium">500건 이상 = 정탐</span>
                          </div>
                          <div className={cn(
                            "text-xs font-bold text-center py-1 rounded",
                            (result.ipReputation.abuseipdb.totalReports || 0) >= 500
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                          )}>
                            {(result.ipReputation.abuseipdb.totalReports || 0) >= 500 ? "⚠️ 정탐" : "✅ 기준 미달"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 최종 판별 결과 */}
                    <div className={cn(
                      "p-4 rounded-lg text-center font-bold text-lg border-2",
                      getMCSOCFinalResultColor(result)
                    )}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {getMCSOCAnalysisResult(result) === "정탐 (차단 권장)" ? (
                          <>
                            <AlertTriangle className="h-5 w-5 text-red-300" />
                            <span className="text-red-300">정탐 (차단 권장)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-300" />
                            <span className="text-green-300">오탐 (차단 불필요)</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getMCSOCAnalysisResult(result) === "정탐 (차단 권장)"
                          ? "하나 이상의 기준이 충족되었습니다"
                          : "모든 기준이 차단 임계값 미달입니다"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* 왼쪽: 보안 분석 결과 (상단으로 이동) */}
                <div className="space-y-6">
                  {/* 위협 점수 분석 카드 */}
                  {result.analysis.threatScores && (
                    <CompactThreatScore threatScores={result.analysis.threatScores} />
                  )}

                {/* 상세 분석 섹션들 */}
                {result.analysis.detailedAnalysis ? (
                  <div className="space-y-4">
                    {/* 1. 탐지 이벤트 분석 요약 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">🛡️ 탐지 이벤트 분석 요약</CardTitle>
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
                        <CardTitle className="text-sm">🔍 상세 분석</CardTitle>
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
                        <CardTitle className="text-sm">⚠️ 영향 받는 제품 및 조건</CardTitle>
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
                        <CardTitle className="text-sm">🕵️ 대응 방안</CardTitle>
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
                        <CardTitle className="text-sm">🚨 추가 탐지 내역 / 평판 조회</CardTitle>
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

              {/* 오른쪽: TIDB 정보 및 이벤트 정보 */}
              <div className="space-y-6">
                {/* IP 평판 정보 - Lambda 형식 스타일 (상단으로 이동) */}
                <div className="grid grid-cols-1 gap-4">
                  {/* VirusTotal - 깔끔하고 이쁘게 */}
                  <Card className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-blue-400">
                        <div className="relative">
                          <Eye className="h-5 w-5" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        </div>
                        <span className="font-bold">VirusTotal 평판</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-black/20 rounded-lg p-3 font-mono text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-300" />
                          <span className="text-gray-300">출발지 IP :</span>
                          <span className="text-blue-300 font-medium">{result.extractedData.sourceIp || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-400" />
                          <span className="text-gray-300">Community Score :</span>
                          <span className="text-red-400 font-bold">{result.ipReputation.virusTotal.malicious}/94</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-green-300" />
                          <span className="text-gray-300">국가 :</span>
                          <span className="text-green-300 font-medium">{result.ipReputation.abuseipdb.countryCode || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-cyan-300" />
                          <span className="text-gray-300">AS :</span>
                          <span className="text-cyan-300 font-medium text-xs truncate">{result.ipReputation.abuseipdb.isp || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* 상세 통계 */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/20">
                          <div className="text-red-400 font-bold text-lg">{result.ipReputation.virusTotal.malicious}</div>
                          <div className="text-red-300 text-xs">악성</div>
                        </div>
                        <div className="text-center p-2 bg-orange-500/10 rounded border border-orange-500/20">
                          <div className="text-orange-400 font-bold text-lg">{result.ipReputation.virusTotal.suspicious}</div>
                          <div className="text-orange-300 text-xs">의심</div>
                        </div>
                        <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/20">
                          <div className="text-green-400 font-bold text-lg">{result.ipReputation.virusTotal.clean}</div>
                          <div className="text-green-300 text-xs">정상</div>
                        </div>
                        <div className="text-center p-2 bg-gray-500/10 rounded border border-gray-500/20">
                          <div className="text-gray-400 font-bold text-lg">{result.ipReputation.virusTotal.undetected}</div>
                          <div className="text-gray-300 text-xs">미탐지</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AbuseIPDB - Lambda 형식 */}
                  <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-purple-400">
                        <div className="relative">
                          <AlertCircle className="h-5 w-5" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        </div>
                        <span className="font-bold">AbuseIPDB 신뢰도</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-black/20 rounded-lg p-3 font-mono text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-400" />
                          <span className="text-gray-300">위험 점수 :</span>
                          <span className="text-red-400 font-bold">{result.ipReputation.abuseipdb.abuseConfidence}/100</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-400" />
                          <span className="text-gray-300">신고 건수 :</span>
                          <span className="text-orange-400 font-medium">{result.ipReputation.abuseipdb.totalReports || 'N/A'}건</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300">신고자 수 :</span>
                          <span className="text-yellow-400 font-medium">{result.ipReputation.abuseipdb.numDistinctUsers || 'N/A'}명</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-green-300" />
                          <span className="text-gray-300">국가 :</span>
                          <span className="text-green-300 font-medium">{result.ipReputation.abuseipdb.countryCode || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-cyan-300" />
                          <span className="text-gray-300">ISP :</span>
                          <span className="text-cyan-300 font-medium text-xs truncate">{result.ipReputation.abuseipdb.isp || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* 위험도 게이지 */}
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-purple-300">위험도 지수:</span>
                          <span className="text-sm font-bold text-purple-200">{result.ipReputation.abuseipdb.abuseConfidence}%</span>
                        </div>
                        <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                            style={{ width: `${result.ipReputation.abuseipdb.abuseConfidence}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

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
                          <div>
                            <span className="text-muted-foreground">24내 단다발성 조회:</span>
                            <p className="font-medium text-sm">{result.extractedData.count || '데이터 없음'}</p>
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

                      {/* 페이로드 정보 - 항상 표시 */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-orange-600">💾 페이로드</h4>
                        <div className="text-sm">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            {result.extractedData.payload ? (
                              <>
                                <p className="font-mono text-sm break-all whitespace-pre-wrap line-clamp-3">
                                  {result.extractedData.payload}
                                </p>
                                {result.extractedData.payload.length > 200 && (
                                  <p className="text-xs text-muted-foreground mt-2">※ 전체 페이로드는 하단에서 확인 가능</p>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                페이로드 정보 없음
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                </div>
              </div>
            </div>
          )}

          {/* 페이로드는 이벤트 정보 섹션에서만 표시하도록 중복 제거 */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// MCSOC 분석 관련 헬퍼 함수들
function getMCSOCAnalysisResult(result: AIAnalysisResult): string {
  const count = parseInt(result.extractedData.count || '0');
  const virusTotal = result.ipReputation.virusTotal.malicious;
  const abuseipdb = result.ipReputation.abuseipdb.totalReports || 0;

  // 하나라도 기준치 이상이면 정탐
  if (count >= 10 || virusTotal >= 5 || abuseipdb >= 500) {
    return "정탐 (차단 권장)";
  }
  return "오탐 (차단 불필요)";
}

function getMCSOCAnalysisColor(result: AIAnalysisResult): string {
  const isPositive = getMCSOCAnalysisResult(result) === "정탐 (차단 권장)";
  return isPositive
    ? "border-red-500/50 bg-red-500/10"
    : "border-green-500/50 bg-green-500/10";
}

function getMCSOCFinalResultColor(result: AIAnalysisResult): string {
  const isPositive = getMCSOCAnalysisResult(result) === "정탐 (차단 권장)";
  return isPositive
    ? "border-red-500/50 bg-red-500/20"
    : "border-green-500/50 bg-green-500/20";
}

function getFrequencyAnalysisColor(result: AIAnalysisResult): string {
  const count = parseInt(result.extractedData.count || '0');
  return count >= 10
    ? "border-red-500/50 bg-red-500/10"
    : "border-gray-500/30 bg-gray-500/5";
}

function getVirusTotalAnalysisColor(result: AIAnalysisResult): string {
  const score = result.ipReputation.virusTotal.malicious;
  return score >= 5
    ? "border-red-500/50 bg-red-500/10"
    : "border-gray-500/30 bg-gray-500/5";
}

function getAbuseIPDBAnalysisColor(result: AIAnalysisResult): string {
  const reports = result.ipReputation.abuseipdb.totalReports || 0;
  return reports >= 500
    ? "border-red-500/50 bg-red-500/10"
    : "border-gray-500/30 bg-gray-500/5";
}