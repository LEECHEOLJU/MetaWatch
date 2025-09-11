import { JIRA_CUSTOM_FIELDS, JIRA_STANDARD_FIELDS, ALL_JIRA_FIELDS } from '@/config/jira-fields';

export interface ExtractedJiraData {
  // Basic Information
  customer: string;
  country: string;
  severity: string;
  
  // Network Information
  sourceIp: string;
  destinationIp: string;
  sourcePort: string;
  destinationPort: string;
  direction: string;
  host: string;
  
  // Detection Information
  detectionTime: string;
  detectionDevice: string;
  detectionPath: string;
  detectionFile: string;
  
  // Threat Analysis
  payload: string;
  action: string;
  hashValue: string;
  scenarioName: string;
  attackType: string;
  attackCategory: string;
  
  // Web Related
  url: string;
  query: string;
  httpMethod: string;
  userAgent: string;
  
  // Standard Fields
  summary: string;
  description: string;
  priority: string;
  status: string;
  created: string;
  updated: string;
  assignee: string;
  reporter: string;
  
  // Raw data for additional processing
  rawFields: Record<string, any>;
}

/**
 * Jira 이슈에서 커스텀 필드 데이터를 추출합니다.
 * @param jiraIssue - Jira API에서 반환된 이슈 객체
 * @returns 추출된 데이터 객체
 */
export function extractJiraFields(jiraIssue: any): ExtractedJiraData {
  const fields = jiraIssue.fields || {};
  
  // 헬퍼 함수: 필드 값 추출
  const getFieldValue = (fieldKey: string): string => {
    const fieldConfig = JIRA_CUSTOM_FIELDS[fieldKey];
    if (!fieldConfig) return '';
    
    const value = fields[fieldConfig.fieldId];
    if (!value) return '';
    
    // 다양한 타입의 필드 값 처리
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value.value) return value.value; // Select field
    if (value.displayName) return value.displayName; // User field
    if (value.name) return value.name; // Option field
    if (Array.isArray(value)) return value.map(v => v.value || v.name || v).join(', ');
    
    return String(value);
  };
  
  // 표준 필드 값 추출
  const getStandardField = (fieldName: string): string => {
    const value = fields[fieldName];
    if (!value) return '';
    
    if (typeof value === 'string') return value;
    if (value.displayName) return value.displayName;
    if (value.name) return value.name;
    if (value.value) return value.value;
    
    return String(value);
  };

  // Description에서 특정 필드 값 추출하는 헬퍼 함수
  const extractFromDescription = (fieldName: string): string => {
    const description = getStandardField('description');
    if (!description) return '';
    
    const regex = new RegExp(`${fieldName}:\\s*([^\\n]+)`, 'i');
    const match = description.match(regex);
    return match ? match[1].trim() : '';
  };
  
  return {
    // Basic Information
    customer: getFieldValue('customer'),
    country: getFieldValue('country'),
    severity: getFieldValue('severity'),
    
    // Network Information
    sourceIp: getFieldValue('sourceIp'),
    destinationIp: getFieldValue('destinationIp'),
    sourcePort: getFieldValue('sourcePort'),
    destinationPort: getFieldValue('destinationPort'),
    direction: getFieldValue('direction'),
    host: getFieldValue('host'),
    
    // Detection Information
    detectionTime: getFieldValue('detectionTime'),
    detectionDevice: getFieldValue('detectionDevice'),
    detectionPath: getFieldValue('detectionPath'),
    detectionFile: getFieldValue('detectionFile'),
    
    // Threat Analysis
    payload: getFieldValue('payload') || extractFromDescription('Payload'),
    action: getFieldValue('action'),
    hashValue: getFieldValue('hashValue'),
    scenarioName: getFieldValue('scenarioName'),
    attackType: getFieldValue('attackType'),
    attackCategory: getFieldValue('attackCategory'),
    
    // Web Related
    url: getFieldValue('url') || extractFromDescription('URL'),
    query: getFieldValue('query') || extractFromDescription('Query'),
    httpMethod: getFieldValue('httpMethod') || extractFromDescription('httpMethod'),
    userAgent: getFieldValue('userAgent') || extractFromDescription('user_agent'),
    
    // Standard Fields
    summary: getStandardField('summary'),
    description: getStandardField('description'),
    priority: getStandardField('priority'),
    status: getStandardField('status'),
    created: getStandardField('created'),
    updated: getStandardField('updated'),
    assignee: getStandardField('assignee'),
    reporter: getStandardField('reporter'),
    
    // Raw data for additional processing
    rawFields: fields
  };
}

