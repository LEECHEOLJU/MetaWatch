import { NextApiRequest, NextApiResponse } from 'next';
import { JIRA_CUSTOM_FIELDS } from '@/config/jira-fields';

interface JiraTicketData {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: { name: string };
    priority: { name: string };
    created: string;
    assignee?: { displayName: string };
    [key: string]: any;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ticketKey } = req.body;

  if (!ticketKey) {
    return res.status(400).json({ message: 'Ticket key is required' });
  }

  try {
    // 1. Jira에서 티켓 데이터 가져오기
    const jiraAuth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

    const jiraResponse = await fetch(
      `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/rest/api/2/issue/${ticketKey}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${jiraAuth}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!jiraResponse.ok) {
      throw new Error(`Jira API error: ${jiraResponse.status}`);
    }

    const jiraData: JiraTicketData = await jiraResponse.json();

    // 2. 커스텀 필드에서 데이터 추출
    const extractedData = {
      // 기본 정보
      summary: jiraData.fields.summary,
      customer: jiraData.fields[JIRA_CUSTOM_FIELDS.customer.fieldId] || '',
      country: jiraData.fields[JIRA_CUSTOM_FIELDS.country.fieldId] || '',
      severity: jiraData.fields[JIRA_CUSTOM_FIELDS.severity.fieldId] || '',
      priority: jiraData.fields.priority?.name || '',

      // 네트워크 정보
      sourceIp: jiraData.fields[JIRA_CUSTOM_FIELDS.sourceIp.fieldId] || '',
      destinationIp: jiraData.fields[JIRA_CUSTOM_FIELDS.destinationIp.fieldId] || '',
      sourcePort: jiraData.fields[JIRA_CUSTOM_FIELDS.sourcePort.fieldId] || '',
      destinationPort: jiraData.fields[JIRA_CUSTOM_FIELDS.destinationPort.fieldId] || '',
      direction: jiraData.fields[JIRA_CUSTOM_FIELDS.direction.fieldId] || '',
      url: jiraData.fields[JIRA_CUSTOM_FIELDS.url.fieldId] || '',
      httpMethod: jiraData.fields[JIRA_CUSTOM_FIELDS.httpMethod.fieldId] || '',
      userAgent: jiraData.fields[JIRA_CUSTOM_FIELDS.userAgent.fieldId] || '',

      // 위협 정보
      attackType: jiraData.fields[JIRA_CUSTOM_FIELDS.attackType.fieldId] || '',
      attackCategory: jiraData.fields[JIRA_CUSTOM_FIELDS.attackCategory.fieldId] || '',
      scenarioName: jiraData.fields[JIRA_CUSTOM_FIELDS.scenarioName.fieldId] || '',
      action: jiraData.fields[JIRA_CUSTOM_FIELDS.action.fieldId] || '',
      hashValue: jiraData.fields[JIRA_CUSTOM_FIELDS.hashValue.fieldId] || '',
      payload: (() => {
        // 1차: customfield_10232 (Payload 필드) 확인
        const customPayload = jiraData.fields[JIRA_CUSTOM_FIELDS.payload.fieldId];
        if (customPayload && customPayload.trim()) {
          return customPayload;
        }

        // 2차: description에서 Payload부터 count까지 전체 추출
        const description = jiraData.fields.description || '';

        // "Payload:"부터 "count:" 전까지 모든 내용 추출
        const payloadStartMatch = description.match(/Payload:\s*(.*?)(?=\ncount:|$)/s);
        if (payloadStartMatch) {
          return payloadStartMatch[1].trim();
        }

        // 대안: URI 태그에서 HTTP 요청 라인만 추출 (fallback)
        const uriMatch = description.match(/<URI>\s*([A-Z]+\s+\/[^\s]*\s+HTTP\/1\.1)/);
        if (uriMatch) {
          return uriMatch[1];
        }

        return '';
      })(),

      // 탐지 정보
      detectionTime: jiraData.fields[JIRA_CUSTOM_FIELDS.detectionTime.fieldId] || '',
      detectionDevice: jiraData.fields[JIRA_CUSTOM_FIELDS.detectionDevice.fieldId] || '',
      detectionName: jiraData.fields[JIRA_CUSTOM_FIELDS.detectionName.fieldId] || '',
      count: jiraData.fields[JIRA_CUSTOM_FIELDS.count.fieldId] || '', // 🆕 count 필드 추가
    };

    // 🔍 Payload 데이터 디버깅 - 모든 커스텀 필드 검색
    console.log('🔍 Payload Debug:', {
      ticketKey,
      fieldId: JIRA_CUSTOM_FIELDS.payload.fieldId,
      rawValue: jiraData.fields[JIRA_CUSTOM_FIELDS.payload.fieldId],
      extractedPayload: extractedData.payload,
      hasPayload: !!extractedData.payload,
      payloadLength: extractedData.payload?.length || 0
    });

    // 🔍 AndroxGh0st 또는 PATTERN이 포함된 필드 찾기
    console.log('🔍 커스텀 필드 검색 (androx/PATTERN):');
    Object.keys(jiraData.fields)
      .filter(key => key.startsWith('customfield_'))
      .forEach(key => {
        const value = jiraData.fields[key];
        if (value && typeof value === 'string' && (value.toLowerCase().includes('androx') || value.includes('PATTERN'))) {
          console.log(`✅ ${key}: ${value}`);
        }
      });

    // 🔍 모든 필드에서 <PATTERNS> 문자열 검색
    console.log('🔍 <PATTERNS> 패턴 검색:');
    Object.keys(jiraData.fields).forEach(key => {
      const value = jiraData.fields[key];
      if (value && typeof value === 'string' && value.includes('<PATTERNS>')) {
        console.log(`🎯 필드: ${key}`);
        console.log(`🎯 내용: ${value}`);
      }
    });

    // 3. IP 평판 조회 (VirusTotal)
    let virusTotalResult = {
      malicious: 0,
      suspicious: 0,
      clean: 0,
      undetected: 0,
      reputation: 0
    };

    if (extractedData.sourceIp && process.env.VIRUSTOTAL_API_KEY) {
      try {
        const vtResponse = await fetch(
          `https://www.virustotal.com/vtapi/v2/ip-address/report?apikey=${process.env.VIRUSTOTAL_API_KEY}&ip=${extractedData.sourceIp}`,
          { method: 'GET' }
        );

        if (vtResponse.ok) {
          const vtData = await vtResponse.json();
          if (vtData.response_code === 1 && vtData.detected_urls) {
            virusTotalResult = {
              malicious: vtData.detected_urls.filter((url: any) => url.positives > 0).length,
              suspicious: vtData.detected_urls.filter((url: any) => url.positives > 0 && url.positives < 5).length,
              clean: vtData.detected_urls.filter((url: any) => url.positives === 0).length,
              undetected: vtData.detected_urls.length - vtData.detected_urls.filter((url: any) => url.positives > 0).length,
              reputation: vtData.detected_urls.reduce((acc: number, url: any) => acc + url.positives, 0)
            };
          }
        }
      } catch (error) {
        console.error('VirusTotal API error:', error);
      }
    }

    // 4. IP 평판 조회 (AbuseIPDB)
    let abuseipdbResult = {
      abuseConfidence: 0,
      totalReports: 0,
      numDistinctUsers: 0,
      countryCode: '',
      usageType: '',
      isp: ''
    };

    if (extractedData.sourceIp && process.env.ABUSEIPDB_API_KEY) {
      try {
        const abuseResponse = await fetch(
          `https://api.abuseipdb.com/api/v2/check?ipAddress=${extractedData.sourceIp}&maxAgeInDays=90&verbose`,
          {
            method: 'GET',
            headers: {
              'Key': process.env.ABUSEIPDB_API_KEY,
              'Accept': 'application/json'
            }
          }
        );

        if (abuseResponse.ok) {
          const abuseData = await abuseResponse.json();
          if (abuseData.data) {
            abuseipdbResult = {
              abuseConfidence: abuseData.data.abuseConfidencePercentage || 0,
              totalReports: abuseData.data.totalReports || 0,
              numDistinctUsers: abuseData.data.numDistinctUsers || 0,
              countryCode: abuseData.data.countryCode || '',
              usageType: abuseData.data.usageType || '',
              isp: abuseData.data.isp || ''
            };
          }
        }
      } catch (error) {
        console.error('AbuseIPDB API error:', error);
      }
    }

    // 5. AI 분석 (Azure OpenAI)
    let aiAnalysis: {
      summary: string;
      riskLevel: 'critical' | 'high' | 'medium' | 'low';
      attackType: string;
      recommendation: string;
      confidence: number;
      rawContent: string;
      detailedAnalysis: {
        threatLevel: string;
        section1: string;
        section2: string;
        section3: string;
        section4: string;
        section5: string;
      };
      threatScores?: {
        virusTotalScore: number;
        abuseipdbScore: number;
        frequencyScore: number;
        aiAnalysisScore: number;
        detectionSeverityScore: number;
        payloadRiskScore: number;
        totalScore: number;
        calculatedRiskLevel: 'critical' | 'high' | 'medium' | 'low';
        hasPayload: boolean;
        breakdown: {
          virusTotal: string;
          abuseipdb: string;
          frequency: string;
          aiAnalysis: string;
          detectionSeverity: string;
          payloadRisk: string;
        };
      };
      referenceInfo?: {
        cveIds: string[];
        mitreAttack: string[];
        threatSignatures: string[];
      };
    } = {
      summary: '기본 보안 이벤트 분석이 완료되었습니다.',
      riskLevel: 'medium',
      attackType: extractedData.attackType || '알 수 없음',
      recommendation: '추가 조사 및 모니터링이 필요합니다.',
      confidence: 70,
      rawContent: '',
      detailedAnalysis: {
        threatLevel: '보통 위험',
        section1: '탐지된 보안 이벤트에 대한 기본 분석이 수행되었습니다.',
        section2: '네트워크 트래픽 및 페이로드 분석 결과를 검토해야 합니다.',
        section3: '현재 위험도는 보통 수준으로 평가됩니다.',
        section4: '지속적인 모니터링과 추가 조사를 권장합니다.',
        section5: '필요시 차단 조치를 고려해야 합니다.'
      }
    };

    if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
      try {
        const analysisPrompt = `
🛡️ MetaSOC 보안 이벤트 전문 분석 요청

📋 기본 정보
- 고객사: ${extractedData.customer}
- 공격 유형: ${extractedData.attackType}
- 공격 분류: ${extractedData.attackCategory}
- 시나리오명: ${extractedData.scenarioName}
- 심각도: ${extractedData.severity}
- 출발지 IP: ${extractedData.sourceIp}
- 목적지 IP: ${extractedData.destinationIp}
- 탐지 시간: ${extractedData.detectionTime}
- 탐지 장비: ${extractedData.detectionDevice}
- 발생 횟수: ${extractedData.count || '1'}건

💾 페이로드 분석 대상
\`\`\`
${extractedData.payload || '페이로드 정보 없음'}
\`\`\`

📋 분석 요구사항
다음 5단계로 한국어로 상세 분석하여 반드시 JSON 형식으로 응답해주세요(
- 공격 구문이 명확하지 않으면 공격이라고 특정 짓기보단 가능성이 있다 정도의 뉘앙스로 분석
- 존댓말로 답변 통일
- 각 항목중 답변 내용에 구문이 필요하면 구분하여 가독성 있도록 작성):

🛡️ 탐지 이벤트 분석 요약 (summary)
- 고객사, IP, payload등 주요정보를 연관 분석하여 한문장으로 핵심만 담아 공격 요약
- 단 고객사 명, IP정보들은 언급하지 않고, 실제 어떠한 그문으로 어디에 어떤 공격을 시도해서 탐지되서 어떤 위협이 있을 것 이다라는 뉘양스로 한줄 분석

🔍 상세 분석 (detailedAnalysis) - 최대 1000자 이내 핵심만 포함
- 페이로드 내용을 해석하여 공격자의 의도 및 공격 경로 분석
- 추가 정보와 연계하여 공격의도를 상관 분석
- 해당 공격이 실제 환경에 미칠 수 있는 영향을 간단하게 서술

⚠️ 영향 받는 제품 및 조건 (affectedProducts)
- 취약한 제품/버전 명시
- 관련된 취약점(CVE 번호) 정보가 있다면 포함
- 공격 성공 조건 및 전제 사항

🕵️ 대응 방안 (recommendations) - 최대 800자 이내 핵심만 포함
- 고객사에서 해당 공격으로 대비해야하는 조치 사항
- 구체적이고 실행 가능한 권고사항

🚨 추가 탐지 내역 / 평판 조회 (additionalFindings) - 최대 800자 이내 핵심만 포함
- MITRE ATT&CK 및 공격 그룹, 공격 캠페인 연관성 분석
- 추가 모니터링 권장사항
- 관련 IOC 정보

📋 반드시 참고 정보 추출 - 필수 항목 (referenceInfo)
CVE 취약점 번호: 공격 패턴 관련 CVE 필수 제공 (최소 1개, 없으면 가능성 있는 CVE라도 제시)
MITRE ATT&CK 기법: 공격 유형별 MITRE 기법 필수 매핑 (T1234 - 기법명 형식으로 최소 1개)
위협 구문/패턴: 페이로드에서 실제 발견된 위험 구문 필수 추출 (최소 1개, 없으면 의심스러운 패턴이라도 제시)

🔢 페이로드 위험도 평가 요청
제공된 페이로드를 분석하여 위험도 점수를 평가해주세요:

 페이로드 위험도 Score  (0-10점 만점)
- SQL Injection, XSS, 명령어 삽입, 악성 스크립트 등 위험 패턴 분석
- 0점: 정상 요청, 3점: 의심 패턴, 7점: 위험 패턴, 10점: 고위험 패턴
- 점수 산정 근거도 함께 제공해주세요

🎯 반드시 다음 JSON 형식으로만 응답하세요:
{
  "summary": "탐지 이벤트 한문장 요약",
  "detailedAnalysis": "상세 분석 내용 (최대 800자)",
  "affectedProducts": "영향 받는 제품 및 조건",
  "recommendations": "대응 방안 (최대 500자)",
  "additionalFindings": "추가 탐지 내역 (최대 500자)",
  "riskLevel": "critical|high|medium|low",
  "confidence": "[1-100 사이 숫자]",
  "payloadRiskScore": "[0-10 사이 숫자, 페이로드 없으면 0]",
  "payloadRiskReasoning": "[페이로드 분석 근거, 페이로드 없으면 '페이로드 정보 없음']",
  "referenceInfo": {
    "cveIds": ["관련 CVE 번호들 배열, 최대 3개"],
    "mitreAttack": ["MITRE ATT&CK 기법 배열, 최대 3개, 'T1234 - 기법명' 형식"],
    "threatSignatures": ["주요 위협 구문/패턴 배열, 최대 3개, payload구문 안에서 추출한 값만 포함(없으면 위협 구문 없음 표시)"]
  }
}

중요: JSON 외의 다른 텍스트는 절대 포함하지 마세요.

`;

        const openaiResponse = await fetch(
          `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': process.env.AZURE_OPENAI_API_KEY,
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: '당신은 보안 전문가입니다. MSSP 관제센터 스타일로 전문적인 분석을 제공해주세요.' },
                { role: 'user', content: analysisPrompt }
              ],
              max_tokens: 4000,
              temperature: 0.2
            })
          }
        );

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const analysisText = openaiData.choices[0]?.message?.content || '';

          // 🆕 원본 AI 응답 저장
          aiAnalysis.rawContent = analysisText;

          try {
            // JSON 파싱 시도
            const jsonResponse = JSON.parse(analysisText);

            // 🔍 디버그 로깅 추가
            console.log('=== AI 응답 디버깅 ===');
            console.log('원본 응답 길이:', analysisText.length);
            console.log('JSON 파싱 성공:', !!jsonResponse);
            console.log('referenceInfo 존재:', !!jsonResponse.referenceInfo);
            if (jsonResponse.referenceInfo) {
              console.log('referenceInfo 내용:', JSON.stringify(jsonResponse.referenceInfo, null, 2));
            }
            console.log('=====================');

            // JSON 구조 검증 및 적용
            if (jsonResponse && typeof jsonResponse === 'object') {
              aiAnalysis.detailedAnalysis = {
                threatLevel: extractedData.severity || jsonResponse.riskLevel || '보통 위험',
                section1: jsonResponse.summary || '분석 중 오류가 발생했습니다.',
                section2: jsonResponse.detailedAnalysis || '상세 분석 정보를 확인할 수 없습니다.',
                section3: jsonResponse.affectedProducts || '위험도 평가를 진행할 수 없습니다.',
                section4: jsonResponse.recommendations || '대응 권고사항을 준비 중입니다.',
                section5: jsonResponse.additionalFindings || '추가 조치가 필요한지 검토 중입니다.'
              };

              // 위험도 및 신뢰도 업데이트
              if (jsonResponse.riskLevel) {
                aiAnalysis.riskLevel = jsonResponse.riskLevel as 'critical' | 'high' | 'medium' | 'low';
              }
              if (jsonResponse.confidence && typeof jsonResponse.confidence === 'number') {
                aiAnalysis.confidence = jsonResponse.confidence;
              }

              // 요약 및 권고사항 업데이트
              if (jsonResponse.summary) {
                aiAnalysis.summary = jsonResponse.summary;
              }
              if (jsonResponse.recommendations) {
                aiAnalysis.recommendation = jsonResponse.recommendations;
              }

              // 🆕 참고 정보 추가 (AI가 실제 데이터를 제공한 경우만)
              if (jsonResponse.referenceInfo) {
                aiAnalysis.referenceInfo = {
                  cveIds: jsonResponse.referenceInfo.cveIds || [],
                  mitreAttack: jsonResponse.referenceInfo.mitreAttack || [],
                  threatSignatures: jsonResponse.referenceInfo.threatSignatures || []
                };
                console.log('✅ AI에서 referenceInfo를 제공함:', aiAnalysis.referenceInfo);
              } else {
                // AI가 참고 정보를 제공하지 않은 경우 undefined로 유지 (UI에서 "정보 없음" 표시)
                console.log('⚠️ AI에서 referenceInfo를 반환하지 않음. UI에서 "정보 없음" 표시됨');
                aiAnalysis.referenceInfo = undefined;
              }

              // 🆕 위협 점수 계산 시스템 (총 100점)
              // 페이로드 존재 여부 확인
              const hasPayload = extractedData.payload && extractedData.payload.trim() !== '' && extractedData.payload !== '페이로드 정보 없음';

              let threatScores;

              if (hasPayload) {
                // 📦 페이로드 있는 경우: 기본 가중치 (100점)
                threatScores = {
                  // 1. VirusTotal Score (20점)
                  virusTotalScore: Math.min(20, virusTotalResult.malicious * 2 + virusTotalResult.suspicious * 1),

                  // 2. AbuseIPDB Score (20점)
                  abuseipdbScore: Math.min(20, Math.floor(abuseipdbResult.abuseConfidence / 5) + Math.floor(abuseipdbResult.totalReports / 100)),

                  // 3. 빈도 분석 Score (20점)
                  frequencyScore: Math.min(20, Math.floor((parseInt(extractedData.count || '1') - 1) / 2) * 5),

                  // 4. AI 종합 분석 Score (15점)
                  aiAnalysisScore: (() => {
                    const riskLevelPoints = {
                      'critical': 15,
                      'high': 12,
                      'medium': 8,
                      'low': 3
                    };
                    return riskLevelPoints[jsonResponse.riskLevel] || 8;
                  })(),

                  // 5. 탐지 심각도 Score (15점)
                  detectionSeverityScore: (() => {
                    const severity = extractedData.severity?.toLowerCase() || 'medium';
                    const severityPoints = {
                      'critical': 15,
                      'high': 12,
                      'medium': 8,
                      'low': 5,
                      'info': 2
                    };
                    return severityPoints[severity] || 8;
                  })(),

                  // 6. 페이로드 위험도 Score (10점) - AI 분석 결과
                  payloadRiskScore: jsonResponse.payloadRiskScore || 0,
                  payloadRiskReasoning: jsonResponse.payloadRiskReasoning || '페이로드 분석 결과 없음'
                };
              } else {
                // 📭 페이로드 없는 경우: 가중치 재조정 (IPS 장비 등)
                // VirusTotal(22.5점), AbuseIPDB(22.5점), 빈도분석(25점), AI종합분석(15점), 탐지심각도(15점)
                threatScores = {
                  // 1. VirusTotal Score (22.5점 → 23점)
                  virusTotalScore: Math.min(23, Math.floor(virusTotalResult.malicious * 2.3 + virusTotalResult.suspicious * 1.15)),

                  // 2. AbuseIPDB Score (22.5점 → 22점)
                  abuseipdbScore: Math.min(22, Math.floor((abuseipdbResult.abuseConfidence / 5) * 1.1 + (abuseipdbResult.totalReports / 100) * 1.1)),

                  // 3. 빈도 분석 Score (25점)
                  frequencyScore: Math.min(25, Math.floor((parseInt(extractedData.count || '1') - 1) / 2) * 6.25),

                  // 4. AI 종합 분석 Score (15점)
                  aiAnalysisScore: (() => {
                    const riskLevelPoints = {
                      'critical': 15,
                      'high': 12,
                      'medium': 8,
                      'low': 3
                    };
                    return riskLevelPoints[jsonResponse.riskLevel] || 8;
                  })(),

                  // 5. 탐지 심각도 Score (15점)
                  detectionSeverityScore: (() => {
                    const severity = extractedData.severity?.toLowerCase() || 'medium';
                    const severityPoints = {
                      'critical': 15,
                      'high': 12,
                      'medium': 8,
                      'low': 5,
                      'info': 2
                    };
                    return severityPoints[severity] || 8;
                  })(),

                  // 6. 페이로드 위험도 Score (0점 - 페이로드 없음)
                  payloadRiskScore: 0,
                  payloadRiskReasoning: 'IPS 장비 등으로 페이로드 정보 없음 (다른 지표로 평가)'
                };
              }

              // 총점 계산 (숫자 필드만)
              const scoreFields = [
                'virusTotalScore',
                'abuseipdbScore',
                'frequencyScore',
                'aiAnalysisScore',
                'detectionSeverityScore',
                'payloadRiskScore'
              ];

              const totalScore = scoreFields.reduce((sum, field) => {
                const value = threatScores[field as keyof typeof threatScores];
                return sum + (typeof value === 'number' ? value : 0);
              }, 0);

              // 위험도 레벨 재계산 (총점 기반)
              let calculatedRiskLevel: 'critical' | 'high' | 'medium' | 'low';
              if (totalScore >= 80) calculatedRiskLevel = 'critical';
              else if (totalScore >= 60) calculatedRiskLevel = 'high';
              else if (totalScore >= 30) calculatedRiskLevel = 'medium';
              else calculatedRiskLevel = 'low';

              // aiAnalysis에 점수 정보 추가
              aiAnalysis.threatScores = {
                ...threatScores,
                totalScore,
                calculatedRiskLevel,
                hasPayload,
                referenceInfo: aiAnalysis.referenceInfo,
                breakdown: hasPayload ? {
                  // 📦 페이로드 있는 경우
                  virusTotal: `${threatScores.virusTotalScore}/20 - 악성 탐지: ${virusTotalResult.malicious}개`,
                  abuseipdb: `${threatScores.abuseipdbScore}/20 - 신뢰도: ${abuseipdbResult.abuseConfidence}%, 신고: ${abuseipdbResult.totalReports}건`,
                  frequency: `${threatScores.frequencyScore}/20 - 발생 횟수: ${extractedData.count || '1'}건`,
                  aiAnalysis: `${threatScores.aiAnalysisScore}/15 - AI 위험도: ${jsonResponse.riskLevel}`,
                  detectionSeverity: `${threatScores.detectionSeverityScore}/15 - 탐지 심각도: ${extractedData.severity}`,
                  payloadRisk: `${threatScores.payloadRiskScore}/10 - ${threatScores.payloadRiskReasoning}`
                } : {
                  // 📭 페이로드 없는 경우 (IPS 장비 등)
                  virusTotal: `${threatScores.virusTotalScore}/23 - 악성 탐지: ${virusTotalResult.malicious}개 (가중치 적용)`,
                  abuseipdb: `${threatScores.abuseipdbScore}/22 - 신뢰도: ${abuseipdbResult.abuseConfidence}%, 신고: ${abuseipdbResult.totalReports}건 (가중치 적용)`,
                  frequency: `${threatScores.frequencyScore}/25 - 발생 횟수: ${extractedData.count || '1'}건 (가중치 적용)`,
                  aiAnalysis: `${threatScores.aiAnalysisScore}/15 - AI 위험도: ${jsonResponse.riskLevel}`,
                  detectionSeverity: `${threatScores.detectionSeverityScore}/15 - 탐지 심각도: ${extractedData.severity}`,
                  payloadRisk: `${threatScores.payloadRiskScore}/0 - ${threatScores.payloadRiskReasoning}`
                }
              };

              console.log('✅ 위협 점수 계산 완료:', {
                totalScore,
                calculatedRiskLevel,
                scores: threatScores
              });

            } else {
              throw new Error('Invalid JSON structure');
            }

          } catch (parseError) {
            console.error('❌ JSON 파싱 실패, 기본값 사용:', parseError);
            console.log('🔍 원본 응답 (첫 500자):', analysisText.substring(0, 500));

            // JSON 파싱 실패시 기본값 유지
            // 기존 aiAnalysis.detailedAnalysis 그대로 사용
          }

          // 🆕 디버그 정보 저장
          globalThis.currentDebugInfo = {
            originalResponse: analysisText,
            parseMethod: 'JSON',
            parseSuccess: analysisText.includes('{') && analysisText.includes('}')
          };
        }
      } catch (error) {
        console.error('Azure OpenAI API error:', error);
      }
    }

    // 6. 최종 응답 (디버그 정보 포함)
    const result: any = {
      analysis: aiAnalysis,
      ipReputation: {
        virusTotal: virusTotalResult,
        abuseipdb: abuseipdbResult
      },
      extractedData,
      analysisTime: new Date().toISOString()
    };

    // 🐛 디버그 정보 추가
    if (globalThis.currentDebugInfo) {
      result.debugInfo = globalThis.currentDebugInfo;
      globalThis.currentDebugInfo = null; // 정리
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      message: 'Analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}