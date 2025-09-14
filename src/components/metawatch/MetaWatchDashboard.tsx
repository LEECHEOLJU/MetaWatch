import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { getCustomerColor } from '@/lib/customer-colors';
import { JiraConnectionStatus } from '@/components/dashboard/JiraConnectionStatus';
import { UrgentSecurityEventsWidget } from '@/components/dashboard/UrgentSecurityEventsWidget';
import { CustomerStatusOverview } from '@/components/dashboard/CustomerStatusOverview';
import { SecurityStatsChart } from '@/components/dashboard/SecurityStatsChart';
import { CustomerIssuesManager } from '@/components/issues/CustomerIssuesManager';
import { useApp } from '@/contexts/AppContext';

// 고객사 정보 정의 - 시그니처 색상 사용
const customers = [
  { id: 'goodrich', name: '굿리치', code: 'GOODRICH' },
  { id: 'finda', name: '핀다', code: 'FINDA' },
  { id: 'samkoo', name: '삼구아이앤씨', code: 'SAMKOO' },
  { id: 'wcvs', name: '한화위캠버스', code: 'WCVS' },
  { id: 'gln', name: 'GLN', code: 'GLN' },
  { id: 'kurly', name: '컬리', code: 'KURLY' },
  { id: 'isu', name: '이수시스템', code: 'ISU' },
];

export function MetaWatchDashboard() {
  const { setCurrentTab } = useApp();

  const handleCustomerClick = (customerId: string) => {
    setCurrentTab(`customer-${customerId}` as any);
  };

  return (
    <div className="space-y-6">
      {/* Jira Connection Status - Top Priority */}
      <div className="grid grid-cols-1">
        <JiraConnectionStatus />
      </div>
      
      {/* Customer Selection - Compact */}
      <div className="flex items-center justify-center gap-6 py-3 px-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        {customers.map((customer) => {
          const customerColors = getCustomerColor(customer.code);
          return (
            <motion.button
              key={customer.id}
              onClick={() => handleCustomerClick(customer.id)}
              className="group flex flex-col items-center gap-1.5 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* 색깔 바 */}
              <div 
                className="w-12 h-1.5 rounded-full group-hover:h-2 transition-all duration-200 shadow-sm"
                style={{ 
                  background: `linear-gradient(to right, ${customerColors.primary}, ${customerColors.light})` 
                }}
              />
              {/* 고객사명 */}
              <span 
                className="text-xs group-hover:font-medium transition-all duration-200"
                style={{ 
                  color: customerColors.primary,
                  opacity: 0.8 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = customerColors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
              >
                {customer.name}
              </span>
            </motion.button>
          );
        })}
      </div>
      
      {/* Hero Section - Urgent Events */}
      <div className="grid grid-cols-1">
        <UrgentSecurityEventsWidget />
      </div>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Customer Status Overview - 전체 너비 */}
        <div className="xl:col-span-3">
          <CustomerStatusOverview />
        </div>
        
        {/* Statistics Chart - 전체 너비 */}
        <div className="xl:col-span-3">
          <SecurityStatsChart />
        </div>
      </div>
      
      {/* Customer Issues Management */}
      <div className="grid grid-cols-1">
        <CustomerIssuesManager />
      </div>
    </div>
  );
}