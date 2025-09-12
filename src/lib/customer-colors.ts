// 고객사별 시그니처 색상 정의
export const CUSTOMER_COLORS = {
  'GOODRICH': {
    name: '굿리치',
    primary: '#fbbf24', // 노란색 (yellow-400)
    light: '#fef3c7',   // 연한 노란색 (yellow-100)
    dark: '#f59e0b',    // 진한 노란색 (yellow-500)
    bg: '#fffbeb',      // 배경용 (yellow-50)
    border: '#fcd34d'   // 테두리용 (yellow-300)
  },
  'FINDA': {
    name: '핀다',
    primary: '#3b82f6', // 파란색 (blue-500)
    light: '#bfdbfe',   // 연한 파란색 (blue-200)
    dark: '#2563eb',    // 진한 파란색 (blue-600)
    bg: '#eff6ff',      // 배경용 (blue-50)
    border: '#60a5fa'   // 테두리용 (blue-400)
  },
  'SAMKOO': {
    name: '삼구아이앤씨',
    primary: '#84cc16', // 연두색 (lime-500)
    light: '#bef264',   // 연한 연두색 (lime-400)
    dark: '#65a30d',    // 진한 연두색 (lime-600)
    bg: '#f7fee7',      // 배경용 (lime-50)
    border: '#a3e635'   // 테두리용 (lime-400)
  },
  'WCVS': {
    name: '한화위캠버스',
    primary: '#f97316', // 주황색 (orange-500)
    light: '#fed7aa',   // 연한 주황색 (orange-200)
    dark: '#ea580c',    // 진한 주황색 (orange-600)
    bg: '#fff7ed',      // 배경용 (orange-50)
    border: '#fb923c'   // 테두리용 (orange-400)
  },
  'GLN': {
    name: 'GLN',
    primary: '#d946ef', // 오묘한 핑크-보라 (fuchsia-500)
    light: '#f0abfc',   // 연한 핑크-보라 (fuchsia-300)
    dark: '#c026d3',    // 진한 핑크-보라 (fuchsia-600)
    bg: '#fdf4ff',      // 배경용 (fuchsia-50)
    border: '#e879f9'   // 테두리용 (fuchsia-400)
  },
  'KURLY': {
    name: '컬리',
    primary: '#a855f7', // 연보라색 (purple-500)
    light: '#c4b5fd',   // 연한 보라색 (purple-300)
    dark: '#9333ea',    // 진한 보라색 (purple-600)
    bg: '#faf5ff',      // 배경용 (purple-50)
    border: '#c084fc'   // 테두리용 (purple-400)
  },
  'ISU': {
    name: '이수시스템',
    primary: '#06b6d4', // 하늘색 (cyan-500)
    light: '#67e8f9',   // 연한 하늘색 (cyan-300)
    dark: '#0891b2',    // 진한 하늘색 (cyan-600)
    bg: '#ecfeff',      // 배경용 (cyan-50)
    border: '#22d3ee'   // 테두리용 (cyan-400)
  }
} as const;

// 고객사 코드에서 색상 정보 가져오기
export const getCustomerColor = (customerCode: string) => {
  return CUSTOMER_COLORS[customerCode as keyof typeof CUSTOMER_COLORS] || {
    name: customerCode,
    primary: '#6b7280', // 기본 회색
    light: '#d1d5db',
    dark: '#4b5563', 
    bg: '#f9fafb',
    border: '#9ca3af'
  };
};

// 고객사 색상 배열 (차트용)
export const CUSTOMER_COLOR_ARRAY = [
  CUSTOMER_COLORS.GOODRICH.primary,
  CUSTOMER_COLORS.FINDA.primary,
  CUSTOMER_COLORS.SAMKOO.primary,
  CUSTOMER_COLORS.WCVS.primary,
  CUSTOMER_COLORS.GLN.primary,
  CUSTOMER_COLORS.KURLY.primary,
  CUSTOMER_COLORS.ISU.primary,
];

// 프로젝트 키를 고객사명으로 변환
export const getCustomerName = (projectKey: string): string => {
  const customer = getCustomerColor(projectKey);
  return customer.name;
};