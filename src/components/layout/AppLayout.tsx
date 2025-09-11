import React from 'react';
import { motion } from 'framer-motion';
import { useApp, getTabTitle } from '@/contexts/AppContext';
import { TopTabs } from './TopTabs';
import { MenuButton } from './MenuButton';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentProgram, currentTab } = useApp();

  return (
    <div className="min-h-screen bg-background">
      {/* 사이드바 */}
      <Sidebar />
      
      {/* 메인 레이아웃 */}
      <div className="min-h-screen">
        {/* 헤더 */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* 왼쪽: 메뉴 버튼 + 현재 탭 제목 */}
              <div className="flex items-center gap-4">
                <MenuButton />
                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold text-foreground">
                    {getTabTitle(currentProgram, currentTab)}
                  </div>
                </div>
              </div>
              
              {/* 가운데: 프로그램 탭 */}
              <div className="hidden md:block">
                <TopTabs />
              </div>
              
              {/* 오른쪽: 상태 표시 */}
              <div className="flex items-center gap-4">
                <LiveIndicator />
                <LastUpdateTime />
              </div>
            </div>
            
            {/* 모바일용 프로그램 탭 */}
            <div className="mt-4 md:hidden">
              <TopTabs />
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="container mx-auto px-4 py-6">
          <motion.div
            key={`${currentProgram}-${currentTab}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-green-500 font-medium hidden sm:inline">Live</span>
    </div>
  );
}

function LastUpdateTime() {
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setLastUpdate(new Date());
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !lastUpdate) {
    return (
      <div className="text-sm text-muted-foreground hidden sm:block">
        업데이트: --
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground hidden sm:block">
      업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
    </div>
  );
}