/**
 * AI 분석에 필요한 핵심 데이터만 추출합니다.
 * @param extractedData - extractJiraFields로 추출된 데이터
 * @returns AI 분석용 요약 데이터
 */
export function getAnalysisData(extractedData: ExtractedJiraData) {
  return {
    // 기본 식별 정보
    customer: extractedData.customer,
    summary: extractedData.summary,
    description: extractedData.description,
    severity: extractedData.severity,
    
    // 네트워크 정보
    sourceIp: extractedData.sourceIp,
    destinationIp: extractedData.destinationIp,
    sourcePort: extractedData.sourcePort,
    destinationPort: extractedData.destinationPort,
    direction: extractedData.direction,
    
    // 위협 정보
    payload: extractedData.payload,
    attackType: extractedData.attackType,
    attackCategory: extractedData.attackCategory,
    scenarioName: extractedData.scenarioName,
    
    // 웹 관련
    url: extractedData.url,
    httpMethod: extractedData.httpMethod,
    userAgent: extractedData.userAgent,
    
    // 탐지 정보
    detectionDevice: extractedData.detectionDevice,
    detectionTime: extractedData.detectionTime,
    
    // 메타 정보
    created: extractedData.created,
    priority: extractedData.priority,
    status: extractedData.status
  };
}

/**
 * IP 주소 추출 및 유효성 검사
 * @param extractedData - 추출된 Jira 데이터
 * @returns 유효한 IP 주소 배열
 */
export function extractValidIPs(extractedData: ExtractedJiraData): string[] {
  const ips: string[] = [];
  
  // IP 주소 유효성 검사 함수
  const isValidIP = (ip: string): boolean => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  };
  
  // 출발지 IP 추가
  if (extractedData.sourceIp && isValidIP(extractedData.sourceIp)) {
    ips.push(extractedData.sourceIp);
  }
  
  // 목적지 IP 추가 (여러 개일 수 있음)
  if (extractedData.destinationIp) {
    const destIps = extractedData.destinationIp.split(/[,;\s]+/).filter(Boolean);
    destIps.forEach(ip => {
      const cleanIp = ip.trim();
      if (isValidIP(cleanIp) && !ips.includes(cleanIp)) {
        ips.push(cleanIp);
      }
    });
  }
  
  return ips;
}

/**
 * AI 분석을 위한 컨텍스트 문자열 생성
 * @param extractedData - 추출된 Jira 데이터
 * @returns AI 분석용 컨텍스트 문자열
 */
export function generateAnalysisContext(extractedData: ExtractedJiraData): string {
  const context = [];
  
  // 기본 정보
  if (extractedData.customer) context.push(`고객사: ${extractedData.customer}`);
  if (extractedData.summary) context.push(`요약: ${extractedData.summary}`);
  if (extractedData.severity) context.push(`심각도: ${extractedData.severity}`);
  
  // 네트워크 정보
  if (extractedData.sourceIp) context.push(`출발지 IP: ${extractedData.sourceIp}`);
  if (extractedData.destinationIp) context.push(`목적지 IP: ${extractedData.destinationIp}`);
  if (extractedData.sourcePort) context.push(`출발지 포트: ${extractedData.sourcePort}`);
  if (extractedData.destinationPort) context.push(`목적지 포트: ${extractedData.destinationPort}`);
  if (extractedData.direction) context.push(`트래픽 방향: ${extractedData.direction}`);
  
  // 공격 정보
  if (extractedData.attackType) context.push(`공격 유형: ${extractedData.attackType}`);
  if (extractedData.attackCategory) context.push(`공격 분류: ${extractedData.attackCategory}`);
  if (extractedData.scenarioName) context.push(`탐지 시나리오: ${extractedData.scenarioName}`);
  
  // 웹 관련 정보
  if (extractedData.url) context.push(`URL: ${extractedData.url}`);
  if (extractedData.httpMethod) context.push(`HTTP 메소드: ${extractedData.httpMethod}`);
  if (extractedData.userAgent) context.push(`User-Agent: ${extractedData.userAgent}`);
  
  // 페이로드 (가장 중요한 정보이므로 마지막에 추가)
  if (extractedData.payload) {
    context.push(`페이로드: ${extractedData.payload}`);
  }
  
  return context.join('\n');
}