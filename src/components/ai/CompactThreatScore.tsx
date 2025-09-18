import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  TrendingUp,
  Zap,
  Brain,
  AlertTriangle,
  FileText
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
}

interface CompactThreatScoreProps {
  threatScores: ThreatScore;
}

export default function CompactThreatScore({ threatScores }: CompactThreatScoreProps) {
  const { totalScore, calculatedRiskLevel, hasPayload } = threatScores;

  // 원형 게이지를 위한 데이터
  const gaugeData = [
    { name: 'score', value: totalScore, fill: getScoreColor(totalScore) },
    { name: 'remaining', value: 100 - totalScore, fill: '#f1f5f9' }
  ];

  // 점수별 색상
  function getScoreColor(score: number): string {
    if (score >= 80) return '#dc2626'; // Critical - Red
    if (score >= 60) return '#ea580c'; // High - Orange
    if (score >= 30) return '#ca8a04'; // Medium - Yellow
    return '#16a34a'; // Low - Green
  }

  // 위험도별 텍스트 색상
  function getRiskLevelText(level: string): string {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  // 개별 지표 데이터 (현대적 디자인 버전)
  const indicators = hasPayload ? [
    {
      name: 'VirusTotal',
      score: threatScores.virusTotalScore,
      max: 20,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      name: 'AbuseIPDB',
      score: threatScores.abuseipdbScore,
      max: 20,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      name: '빈도분석',
      score: threatScores.frequencyScore,
      max: 20,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'AI분석',
      score: threatScores.aiAnalysisScore,
      max: 15,
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      name: '탐지심각도',
      score: threatScores.detectionSeverityScore,
      max: 15,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      name: '페이로드',
      score: threatScores.payloadRiskScore,
      max: 10,
      icon: FileText,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    }
  ] : [
    {
      name: 'VirusTotal',
      score: threatScores.virusTotalScore,
      max: 23,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      name: 'AbuseIPDB',
      score: threatScores.abuseipdbScore,
      max: 22,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      name: '빈도분석',
      score: threatScores.frequencyScore,
      max: 25,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'AI분석',
      score: threatScores.aiAnalysisScore,
      max: 15,
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      name: '탐지심각도',
      score: threatScores.detectionSeverityScore,
      max: 15,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      name: '페이로드',
      score: 0,
      max: 0,
      icon: FileText,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      disabled: true
    }
  ];

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
          {/* 왼쪽: 원형 게이지 (글로우 효과 + 크기 확대) */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={56}
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                    style={{
                      filter: `drop-shadow(0 0 12px ${getScoreColor(totalScore)}40)`,
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
                  className="text-4xl font-bold"
                  style={{
                    color: getScoreColor(totalScore),
                    textShadow: `0 0 16px ${getScoreColor(totalScore)}40`,
                    filter: `drop-shadow(0 0 8px ${getScoreColor(totalScore)}30)`
                  }}
                >
                  {totalScore}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {hasPayload ? '표준' : 'IPS'}
                </div>
              </div>

              {/* 글로우 링 효과 */}
              <div
                className="absolute inset-2 rounded-full pointer-events-none"
                style={{
                  background: `conic-gradient(from 90deg, ${getScoreColor(totalScore)}20 0deg, ${getScoreColor(totalScore)}40 ${(totalScore/100)*360}deg, transparent ${(totalScore/100)*360}deg)`,
                  filter: 'blur(2px)',
                  opacity: 0.6
                }}
              />
            </div>
          </div>

          {/* 가운데 + 오른쪽: 세부 지표들 (2컬럼 3행, 높이 축소) */}
          <div className="col-span-2 grid grid-cols-2 gap-3">
            {indicators.map((indicator, index) => {
              const IconComponent = indicator.icon;
              const percentage = indicator.max > 0 ? (indicator.score / indicator.max) * 100 : 0;

              // 각 지표별 고유 색상
              const progressColor = indicator.color.includes('red') ? '#ef4444' :
                                  indicator.color.includes('orange') ? '#f97316' :
                                  indicator.color.includes('blue') ? '#3b82f6' :
                                  indicator.color.includes('purple') ? '#8b5cf6' :
                                  indicator.color.includes('yellow') ? '#eab308' :
                                  indicator.color.includes('pink') ? '#ec4899' : '#6b7280';

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors ${indicator.disabled ? 'opacity-50' : ''}`}
                >
                  {/* 헤더: 아이콘 + 제목 + 점수 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${indicator.color}`} />
                      <span className="text-xs font-semibold text-foreground">
                        {indicator.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {indicator.score}/{indicator.max}
                    </span>
                  </div>

                  {/* 게이지 표시 */}
                  <div className="space-y-1">

                    {/* 컬러풀한 Progress Bar */}
                    {indicator.max > 0 ? (
                      <div className="relative">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: progressColor,
                              boxShadow: `0 0 8px ${progressColor}40`
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span className="font-medium" style={{ color: getScoreColor(indicator.score) }}>
                            {indicator.score}
                          </span>
                          <span style={{ color: progressColor }}>{indicator.max}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        정보 없음
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}