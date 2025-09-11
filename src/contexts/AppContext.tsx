import React, { createContext, useContext, useState, ReactNode } from 'react';

// 프로그램 타입 정의
export type ProgramType = 'metawatch' | 'metashield';

// MetaWatch 탭 타입
export type MetaWatchTab = 'dashboard' | 'customer-goodrich' | 'customer-finda' | 'customer-samkoo' | 'customer-wcvs' | 'customer-gln' | 'customer-kurly' | 'customer-isu';

// MetaShield 탭 타입
export type MetaShieldTab = 'ai-analysis' | 'threat-intelligence' | 'reports';

// 현재 탭 타입
export type CurrentTab = MetaWatchTab | MetaShieldTab;

// Context 상태 타입
interface AppContextType {
  // 현재 선택된 프로그램
  currentProgram: ProgramType;
  setCurrentProgram: (program: ProgramType) => void;
  
  // 현재 선택된 탭
  currentTab: CurrentTab;
  setCurrentTab: (tab: CurrentTab) => void;
  
  // 사이드바 상태
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

// Context 생성
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Props
interface AppProviderProps {
  children: ReactNode;
}

// Provider 컴포넌트
export function AppProvider({ children }: AppProviderProps) {
  const [currentProgram, setCurrentProgram] = useState<ProgramType>('metawatch');
  const [currentTab, setCurrentTab] = useState<CurrentTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 프로그램 변경 시 기본 탭으로 설정
  const handleProgramChange = (program: ProgramType) => {
    setCurrentProgram(program);
    if (program === 'metawatch') {
      setCurrentTab('dashboard');
    } else if (program === 'metashield') {
      setCurrentTab('ai-analysis');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const value: AppContextType = {
    currentProgram,
    setCurrentProgram: handleProgramChange,
    currentTab,
    setCurrentTab,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// 프로그램별 메뉴 정의
export const METAWATCH_MENU: Array<{ id: MetaWatchTab; label: string; icon: string }> = [
  { id: 'dashboard', label: '보안관제센터 대시보드', icon: '🏠' },
  { id: 'customer-goodrich', label: '굿리치 대시보드', icon: '🏢' },
  { id: 'customer-finda', label: '핀다 대시보드', icon: '🏢' },
  { id: 'customer-samkoo', label: '삼구아이앤씨 대시보드', icon: '🏢' },
  { id: 'customer-wcvs', label: '한화위캠버스 대시보드', icon: '🏢' },
  { id: 'customer-gln', label: 'GLN 대시보드', icon: '🏢' },
  { id: 'customer-kurly', label: '컬리 대시보드', icon: '🏢' },
  { id: 'customer-isu', label: '이수시스템 대시보드', icon: '🏢' },
];

export const METASHIELD_MENU: Array<{ id: MetaShieldTab; label: string; icon: string }> = [
  { id: 'ai-analysis', label: 'AI 분석', icon: '🤖' },
  { id: 'threat-intelligence', label: '위협 인텔리전스', icon: '📊' },
  { id: 'reports', label: '보고서 생성', icon: '📈' },
];

// 탭 제목 가져오기 헬퍼 함수
export function getTabTitle(program: ProgramType, tab: CurrentTab): string {
  if (program === 'metawatch') {
    const menuItem = METAWATCH_MENU.find(item => item.id === tab);
    return menuItem?.label || 'MetaWatch';
  } else if (program === 'metashield') {
    const menuItem = METASHIELD_MENU.find(item => item.id === tab);
    return menuItem?.label || 'MetaShield';
  }
  return 'Dashboard';
}

// 프로그램 제목 가져오기
export function getProgramTitle(program: ProgramType): string {
  switch (program) {
    case 'metawatch':
      return 'MetaWatch';
    case 'metashield':
      return 'MetaShield';
    default:
      return 'Dashboard';
  }
}