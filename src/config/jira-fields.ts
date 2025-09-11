/**
 * Jira 커스텀 필드 정의
 * 보안이벤트 분석 및 대시보드에서 사용되는 모든 Jira 필드 정보
 */

export interface JiraCustomField {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  description?: string;
  category: 'basic' | 'detection' | 'network' | 'analysis' | 'threat' | 'incident';
}

/**
 * Jira 커스텀 필드 매핑
 */
export const JIRA_CUSTOM_FIELDS: Record<string, JiraCustomField> = {
  // 기본 정보
  customer: {
    fieldId: 'customfield_10211',
    fieldName: '고객사',
    fieldType: 'text_single',
    description: '보안이벤트가 발생한 고객사명',
    category: 'basic'
  },
  country: {
    fieldId: 'customfield_10218',
    fieldName: '국가',
    fieldType: 'text_single',
    description: '이벤트 발생 국가',
    category: 'basic'
  },
  severity: {
    fieldId: 'customfield_10222',
    fieldName: '심각도',
    fieldType: 'text_single',
    description: '보안이벤트의 심각도 레벨',
    category: 'basic'
  },

  // 탐지 정보
  detectionTime: {
    fieldId: 'customfield_10214',
    fieldName: '탐지시간',
    fieldType: 'text_single',
    description: '보안이벤트가 탐지된 시간',
    category: 'detection'
  },
  detectionDevice: {
    fieldId: 'customfield_10212',
    fieldName: '탐지장비',
    fieldType: 'text_single',
    description: '이벤트를 탐지한 보안장비명',
    category: 'detection'
  },
  detectionDeviceId: {
    fieldId: 'customfield_10213',
    fieldName: '탐지장비 고유번호',
    fieldType: 'text_single',
    description: '탐지장비의 고유 식별번호',
    category: 'detection'
  },
  detectionPath: {
    fieldId: 'customfield_10224',
    fieldName: '탐지경로',
    fieldType: 'text_single',
    description: '이벤트가 탐지된 네트워크 경로',
    category: 'detection'
  },
  detectionFile: {
    fieldId: 'customfield_10223',
    fieldName: '탐지파일',
    fieldType: 'text_single',
    description: '탐지된 악성 파일명',
    category: 'detection'
  },
  detectionStart: {
    fieldId: 'customfield_10241',
    fieldName: '탐지시작',
    fieldType: 'text_single',
    description: '탐지 시작 시간',
    category: 'detection'
  },
  detectionEnd: {
    fieldId: 'customfield_10242',
    fieldName: '탐지종료',
    fieldType: 'text_single',
    description: '탐지 종료 시간',
    category: 'detection'
  },

  // 네트워크 정보
  sourceIp: {
    fieldId: 'customfield_10216',
    fieldName: '출발지IP',
    fieldType: 'text_single',
    description: '공격 출발지 IP 주소',
    category: 'network'
  },
  destinationIp: {
    fieldId: 'customfield_10251',
    fieldName: '목적지IP',
    fieldType: 'text_multi',
    description: '공격 목적지 IP 주소',
    category: 'network'
  },
  sourcePort: {
    fieldId: 'customfield_10252',
    fieldName: '출발지 Port',
    fieldType: 'text_single',
    description: '출발지 포트번호',
    category: 'network'
  },
  destinationPort: {
    fieldId: 'customfield_10219',
    fieldName: '목적지 Port',
    fieldType: 'text_single',
    description: '목적지 포트번호',
    category: 'network'
  },
  direction: {
    fieldId: 'customfield_10215',
    fieldName: '인바운드/아웃바운드',
    fieldType: 'text_single',
    description: '트래픽 방향 (인바운드/아웃바운드)',
    category: 'network'
  },
  host: {
    fieldId: 'customfield_10235',
    fieldName: 'Host',
    fieldType: 'text_single',
    description: '호스트 정보',
    category: 'network'
  },

  // 위협 분석
  action: {
    fieldId: 'customfield_10226',
    fieldName: 'Action',
    fieldType: 'text_single',
    description: '수행된 액션',
    category: 'threat'
  },
  hashValue: {
    fieldId: 'customfield_10225',
    fieldName: '해시값',
    fieldType: 'text_single',
    description: '파일의 해시값 (MD5, SHA256 등)',
    category: 'threat'
  },
  scenarioName: {
    fieldId: 'customfield_10228',
    fieldName: '시나리오명',
    fieldType: 'text_single',
    description: '탐지 시나리오명',
    category: 'threat'
  },
  threatMatched: {
    fieldId: 'customfield_10244',
    fieldName: 'threat_matched',
    fieldType: 'text_single',
    description: '매칭된 위협 정보',
    category: 'threat'
  },
  userAgent: {
    fieldId: 'customfield_10245',
    fieldName: 'user_agent',
    fieldType: 'text_single',
    description: 'HTTP User-Agent 헤더',
    category: 'threat'
  },
  attackType: {
    fieldId: 'customfield_10467',
    fieldName: '공격유형',
    fieldType: 'text_single',
    description: '공격의 유형 분류',
    category: 'threat'
  },
  attackCategory: {
    fieldId: 'customfield_10468',
    fieldName: '공격분류',
    fieldType: 'text_single',
    description: '공격의 세부 분류',
    category: 'threat'
  },

  // 웹 관련
  region: {
    fieldId: 'customfield_10229',
    fieldName: 'region',
    fieldType: 'text_single',
    description: '지역 정보',
    category: 'network'
  },
  url: {
    fieldId: 'customfield_10230',
    fieldName: 'URL',
    fieldType: 'text_single',
    description: '관련 URL',
    category: 'network'
  },
  query: {
    fieldId: 'customfield_10231',
    fieldName: 'Query',
    fieldType: 'text_single',
    description: 'HTTP 쿼리 파라미터',
    category: 'network'
  },
  payload: {
    fieldId: 'customfield_10232',
    fieldName: 'Payload',
    fieldType: 'text_single',
    description: '공격 페이로드',
    category: 'threat'
  },
  httpMethod: {
    fieldId: 'customfield_10233',
    fieldName: 'httpMethod',
    fieldType: 'text_single',
    description: 'HTTP 메소드 (GET, POST 등)',
    category: 'network'
  },
  accountId: {
    fieldId: 'customfield_10234',
    fieldName: 'accountid',
    fieldType: 'text_single',
    description: '계정 ID',
    category: 'basic'
  },

  // 탐지 룰 정보
  detectionRule: {
    fieldId: 'customfield_10238',
    fieldName: 'count 탐지 룰',
    fieldType: 'text_single',
    description: '탐지 룰 수',
    category: 'detection'
  },
  detectionDetails: {
    fieldId: 'customfield_10239',
    fieldName: 'count 탐지 세부정보',
    fieldType: 'text_single',
    description: '탐지 세부정보 수',
    category: 'detection'
  },
  detectionPattern: {
    fieldId: 'customfield_10240',
    fieldName: 'count 탐지 패턴',
    fieldType: 'text_single',
    description: '탐지 패턴 수',
    category: 'detection'
  },
  count: {
    fieldId: 'customfield_10243',
    fieldName: 'count',
    fieldType: 'text_single',
    description: '이벤트 발생 횟수',
    category: 'detection'
  },
  detectionName: {
    fieldId: 'customfield_10249',
    fieldName: '탐지명',
    fieldType: 'text_multi',
    description: '탐지 규칙명',
    category: 'detection'
  },

  // 분석 정보
  attackPattern: {
    fieldId: 'customfield_10246',
    fieldName: '공격 패턴, 분석 내용 짧게(1)',
    fieldType: 'text_multi',
    description: '공격 패턴 및 간단한 분석 내용',
    category: 'analysis'
  },
  impactAnalysis: {
    fieldId: 'customfield_10247',
    fieldName: '단/다발성 여부(2), 영향도 파악(3)',
    fieldType: 'text_multi',
    description: '단발성/다발성 여부 및 영향도 분석',
    category: 'analysis'
  },
  threatIntelligence: {
    fieldId: 'customfield_10248',
    fieldName: '위협 평판 조회(4)',
    fieldType: 'text_multi',
    description: '위협 평판 및 인텔리전스 조회 결과',
    category: 'analysis'
  },

  // 인시던트 정보
  incidentId: {
    fieldId: 'customfield_10163',
    fieldName: 'Incident ID',
    fieldType: 'text_single',
    description: '인시던트 고유 ID',
    category: 'incident'
  },
  incidentUrl: {
    fieldId: 'customfield_10105',
    fieldName: '인시던트 URL',
    fieldType: 'text_single',
    description: '인시던트 관련 URL',
    category: 'incident'
  },
  responseCode: {
    fieldId: 'customfield_10258',
    fieldName: '응답코드',
    fieldType: 'text_single',
    description: 'HTTP 응답 코드',
    category: 'network'
  }
};

