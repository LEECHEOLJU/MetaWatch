import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { MetaWatchDashboard } from '@/components/metawatch/MetaWatchDashboard';
import { CustomerDashboard } from '@/components/metawatch/CustomerDashboard';
import { AIAnalysisDashboard } from '@/components/metashield/AIAnalysisDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

// 고객사 정보 매핑
const customerInfo = {
  'customer-goodrich': { name: '굿리치', key: 'GOODRICH' },
  'customer-finda': { name: '핀다', key: 'FINDA' },
  'customer-samkoo': { name: '삼구아이앤씨', key: 'SAMKOO' },
  'customer-wcvs': { name: '한화위캠버스', key: 'WCVS' },
  'customer-gln': { name: 'GLN', key: 'GLN' },
  'customer-kurly': { name: '컬리', key: 'KURLY' },
  'customer-isu': { name: '이수시스템', key: 'ISU' },
};

function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Construction className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ContentRouter() {
  const { currentProgram, currentTab } = useApp();

  // MetaWatch 라우팅
  if (currentProgram === 'metawatch') {
    switch (currentTab) {
      case 'dashboard':
        return <MetaWatchDashboard />;
      
      case 'customer-goodrich':
      case 'customer-finda':
      case 'customer-samkoo':
      case 'customer-wcvs':
      case 'customer-gln':
      case 'customer-kurly':
      case 'customer-isu':
        const customer = customerInfo[currentTab];
        return <CustomerDashboard customerName={customer.name} customerKey={customer.key} />;
      
      default:
        return (
          <ComingSoonCard
            title="준비 중인 기능"
            description="해당 기능은 현재 개발 중입니다."
          />
        );
    }
  }

  // MetaShield 라우팅
  if (currentProgram === 'metashield') {
    switch (currentTab) {
      case 'ai-analysis':
        return <AIAnalysisDashboard />;
      
      case 'threat-intelligence':
        return (
          <ComingSoonCard
            title="위협 인텔리전스"
            description="외부 위협 정보 수집 및 분석 기능을 개발 중입니다."
          />
        );
      
      case 'reports':
        return (
          <ComingSoonCard
            title="보고서 생성"
            description="자동화된 보안 보고서 생성 기능을 개발 중입니다."
          />
        );
      
      default:
        return (
          <ComingSoonCard
            title="준비 중인 기능"
            description="해당 기능은 현재 개발 중입니다."
          />
        );
    }
  }

  // 기본 폴백
  return (
    <ComingSoonCard
      title="알 수 없는 페이지"
      description="요청하신 페이지를 찾을 수 없습니다."
    />
  );
}