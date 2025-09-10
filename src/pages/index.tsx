import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JiraConnectionStatus } from '@/components/dashboard/JiraConnectionStatus';
import { UrgentSecurityEventsWidget } from '@/components/dashboard/UrgentSecurityEventsWidget';
import { CustomerStatusOverview } from '@/components/dashboard/CustomerStatusOverview';
import { SecurityStatsChart } from '@/components/dashboard/SecurityStatsChart';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Jira Connection Status - Top Priority */}
        <div className="grid grid-cols-1">
          <JiraConnectionStatus />
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
    </DashboardLayout>
  );
}