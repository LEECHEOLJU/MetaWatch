import React from 'react';
import { Building2, AlertTriangle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CustomerDashboardProps {
  customerName: string;
  customerKey: string;
}

export function CustomerDashboard({ customerName, customerKey }: CustomerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* 고객사 헤더 */}
      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border">
        <Building2 className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customerName}</h1>
          <p className="text-sm text-muted-foreground">전용 보안 대시보드 ({customerKey})</p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
            개발 예정
          </Badge>
        </div>
      </div>

      {/* 기능 예정 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 실시간 보안 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              실시간 보안 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">오늘 탐지</span>
                <span className="text-lg font-semibold">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">진행 중</span>
                <span className="text-lg font-semibold text-yellow-500">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">완료</span>
                <span className="text-lg font-semibold text-green-500">--</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 위험도 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              위험도 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">높음</span>
                <span className="text-lg font-semibold text-red-500">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">보통</span>
                <span className="text-lg font-semibold text-yellow-500">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">낮음</span>
                <span className="text-lg font-semibold text-green-500">--</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                활동 로그가 여기에 표시됩니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 기능 계획 */}
      <Card>
        <CardHeader>
          <CardTitle>개발 예정 기능</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">보안 모니터링</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {customerName} 전용 이벤트 필터링</li>
                <li>• 실시간 위협 탐지 현황</li>
                <li>• 커스텀 알림 설정</li>
                <li>• 보안 정책 준수 현황</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">분석 및 리포트</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 월간/주간 보안 리포트</li>
                <li>• 위협 트렌드 분석</li>
                <li>• 취약점 관리</li>
                <li>• 규정 준수 체크</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}