// 고객사 정보
export const CUSTOMERS = {
  GOODRICH: { key: 'GOODRICH', name: '굿리치' },
  FINDA: { key: 'FINDA', name: '핀다' },
  SAMKOO: { key: 'SAMKOO', name: '삼구아이앤씨' },
  WCVS: { key: 'WCVS', name: '한화위캠버스' },
  GLN: { key: 'GLN', name: 'GLN' },
  KURLY: { key: 'KURLY', name: '컬리' },
  ISU: { key: 'ISU', name: '이수시스템' },
} as const;

export const CUSTOMER_LIST = Object.values(CUSTOMERS);
export const PROJECT_KEYS = Object.keys(CUSTOMERS);

// 티켓 상태 정보
export const TICKET_STATUSES = {
  UNRESOLVED: '미해결',
  REQUIRES_APPROVAL: '정탐(승인필요 대상)',
  FALSE_POSITIVE: '오탐 확인 완료',
  UNAPPROVED_BLOCKING: '차단 미승인 완료',
  PENDING_APPROVAL: '승인 대기',
  PRE_BLOCKED: '기 차단 완료',
  APPROVED_BLOCKING: '승인 후 차단 완료',
  AGREED_BLOCKING: '협의된 차단 완료',
} as const;

export const STATUS_LIST = Object.values(TICKET_STATUSES);

// Jira 커스텀 필드 매핑
export const JIRA_FIELDS = {
  SRC_IP: 'customfield_10216',       // 출발지IP
  COUNTRY: 'customfield_10218',      // 국가
  DETECTOR: 'customfield_10212',     // 탐지장비
  SEVERITY: 'priority',              // 심각도(우선순위)
  SCENARIO: 'customfield_10228',     // 시나리오명
  SIGNATURE: 'customfield_10249',    // 탐지명
  CUSTOMER: 'customfield_10211',     // 고객사
} as const;

// 업데이트 주기 (밀리초)
export const UPDATE_INTERVALS = {
  URGENT_TICKETS: 30 * 1000,         // 30초
  STATUS_TABLE: 2 * 60 * 1000,       // 2분
  STATISTICS: 5 * 60 * 1000,         // 5분
  FULL_REFRESH: 10 * 60 * 1000,      // 10분
} as const;

// JQL 쿼리 템플릿
export const JQL_QUERIES = {
  ALL_PROJECTS: `project IN (${PROJECT_KEYS.map(k => `"${k}"`).join(', ')})`,
  SECURITY_EVENTS: 'issuetype="보안이벤트"',
  URGENT_TICKETS: `
    project IN (${PROJECT_KEYS.map(k => `"${k}"`).join(', ')}) 
    AND issuetype="보안이벤트" 
    AND status="미해결" 
    AND priority IN ("Highest", "High")
    ORDER BY priority DESC, created ASC
  `.trim(),
  
  DAILY_TICKETS: (date: string) => `
    project IN (${PROJECT_KEYS.map(k => `"${k}"`).join(', ')}) 
    AND issuetype="보안이벤트"
    AND created >= "${date} 00:00" AND created <= "${date} 23:59"
    ORDER BY created DESC
  `.trim(),
  
  CUSTOMER_TICKETS: (projectKey: string, status?: string, startDate?: string, endDate?: string) => {
    let query = `project = "${projectKey}" AND issuetype="보안이벤트"`;
    if (status) query += ` AND status = "${status}"`;
    if (startDate && endDate) {
      query += ` AND created >= "${startDate} 00:00" AND created <= "${endDate} 23:59"`;
    }
    return query + ' ORDER BY created DESC';
  },
} as const;

// 상태별 색상 매핑
export const STATUS_COLORS = {
  [TICKET_STATUSES.UNRESOLVED]: 'red',
  [TICKET_STATUSES.REQUIRES_APPROVAL]: 'orange',
  [TICKET_STATUSES.FALSE_POSITIVE]: 'gray',
  [TICKET_STATUSES.UNAPPROVED_BLOCKING]: 'yellow',
  [TICKET_STATUSES.PENDING_APPROVAL]: 'yellow',
  [TICKET_STATUSES.PRE_BLOCKED]: 'green',
  [TICKET_STATUSES.APPROVED_BLOCKING]: 'green',
  [TICKET_STATUSES.AGREED_BLOCKING]: 'green',
} as const;

// 우선순위 매핑
export const PRIORITY_ORDER = ['Highest', 'High', 'Medium', 'Low'] as const;