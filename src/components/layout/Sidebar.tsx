import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp, METAWATCH_MENU, METASHIELD_MENU, CurrentTab } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { currentProgram, currentTab, setCurrentTab, sidebarOpen, setSidebarOpen } = useApp();

  const currentMenu = currentProgram === 'metawatch' ? METAWATCH_MENU : METASHIELD_MENU;

  const handleTabClick = (tabId: CurrentTab) => {
    setCurrentTab(tabId);
    setSidebarOpen(false); // 모바일에서 탭 선택 후 사이드바 닫기
  };

  return (
    <>
      {/* 배경 오버레이 (모바일) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 사이드바 */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-0 left-0 h-full w-80 bg-card/95 backdrop-blur-sm border-r border-border z-50",
              "shadow-xl lg:shadow-none"
            )}
          >
            {/* 사이드바 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-foreground">
                  {currentProgram === 'metawatch' ? 'MetaWatch' : 'MetaShield'}
                </div>
                <div className="text-sm text-muted-foreground">
                  메뉴
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="사이드바 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 메뉴 리스트 */}
            <nav className="p-4">
              <div className="space-y-1">
                {currentMenu.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleTabClick(item.id as CurrentTab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200",
                      "hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
                      currentTab === item.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:text-accent-foreground"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      {currentTab === item.id && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-full h-0.5 bg-primary rounded-full mt-1"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* 미구현 기능 안내 */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">
                  {currentProgram === 'metawatch' 
                    ? '고객사별 대시보드는 향후 개발 예정입니다.'
                    : 'AI 분석 외 기능들은 향후 개발 예정입니다.'
                  }
                </div>
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}