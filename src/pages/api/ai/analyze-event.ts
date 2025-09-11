import type { NextApiRequest, NextApiResponse } from 'next';
import { extractJiraFields, getAnalysisData, extractValidIPs, generateAnalysisContext } from '@/lib/jira-extractor';
import { ALL_JIRA_FIELDS } from '@/config/jira-fields';

interface VirusTotalResponse {
  data: {
    attributes: {
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
      };
      reputation: number;
    };
  };
}

interface AbuseIPDBResponse {
  data: {
    abuseConfidenceScore: number;
    totalReports: number;
    numDistinctUsers: number;
    countryCode: string;
    usageType: string;
    isp: string;
  };
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventKey, eventId } = req.body;

  if (!eventKey) {
    return res.status(400).json({ error: 'Event key is required' });
  }

  try {
    console.log(`[DEBUG] AI 분석 시작: ${eventKey}`);
    
    // 1. Jira에서 이슈 데이터 가져오기
    console.log(`[DEBUG] Jira 이슈 데이터 가져오는 중...`);
    const jiraData = await fetchJiraIssue(eventKey);
    console.log(`[DEBUG] Jira 데이터 가져오기 완료:`, jiraData.key);
    
    const extractedData = extractJiraFields(jiraData);
    console.log(`[DEBUG] 추출된 필드 데이터:`, JSON.stringify(extractedData, null, 2));
    
    // Payload 필드 상세 디버깅
    console.log(`[DEBUG] Jira 원본 필드 데이터 (customfield_10232):`, jiraData.fields?.customfield_10232);
    console.log(`[DEBUG] 추출된 payload 값:`, extractedData.payload);
    
    // 모든 커스텀 필드 확인
    console.log(`[DEBUG] 모든 커스텀 필드 (10232 포함):`, Object.keys(jiraData.fields || {}).filter(key => key.startsWith('customfield_102')));
    
    const analysisData = getAnalysisData(extractedData);
    const validIPs = extractValidIPs(extractedData);
    console.log(`[DEBUG] 유효한 IP 주소들:`, validIPs);
    
    const analysisContext = generateAnalysisContext(extractedData);
    console.log(`[DEBUG] AI 분석용 컨텍스트:`, analysisContext);

    // 2. IP 평판 조회 (병렬 처리)
    const ipReputationPromises = validIPs.map(async (ip) => {
      const [virusTotal, abuseipdb] = await Promise.allSettled([
        checkVirusTotal(ip),
        checkAbuseIPDB(ip)
      ]);

      return {
        ip,
        virusTotal: virusTotal.status === 'fulfilled' ? virusTotal.value : null,
        abuseipdb: abuseipdb.status === 'fulfilled' ? abuseipdb.value : null
      };
    });

    const ipReputations = await Promise.all(ipReputationPromises);
    
    // 주 IP (출발지 IP) 선택
    const primaryIP = extractedData.sourceIp || validIPs[0] || '';
    const primaryReputation = ipReputations.find(rep => rep.ip === primaryIP);

    // 3. Azure OpenAI로 종합 분석
    const aiAnalysis = await performAIAnalysis(analysisContext, ipReputations);

    // 4. 결과 반환
    const result = {
      analysis: aiAnalysis,
      ipReputation: {
        virusTotal: primaryReputation?.virusTotal || {
          malicious: 0,
          suspicious: 0,
          clean: 0,
          undetected: 0,
          reputation: 0
        },
        abuseipdb: primaryReputation?.abuseipdb || {
          abuseConfidence: 0,
          totalReports: 0,
          numDistinctUsers: 0,
          countryCode: 'N/A',
          usageType: 'N/A',
          isp: 'N/A'
        }
      },
      extractedData: extractedData,
      analysisTime: new Date().toISOString()
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('=== AI Analysis Error Details ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Event Key:', eventKey);
    console.error('Event ID:', eventId);
    console.error('=====================================');
    
    res.status(500).json({ 
      error: 'AI 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      eventKey: eventKey,
      timestamp: new Date().toISOString()
    });
  }
}