/**
 * 기본 Jira 필드 (커스텀 필드가 아닌 표준 필드)
 */
export const JIRA_STANDARD_FIELDS = {
  summary: 'summary',
  description: 'description',
  issuetype: 'issuetype',
  priority: 'priority',
  status: 'status',
  assignee: 'assignee',
  reporter: 'reporter',
  created: 'created',
  updated: 'updated',
  attachment: 'attachment',
  issuelinks: 'issuelinks',
  project: 'project',
  protocol: 'protocol' // 프로토콜 (표준 필드로 추정)
};

/**
 * 카테고리별 필드 그룹핑
 */
export const FIELD_CATEGORIES = {
  basic: ['customer', 'country', 'severity', 'accountId'],
  detection: ['detectionTime', 'detectionDevice', 'detectionDeviceId', 'detectionPath', 'detectionFile', 'detectionStart', 'detectionEnd', 'detectionRule', 'detectionDetails', 'detectionPattern', 'count', 'detectionName'],
  network: ['sourceIp', 'destinationIp', 'sourcePort', 'destinationPort', 'direction', 'host', 'region', 'url', 'query', 'httpMethod', 'responseCode'],
  threat: ['action', 'hashValue', 'scenarioName', 'threatMatched', 'userAgent', 'attackType', 'attackCategory', 'payload'],
  analysis: ['attackPattern', 'impactAnalysis', 'threatIntelligence'],
  incident: ['incidentId', 'incidentUrl']
};

