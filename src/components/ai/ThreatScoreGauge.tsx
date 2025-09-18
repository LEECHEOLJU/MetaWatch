import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

interface ThreatScoreGaugeProps {
  threatScores: ThreatScore;
}

export default function ThreatScoreGauge({ threatScores }: ThreatScoreGaugeProps) {
  const { totalScore, calculatedRiskLevel, breakdown, hasPayload } = threatScores;

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

  // 위험도별 배경색
  function getRiskLevelBg(level: string): string {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  }

  // 위험도별 텍스트 색상
  function getRiskLevelText(level: string): string {
    switch (level) {
      case 'critical': return 'text-red-700';
      case 'high': return 'text-orange-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-green-700';
      default: return 'text-gray-700';
    }
  }

  // 개별 지표 데이터 (페이로드 유무에 따라 만점 다름)
  const indicators = hasPayload ? [
    // 📦 페이로드 있는 경우: 기본 가중치
    {
      name: 'VirusTotal',
      score: threatScores.virusTotalScore,
      maxScore: 20,
      description: breakdown.virusTotal,
      color: '#ef4444'
    },
    {
      name: 'AbuseIPDB',
      score: threatScores.abuseipdbScore,
      maxScore: 20,
      description: breakdown.abuseipdb,
      color: '#f97316'
    },
    {
      name: '빈도 분석',
      score: threatScores.frequencyScore,
      maxScore: 20,
      description: breakdown.frequency,
      color: '#eab308'
    },
    {
      name: 'AI 종합 분석',
      score: threatScores.aiAnalysisScore,
      maxScore: 15,
      description: breakdown.aiAnalysis,
      color: '#8b5cf6'
    },
    {
      name: '탐지 심각도',
      score: threatScores.detectionSeverityScore,
      maxScore: 15,
      description: breakdown.detectionSeverity,
      color: '#06b6d4'
    },
    {
      name: '페이로드 위험도',
      score: threatScores.payloadRiskScore,
      maxScore: 10,
      description: breakdown.payloadRisk,
      color: '#ec4899'
    }
  ] : [
    // 📭 페이로드 없는 경우: 가중치 재조정 (IPS 장비 등)
    {
      name: 'VirusTotal',
      score: threatScores.virusTotalScore,
      maxScore: 23,
      description: breakdown.virusTotal,
      color: '#ef4444'
    },
    {
      name: 'AbuseIPDB',
      score: threatScores.abuseipdbScore,
      maxScore: 22,
      description: breakdown.abuseipdb,
      color: '#f97316'
    },
    {
      name: '빈도 분석',
      score: threatScores.frequencyScore,
      maxScore: 25,
      description: breakdown.frequency,
      color: '#eab308'
    },
    {
      name: 'AI 종합 분석',
      score: threatScores.aiAnalysisScore,
      maxScore: 15,
      description: breakdown.aiAnalysis,
      color: '#8b5cf6'
    },
    {
      name: '탐지 심각도',
      score: threatScores.detectionSeverityScore,
      maxScore: 15,
      description: breakdown.detectionSeverity,
      color: '#06b6d4'
    },
    {
      name: '페이로드 위험도',
      score: threatScores.payloadRiskScore,
      maxScore: 0,
      description: breakdown.payloadRisk,
      color: '#9ca3af',
      disabled: true // 비활성화 표시
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 왼쪽: 원형 게이지바 */}
      <Card className={`${getRiskLevelBg(calculatedRiskLevel)} border-2`}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg font-bold">🎯 종합 위협 점수</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {/* 원형 게이지 */}
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* 중앙 점수 표시 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold ${getRiskLevelText(calculatedRiskLevel)}`}>
                {totalScore}
              </div>
              <div className="text-sm text-gray-500">/ 100</div>
              <div className={`text-xs font-semibold mt-1 px-2 py-1 rounded ${
                calculatedRiskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                calculatedRiskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                calculatedRiskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {calculatedRiskLevel.toUpperCase()}
              </div>
            </div>
          </div>

          {/* 점수 구간 표시 */}
          <div className="mt-4 text-xs text-gray-600 text-center">
            <div className="flex justify-between w-48 mb-2">
              <span className="text-green-600">Low (0-29)</span>
              <span className="text-yellow-600">Medium (30-59)</span>
              <span className="text-orange-600">High (60-79)</span>
              <span className="text-red-600">Critical (80+)</span>
            </div>
            <div className="w-48 h-2 bg-gradient-to-r from-green-300 via-yellow-300 via-orange-300 to-red-300 rounded-full"></div>
          </div>
        </CardContent>
      </Card>

      {/* 오른쪽: 개별 지표 게이지바 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">📊 세부 위협 지표</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {indicators.map((indicator, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: indicator.color }}>
                  {indicator.name}
                </span>
                <span className="text-sm font-bold">
                  {indicator.score}/{indicator.maxScore}
                </span>
              </div>

              <Progress
                value={indicator.maxScore > 0 ? (indicator.score / indicator.maxScore) * 100 : 0}
                className={`h-3 ${indicator.disabled ? 'opacity-50' : ''}`}
                style={{
                  backgroundColor: '#f1f5f9'
                }}
              />

              <div className="text-xs text-gray-600 mt-1">
                {indicator.description}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center font-bold">
              <span>총점</span>
              <span className={getRiskLevelText(calculatedRiskLevel)}>
                {totalScore}/100
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}