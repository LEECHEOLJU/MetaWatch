export interface CustomerIssue {
  id: string;
  customer_code: string;
  customer_name: string;
  title: string;
  description: string;
  priority: 'urgent' | 'normal' | 'completed' | 'on_hold';
  created_at: string;
  due_date?: string;
  email_content?: EmailContent;
  ai_analysis?: AIAnalysis;
  is_manual: boolean;
  created_by?: string;
  updated_at?: string;
  tags?: string[];
  related_ips?: string[];
}

export interface EmailContent {
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  attachments?: string[];
  raw_content?: string;
}

export interface AIAnalysis {
  customer: string;
  request_type: string;
  priority: 'urgent' | 'normal';
  ip_addresses: string[];
  summary: string;
  details: string;
  due_date?: string;
  confidence_score: number;
  extracted_keywords: string[];
}

export interface IssuesSummary {
  total: number;
  urgent: number;
  normal: number;
  completed: number;
  on_hold: number;
  by_customer: Record<string, number>;
}

export type IssuePriority = 'urgent' | 'normal' | 'completed' | 'on_hold';

export const PRIORITY_COLORS = {
  urgent: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '🔴',
    label: '긴급'
  },
  normal: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30', 
    text: 'text-yellow-400',
    icon: '🟡',
    label: '보통'
  },
  completed: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: '🟢',
    label: '완료'
  },
  on_hold: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    icon: '⚪',
    label: '보류'
  }
};

export const REQUEST_TYPES = [
  { id: 'ip_exclude', label: 'IP 차단 해제 요청', icon: '🚫', description: 'IP 주소나 대역의 차단 해제' },
  { id: 'ip_allow', label: 'IP 허용 요청', icon: '✅', description: '특정 IP의 접근 허용' },
  { id: 'domain_exclude', label: '도메인 차단 해제', icon: '🌐', description: '도메인의 차단 해제' },
  { id: 'port_allow', label: '포트 개방 요청', icon: '🔌', description: '특정 포트의 개방' },
  { id: 'vpn_access', label: 'VPN 접속 허용', icon: '🔒', description: 'VPN 접속 권한 부여' },
  { id: 'remote_work', label: '원격근무 지원', icon: '🏠', description: '원격근무를 위한 보안 설정' },
  { id: 'ssl_cert', label: 'SSL 인증서', icon: '🔐', description: 'SSL 인증서 관련 요청' },
  { id: 'pentest', label: '모의해킹 지원', icon: '🔍', description: '모의해킹 테스트 지원' },
  { id: 'security_audit', label: '보안점검 지원', icon: '🛡️', description: '보안점검 관련 지원' },
  { id: 'policy_change', label: '정책 변경', icon: '📋', description: '보안정책 변경 요청' },
  { id: 'monitoring_process', label: '관제프로세스 변경', icon: '🔄', description: '보안관제 프로세스 및 절차 변경' },
  { id: 'account_mgmt', label: '계정 관리', icon: '👤', description: '사용자 계정 관련 요청' },
  { id: 'log_analysis', label: '로그 분석', icon: '📊', description: '로그 분석 및 조사' },
  { id: 'incident_response', label: '사고 대응', icon: '🚨', description: '보안사고 대응 지원' },
  { id: 'compliance', label: '컴플라이언스', icon: '📄', description: '규정 준수 관련 요청' },
  { id: 'consultation', label: '보안 상담', icon: '💬', description: '보안 관련 상담' },
  { id: 'other', label: '기타 요청', icon: '📝', description: '기타 보안 관련 요청' }
];