async function fetchJiraIssue(issueKey: string) {
  const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  
  const response = await fetch(
    `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/rest/api/2/issue/${issueKey}?fields=${ALL_JIRA_FIELDS.join(',')}`,
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Jira issue: ${response.statusText}`);
  }

  return response.json();
}

async function checkVirusTotal(ip: string) {
  if (!process.env.VIRUSTOTAL_API_KEY) {
    throw new Error('VirusTotal API key not configured in environment variables');
  }

  console.log(`[DEBUG] VirusTotal API 호출: IP=${ip}, Key=${process.env.VIRUSTOTAL_API_KEY?.substring(0, 8)}...`);

  const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
    headers: {
      'x-apikey': process.env.VIRUSTOTAL_API_KEY,
    },
  });

  console.log(`[DEBUG] VirusTotal 응답 상태: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ERROR] VirusTotal API 오류: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`VirusTotal API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: VirusTotalResponse = await response.json();
  console.log(`[DEBUG] VirusTotal 응답 데이터:`, JSON.stringify(data, null, 2));
  
  const stats = data.data.attributes.last_analysis_stats;

  return {
    malicious: stats.malicious,
    suspicious: stats.suspicious,
    clean: stats.harmless,
    undetected: stats.undetected,
    reputation: data.data.attributes.reputation || 0
  };
}

async function checkAbuseIPDB(ip: string) {
  if (!process.env.ABUSEIPDB_API_KEY) {
    throw new Error('AbuseIPDB API key not configured in environment variables');
  }

  console.log(`[DEBUG] AbuseIPDB API 호출: IP=${ip}, Key=${process.env.ABUSEIPDB_API_KEY?.substring(0, 8)}...`);

  const response = await fetch(
    `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`,
    {
      headers: {
        'Key': process.env.ABUSEIPDB_API_KEY,
        'Accept': 'application/json',
      },
    }
  );

  console.log(`[DEBUG] AbuseIPDB 응답 상태: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ERROR] AbuseIPDB API 오류: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`AbuseIPDB API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: AbuseIPDBResponse = await response.json();
  console.log(`[DEBUG] AbuseIPDB 응답 데이터:`, JSON.stringify(data, null, 2));

  return {
    abuseConfidence: data.data.abuseConfidenceScore || 0,
    totalReports: data.data.totalReports || 0,
    numDistinctUsers: data.data.numDistinctUsers || 0,
    countryCode: data.data.countryCode || 'N/A',
    usageType: data.data.usageType || 'N/A',
    isp: data.data.isp || 'N/A'
  };
}

async function performAIAnalysis(context: string, ipReputations: any[]) {
  if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
    throw new Error('Azure OpenAI configuration missing');
  }

  console.log(`[DEBUG] Azure OpenAI 설정 확인:`);
  console.log(`- Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
  console.log(`- Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT}`);
  console.log(`- API Version: ${process.env.AZURE_OPENAI_API_VERSION}`);
  console.log(`- API Key: ${process.env.AZURE_OPENAI_API_KEY?.substring(0, 10)}...`);

  // IP 평판 정보를 텍스트로 변환
  const ipReputationText = ipReputations.map(rep => {
    const vt = rep.virusTotal;
    const abuse = rep.abuseipdb;
    return `IP ${rep.ip}: VirusTotal(악성:${vt?.malicious || 0}, 의심:${vt?.suspicious || 0}), AbuseIPDB(신뢰도:${abuse?.abuseConfidence || 0}%)`;
  }).join('\n');

  console.log(`[DEBUG] IP 평판 텍스트:`, ipReputationText);

  const prompt = `
아래의 보안 이벤트 정보와 Payload를 기반으로, 보안 분석 보고서를 작성해 주세요.

## 이벤트 정보:
${context}

## IP 평판 정보:
${ipReputationText}

너는 MSSP업체에 숙련된 시니어 보안분석 전문가야
보안 분석가 입장에서 이벤트와 payload를 분석하여 고객에게 분석 내역을 제공해줘야돼
너무 딱딱하게 말고 아래 보고서 형태를 지켜서 고객이 보고 이해하기 쉬운 분석 보고서를 작성해줘

다음 형식을 정확히 지켜서 작성해주세요:

<위협도 판단> : XX% (낮음/보통/높음/심각)

1. [🛡️탐지 이벤트 분석 요약]
   (간단한 탐지 이벤트 분석 내용을 간결하게 작성)

2. [🔍상세 분석] 
   (실제 공격 기법, 공격 흐름, 사용된 툴 및 기법 등을 상세히 기술, 공격 구문등 구체적으로 작성)

3. [⚠️영향 받는 제품 및 조건]
   (공격에 대한 관련 취약점 정보 및 영향 받는 제품, 버전, 환경 등을 명확히 기술)

4. [🕵️대응 방안]
   (고객사 관점에서 실무에 바로 적용할 수 있는 구체적인 대응 방안과 권고사항을 작성)

5. [🚨추가 탐지 내역 / 평판 조회]
   (추가 참고할 만한 탐지 내역이나 평판 조회 결과가 있다면 작성, VirusTotal, AbuseIPDB 등 TIDB 조회 내용 포함
    MITRE ATT&CK 기법 매핑이 가능하면 매핑 내용도 작성)

위 형식에서 [] 안의 제목과 이모지는 절대 변경하지 마세요.

🚨 금지사항:
- 마크다운 문법 (#, *, -, \`, **) 사용 금지
- 제목 이모지 변경 금지  
- 번호 매김 변경 금지

절대 지켜야 할 규칙들:
1. 마크다운 문법 완전 금지: #, *, -, \`, ** 등 특수문자 사용 절대 불가
2. 위의 1-5번 형식만 사용하여 답변
3. 탐지 패턴/시나리오명 입력시 보안 분석가 관점 도움말 제공
4. CVE/제품명/서비스명 입력시 해당 취약점 분석 보고서 작성
5. 보안 관련 질문시 보안 전문가로서 답변
`;

  const apiUrl = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`;
  console.log(`[DEBUG] Azure OpenAI API URL:`, apiUrl);
  console.log(`[DEBUG] 프롬프트 전송:`, prompt);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: '당신은 사이버 보안 전문가입니다. 보안 이벤트를 정확하고 신속하게 분석하여 실용적인 대응 방안을 제시합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  console.log(`[DEBUG] Azure OpenAI 응답 상태: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ERROR] Azure OpenAI API 오류: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: OpenAIResponse = await response.json();
  console.log(`[DEBUG] Azure OpenAI 응답 데이터:`, JSON.stringify(data, null, 2));
  
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    // 새로운 보안 분석 응답 파싱
    const threatLevelMatch = content.match(/<위협도 판단>\s*:\s*(\d+)%\s*\(([^)]+)\)/);
    const section1Match = content.match(/1\.\s*\[🛡️탐지 이벤트 분석 요약\]\s*([\s\S]*?)(?=2\.|$)/);
    const section2Match = content.match(/2\.\s*\[🔍상세 분석\]\s*([\s\S]*?)(?=3\.|$)/);
    const section3Match = content.match(/3\.\s*\[⚠️영향 받는 제품 및 조건\]\s*([\s\S]*?)(?=4\.|$)/);
    const section4Match = content.match(/4\.\s*\[🕵️대응 방안\]\s*([\s\S]*?)(?=5\.|$)/);
    const section5Match = content.match(/5\.\s*\[🚨추가 탐지 내역 \/ 평판 조회\]\s*([\s\S]*?)$/);

    const confidence = threatLevelMatch ? parseInt(threatLevelMatch[1]) : 50;
    const threatLevel = threatLevelMatch ? threatLevelMatch[2].trim() : '보통';
    
    // 위협 레벨을 영문으로 변환
    let riskLevel = 'medium';
    if (threatLevel.includes('낮음') || threatLevel.includes('low')) riskLevel = 'low';
    else if (threatLevel.includes('높음') || threatLevel.includes('high')) riskLevel = 'high';
    else if (threatLevel.includes('심각') || threatLevel.includes('critical')) riskLevel = 'critical';

    return {
      detailedAnalysis: {
        threatLevel: `${confidence}% (${threatLevel})`,
        section1: section1Match ? section1Match[1].trim() : '분석 데이터가 없습니다.',
        section2: section2Match ? section2Match[1].trim() : '상세 분석 데이터가 없습니다.',
        section3: section3Match ? section3Match[1].trim() : '영향도 분석 데이터가 없습니다.',
        section4: section4Match ? section4Match[1].trim() : '대응 방안 데이터가 없습니다.',
        section5: section5Match ? section5Match[1].trim() : '추가 탐지 내역이 없습니다.'
      },
      // 기존 형식도 유지 (하위 호환성)
      summary: section1Match ? section1Match[1].trim().substring(0, 200) : '보안 이벤트 분석 완료',
      riskLevel: riskLevel,
      attackType: '보안 위협',
      recommendation: section4Match ? section4Match[1].trim().substring(0, 200) : '분석된 대응 방안을 확인하세요.',
      confidence: confidence,
      rawContent: content
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    return {
      detailedAnalysis: {
        threatLevel: '분석 실패',
        section1: 'AI 응답 파싱에 실패했습니다.',
        section2: '수동 분석이 필요합니다.',
        section3: '영향도를 별도로 분석해주세요.',
        section4: '보안팀에 문의하여 대응 방안을 수립해주세요.',
        section5: '추가 분석을 통해 위협 정보를 확인해주세요.'
      },
      summary: 'AI 분석 응답을 파싱할 수 없습니다.',
      riskLevel: 'medium',
      attackType: '미상',
      recommendation: '수동 분석이 필요합니다.',
      confidence: 30,
      rawContent: content
    };
  }
}