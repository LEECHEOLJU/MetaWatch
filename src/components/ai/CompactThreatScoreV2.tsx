import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  TrendingUp,
  Zap,
  Brain,
  AlertTriangle,
  FileText,
  Bug,
  Target,
  Code
} from 'lucide-react';

interface ThreatScore {
  virusTotalScore: number;
  abuseipdbScore: number;
  frequencyScore: number;
  aiAnalysisScore: number;
  detectionSeverityScore: number;
  payloadRiskScore: number;
  totalScore: number;
  calculatedRiskLevel: 'critical' | 'high' | 'medium' | 'low';
  hasPayload: boolean;
  breakdown: {
    virusTotal: string;
    abuseipdb: string;
    frequency: string;
    aiAnalysis: string;
    detectionSeverity: string;
    payloadRisk: string;
  };
  referenceInfo?: {
    cveIds: string[];
    mitreAttack: string[];
    threatSignatures: string[];
  };
}

interface CompactThreatScoreV2Props {
  threatScores: ThreatScore;
}

export function CompactThreatScoreV2({ threatScores }: CompactThreatScoreV2Props) {
  const { totalScore, calculatedRiskLevel, hasPayload } = threatScores;

  // 위험도별 색상 계산 함수
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#dc2626'; // 빨강 (Critical)
    if (score >= 60) return '#ea580c'; // 주황 (High)
    if (score >= 30) return '#ca8a04'; // 노랑 (Medium)
    return '#16a34a'; // 초록 (Low)
  };

  // 총점 게이지를 위한 파이 차트 데이터
  const gaugeData = [
    {
      name: 'filled',
      value: totalScore,
      fill: getScoreColor(totalScore)
    },
    {
      name: 'empty',
      value: 100 - totalScore,
      fill: '#e2e8f0'
    }
  ];

  // 레이더 차트를 위한 지표 데이터
  const indicators = hasPayload ? [
    {
      name: 'VirusTotal',
      score: threatScores.virusTotalScore,
      max: 20,
      icon: Shield,
      color: 'text-red-600'
    },
    {
      name: 'AbuseIPDB',
      score: threatScores.abuseipdbScore,
      max: 20,
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      name: '빈도분석',
      score: threatScores.frequencyScore,
      max: 20,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      name: 'AI분석',
      score: threatScores.aiAnalysisScore,
      max: 15,
      icon: Brain,
      color: 'text-purple-600'
    },
    {
      name: '탐지심각도',
      score: threatScores.detectionSeverityScore,
      max: 15,
      icon: Zap,
      color: 'text-yellow-600'
    },
    {
      name: '페이로드',
      score: threatScores.payloadRiskScore,
      max: 10,
      icon: FileText,
      color: 'text-pink-600'
    }
  ] : [
    {
      name: 'VirusTotal',
      score: threatScores.virusTotalScore,
      max: 23,
      icon: Shield,
      color: 'text-red-600'
    },
    {
      name: 'AbuseIPDB',
      score: threatScores.abuseipdbScore,
      max: 22,
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      name: '빈도분석',
      score: threatScores.frequencyScore,
      max: 25,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      name: 'AI분석',
      score: threatScores.aiAnalysisScore,
      max: 15,
      icon: Brain,
      color: 'text-purple-600'
    },
    {
      name: '탐지심각도',
      score: threatScores.detectionSeverityScore,
      max: 15,
      icon: Zap,
      color: 'text-yellow-600'
    },
    {
      name: '페이로드',
      score: 0,
      max: 0,
      icon: FileText,
      color: 'text-gray-400',
      disabled: true
    }
  ];

  // 레이더 차트 데이터 생성
  const radarData = indicators.filter(ind => !ind.disabled).map(indicator => ({
    indicator: indicator.name,
    score: indicator.score,
    fullMark: indicator.max
  }));

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-base font-bold">위협 점수 분석</span>
          </div>
          <Badge variant={
            calculatedRiskLevel === 'critical' ? 'destructive' :
            calculatedRiskLevel === 'high' ? 'destructive' :
            calculatedRiskLevel === 'medium' ? 'secondary' : 'default'
          }>
            {calculatedRiskLevel.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-6">
          {/* 1컬럼: 총점 게이지 + 레이더 차트 (세로 배치) */}
          <div className="space-y-6">
            {/* 총점 게이지 */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={40}
                      outerRadius={55}
                      dataKey="value"
                      stroke="none"
                      style={{
                        filter: `drop-shadow(0 0 10px ${getScoreColor(totalScore)}40)`,
                      }}
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          style={{
                            filter: index === 0 ? `drop-shadow(0 0 8px ${entry.fill}60)` : 'none'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* 중앙 점수 표시 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="text-3xl font-bold"
                    style={{
                      color: getScoreColor(totalScore),
                      textShadow: `0 0 15px ${getScoreColor(totalScore)}50`
                    }}
                  >
                    {totalScore}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {hasPayload ? '표준' : 'IPS'}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">총 위험도</p>
                <p className="text-xs text-muted-foreground">{calculatedRiskLevel.toUpperCase()}</p>
              </div>
            </div>

            {/* 레이더 차트 */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid
                      gridType="polygon"
                      radialLines={true}
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    />
                    <PolarAngleAxis
                      dataKey="indicator"
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 'dataMax']}
                      tickCount={3}
                      tick={{ fontSize: 7, fill: '#94a3b8' }}
                      axisLine={false}
                    />
                    <Radar
                      name="위협지표"
                      dataKey="score"
                      stroke={getScoreColor(totalScore)}
                      fill={getScoreColor(totalScore)}
                      strokeWidth={2}
                      fillOpacity={0.3}
                      dot={{ fill: getScoreColor(totalScore), strokeWidth: 2, r: 3 }}
                      style={{
                        filter: `drop-shadow(0 0 8px ${getScoreColor(totalScore)}40)`
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">위협 패턴</p>
                <p className="text-xs text-muted-foreground">6개 지표 분석</p>
              </div>
            </div>
          </div>

          {/* 2-3컬럼: 보안 위협 가중치 (이미지와 동일한 2x3 그리드) */}
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-3">
              {indicators.filter(ind => !ind.disabled).map((indicator, index) => {
                const IconComponent = indicator.icon;
                const percentage = indicator.max > 0 ? (indicator.score / indicator.max) * 100 : 0;

                // 각 지표별 고유 색상 매핑 (이미지와 동일)
                const progressColor = indicator.color.includes('red') ? '#ef4444' :     // VirusTotal 빨강
                                    indicator.color.includes('orange') ? '#f97316' :   // AbuseIPDB 주황
                                    indicator.color.includes('blue') ? '#3b82f6' :     // 빈도분석 파랑
                                    indicator.color.includes('purple') ? '#8b5cf6' :   // AI분석 보라
                                    indicator.color.includes('yellow') ? '#eab308' :   // 탐지심각도 노랑
                                    indicator.color.includes('pink') ? '#ec4899' : '#6b7280'; // 페이로드 핑크

                return (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-gray-800/90 border border-gray-700/50 hover:bg-gray-800 transition-all duration-200"
                  >
                    {/* 헤더: 아이콘 + 제목 + 점수 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent
                          className="h-4 w-4"
                          style={{ color: progressColor }}
                        />
                        <span className="text-sm font-medium text-white">
                          {indicator.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">
                          {indicator.score}
                        </span>
                        <span className="text-white/60">
                          /{indicator.max}
                        </span>
                      </div>
                    </div>

                    {/* 풀 컬러 프로그레스 바 (이미지와 동일) */}
                    <div className="relative mb-3">
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: progressColor
                          }}
                        />
                      </div>
                    </div>

                    {/* 하단 수치 (0, 중간값, 최대값) */}
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">0</span>
                      <span
                        className="font-medium"
                        style={{ color: progressColor }}
                      >
                        {indicator.score}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: progressColor }}
                      >
                        {indicator.max}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 하단: 참고 정보 섹션 */}
        {(threatScores.referenceInfo || true) && (
          <div className="mt-6 pt-4 border-t">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                참고 정보
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* CVE 취약점 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bug className="h-3 w-3 text-red-500" />
                  <span className="text-xs font-medium text-foreground">CVE 취약점</span>
                </div>
                <div className="space-y-1">
                  {threatScores.referenceInfo?.cveIds && threatScores.referenceInfo.cveIds.length > 0 ? (
                    threatScores.referenceInfo.cveIds.map((cve, index) => (
                      <Badge key={index} variant="outline" className="text-xs h-5 mr-1 mb-1">
                        {cve}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">정보 없음</span>
                  )}
                </div>
              </div>

              {/* MITRE ATT&CK */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium text-foreground">MITRE ATT&CK</span>
                </div>
                <div className="space-y-1">
                  {threatScores.referenceInfo?.mitreAttack && threatScores.referenceInfo.mitreAttack.length > 0 ? (
                    threatScores.referenceInfo.mitreAttack.map((attack, index) => (
                      <Badge key={index} variant="outline" className="text-xs h-5 mr-1 mb-1">
                        {attack}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">정보 없음</span>
                  )}
                </div>
              </div>

              {/* 위협 구문 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium text-foreground">위협 구문</span>
                </div>
                <div className="space-y-1">
                  {threatScores.referenceInfo?.threatSignatures && threatScores.referenceInfo.threatSignatures.length > 0 ? (
                    threatScores.referenceInfo.threatSignatures.map((signature, index) => (
                      <Badge key={index} variant="outline" className="text-xs h-5 font-mono mr-1 mb-1">
                        {signature}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">정보 없음</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}