import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useApp, getTabTitle } from '@/contexts/AppContext';
import { TopTabs } from './TopTabs';
import { MenuButton } from './MenuButton';
import { Sidebar } from './Sidebar';
import DebugPanel from '@/components/debug/DebugPanel';
import { Button } from '@/components/ui/button';
import { Bug, X } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentProgram, currentTab } = useApp();
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* 개발자 디버그 패널 */}
      {showDebugPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed top-4 left-4 right-4 bottom-4 bg-background border rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">🛠️ 개발자 디버그 패널</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 h-[calc(100%-80px)] overflow-hidden">
              <DebugPanel />
            </div>
          </div>
        </div>
      )}

      {/* 개발자 디버그 버튼 (최상단 고정) */}
      <Button
        onClick={() => setShowDebugPanel(true)}
        className="fixed top-2 right-2 z-40 bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-2 py-1 h-6"
        size="sm"
      >
        <Bug className="w-3 h-3 mr-1" />
        DEBUG
      </Button>

      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 레이아웃 */}
      <div className="min-h-screen">
        {/* 헤더 */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* 왼쪽: 메뉴 버튼 + 로고 + 현재 탭 제목 */}
              <div className="flex items-center gap-4">
                <MenuButton />
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="MetaShield Logo"
                    width={32}
                    height={32}
                    className="rounded-md"
                  />
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