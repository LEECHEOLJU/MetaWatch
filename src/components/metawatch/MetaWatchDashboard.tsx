import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { JiraConnectionStatus } from '@/components/dashboard/JiraConnectionStatus';
import { UrgentSecurityEventsWidget } from '@/components/dashboard/UrgentSecurityEventsWidget';
import { CustomerStatusOverview } from '@/components/dashboard/CustomerStatusOverview';
import { SecurityStatsChart } from '@/components/dashboard/SecurityStatsChart';
import { useApp } from '@/contexts/AppContext';

// 고객사 정보 정의
const customers = [
  { id: 'goodrich', name: '굿리치', code: 'GOODRICH', color: 'from-blue-600 to-blue-400' },
  { id: 'finda', name: '핀다', code: 'FINDA', color: 'from-green-600 to-green-400' },
  { id: 'samkoo', name: '삼구아이앤씨', code: 'SAMKOO', color: 'from-purple-600 to-purple-400' },
  { id: 'wcvs', name: '한화위캠버스', code: 'WCVS', color: 'from-orange-600 to-orange-400' },
  { id: 'gln', name: 'GLN', code: 'GLN', color: 'from-teal-600 to-teal-400' },
  { id: 'kurly', name: '컬리', code: 'KURLY', color: 'from-pink-600 to-pink-400' },
  { id: 'isu', name: '이수시스템', code: 'ISU', color: 'from-cyan-600 to-cyan-400' },
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
        {customers.map((customer) => (
          <motion.button
            key={customer.id}
            onClick={() => handleCustomerClick(customer.id)}
            className="group flex flex-col items-center gap-1.5 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* 색깔 바 */}
            <div 
              className={`w-12 h-1.5 bg-gradient-to-r ${customer.color} rounded-full group-hover:h-2 transition-all duration-200 shadow-sm`}
            />
            {/* 고객사명 */}
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              {customer.name}
            </span>
          </motion.button>
        ))}
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
      
      {/* Issues Management Placeholder */}
      <div className="dashboard-card p-6">
        <h3 className="text-lg font-semibold mb-4">고객사별 이슈사항 관리</h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          localStorage 기반 구현 예정 (추후 개발)
        </div>
      </div>
    </div>
  );
}