/**
 * 특정 카테고리의 필드들을 가져오는 헬퍼 함수
 */
export function getFieldsByCategory(category: keyof typeof FIELD_CATEGORIES): JiraCustomField[] {
  return FIELD_CATEGORIES[category].map(fieldKey => JIRA_CUSTOM_FIELDS[fieldKey]);
}

/**
 * 필드 ID로 필드 정보를 가져오는 헬퍼 함수
 */
export function getFieldById(fieldId: string): JiraCustomField | undefined {
  return Object.values(JIRA_CUSTOM_FIELDS).find(field => field.fieldId === fieldId);
}

/**
 * 필드명으로 필드 정보를 가져오는 헬퍼 함수
 */
export function getFieldByName(fieldName: string): JiraCustomField | undefined {
  return Object.values(JIRA_CUSTOM_FIELDS).find(field => field.fieldName === fieldName);
}

/**
 * API 호출시 필요한 모든 커스텀 필드 ID 배열
 */
export const ALL_CUSTOM_FIELD_IDS = Object.values(JIRA_CUSTOM_FIELDS).map(field => field.fieldId);

/**
 * API 호출시 필요한 모든 필드 (표준 + 커스텀)
 */
export const ALL_JIRA_FIELDS = [
  ...Object.values(JIRA_STANDARD_FIELDS),
  ...ALL_CUSTOM_FIELD_IDS
];