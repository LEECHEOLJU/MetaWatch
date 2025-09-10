import React from 'react';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-foreground">
                MetaWatch
              </div>
              <div className="text-sm text-muted-foreground">
                보안관제센터 대시보드
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <LiveIndicator />
              <LastUpdateTime />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-green-500 font-medium">Live</span>
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
      <div className="text-sm text-muted-foreground">
        업데이트: --
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
    </div>
  );
}