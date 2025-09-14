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
    let aiAnalysis = {
      summary: '기본 보안 이벤트 분석이 완료되었습니다.',
      riskLevel: 'medium' as 'critical' | 'high' | 'medium' | 'low',
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

## 📋 기본 정보
- **고객사**: ${extractedData.customer}
- **공격 유형**: ${extractedData.attackType}
- **공격 분류**: ${extractedData.attackCategory}
- **시나리오명**: ${extractedData.scenarioName}
- **심각도**: ${extractedData.severity}
- **출발지 IP**: ${extractedData.sourceIp}
- **목적지 IP**: ${extractedData.destinationIp}
- **탐지 시간**: ${extractedData.detectionTime}
- **탐지 장비**: ${extractedData.detectionDevice}
- **발생 횟수**: ${extractedData.count || '1'}건

## 💾 페이로드 분석 대상
\`\`\`
${extractedData.payload || '페이로드 정보 없음'}
\`\`\`

## 📋 분석 요구사항
다음 5단계로 **한국어로** 상세 분석하되, 각 섹션을 명확히 구분하여 작성해주세요:

**1. 🛡️ 탐지 이벤트 분석 요약**
- 고객사, IP, 포트 정보를 포함한 종합적 요약
- 탐지된 공격 패턴 및 위험성 개요

**2. 🔍 상세 분석**
- 공격 벡터 및 기법 상세 분석
- 페이로드 내용 해석 및 의도 분석
- 해당 공격이 실제 환경에 미칠 수 있는 영향

**3. ⚠️ 영향 받는 제품 및 조건**
- 취약한 제품/버전 명시
- CVE 번호가 있다면 포함
- 공격 성공 조건 및 전제 사항

**4. 🕵️ 대응 방안**
- 즉시 조치 사항 (1~4개 항목)
- 구체적이고 실행 가능한 권고사항

**5. 🚨 추가 탐지 내역 / 평판 조회**
- MITRE ATT&CK 매핑
- 추가 모니터링 권장사항
- 관련 IOC 정보

## 🎯 출력 형식 요구사항
- 각 섹션을 번호와 이모지로 명확히 구분
- 문장은 완전히 끝맺음 (마침표 필수)
- 기술적 근거와 구체적 수치 포함
- 전문적이면서도 이해하기 쉬운 설명

위험도는 **critical, high, medium, low** 중 하나로 평가하여 내용에 자연스럽게 포함해주세요.
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

          // 🔍 개선된 텍스트 파싱 로직 with 디버깅
          const debugLogs: string[] = [];

          const parseAnalysisText = (text: string) => {
            debugLogs.push(`📝 시작: 원본 텍스트 길이 ${text.length}자`);

            // 1. 🔍 제목과 내용 분리하는 새로운 파싱 로직
            const sectionPattern = /(\d+\.\s*[🛡️🔍⚠️🕵️🚨][^]*?)((?=\d+\.\s*[🛡️🔍⚠️🕵️🚨])|$)/g;
            const rawSections = [];
            let match;

            while ((match = sectionPattern.exec(text)) !== null) {
              const fullSection = match[1].trim();

              // 제목과 내용 분리
              const titleMatch = fullSection.match(/^(\d+\.\s*[🛡️🔍⚠️🕵️🚨][^\n]*)\n?(.*)/s);
              if (titleMatch) {
                const content = titleMatch[2] ? titleMatch[2].trim() : '';
                if (content.length > 10) { // 최소 길이 체크
                  rawSections.push(content);
                }
              }
            }

            debugLogs.push(`🔨 1차 분할: ${rawSections.length}개 섹션`);

            // 2. 한국어 문장 완성도 개선 및 중복 제목 제거
            let sections = rawSections.map((section, index) => {
              let cleaned = section.trim();

              // 중복된 제목 패턴 제거 (예: "🛡️ 탐지 이벤트 분석 요약  \n🛡️ 탐지 이벤트 분석 요약")
              cleaned = cleaned.replace(/^([🛡️🔍⚠️🕵️🚨]️?\s*.*?)\s*\n\s*\1/gm, '$1');

              // 이모지가 깨진 형태(�️) 제거
              cleaned = cleaned.replace(/�️/g, '🛡️');

              // 불완전한 문장 처리
              if (cleaned && !cleaned.match(/[.!?\n]$/)) {
                if (cleaned.length > 30) {
                  // 마지막이 문장의 중간인 경우 완성
                  if (cleaned.match(/[가-힣\w]$/)) {
                    cleaned += '.';
                  }
                }
              }

              // 너무 짧거나 긴 섹션 처리
              if (cleaned.length < 15) {
                debugLogs.push(`⚠️ 섹션 ${index}: 너무 짧음 (${cleaned.length}자)`);
              } else if (cleaned.length > 800) {
                debugLogs.push(`⚠️ 섹션 ${index}: 너무 김 (${cleaned.length}자), 잘라냄`);
                cleaned = cleaned.substring(0, 800) + '...';
              }

              return cleaned;
            });

            // 3. 품질 검증 및 필터링
            const validSections = sections.filter(section => {
              const length = section.length;
              const hasContent = /[가-힣a-zA-Z]/.test(section);
              const isValid = length >= 15 && length <= 800 && hasContent;

              if (!isValid) {
                debugLogs.push(`❌ 제외된 섹션: "${section.substring(0, 30)}..." (길이: ${length}, 내용: ${hasContent})`);
              }

              return isValid;
            });

            debugLogs.push(`✅ 최종: ${validSections.length}개 유효 섹션`);
            debugLogs.push(`📊 섹션 길이: [${validSections.map(s => s.length).join(', ')}]`);

            return {
              sections: validSections,
              debugInfo: {
                originalTextLength: text.length,
                parsedSections: sections.length,
                validSections: validSections.length,
                sectionLengths: validSections.map(s => s.length),
                parsingLogs: [...debugLogs]
              }
            };
          };

          const parseResult = parseAnalysisText(analysisText);
          const { sections, debugInfo } = parseResult;

          if (sections.length >= 3) {
            aiAnalysis.detailedAnalysis = {
              threatLevel: extractedData.severity || '보통 위험',
              section1: sections[0] || '분석 중 오류가 발생했습니다.',
              section2: sections[1] || '상세 분석 정보를 확인할 수 없습니다.',
              section3: sections[2] || '위험도 평가를 진행할 수 없습니다.',
              section4: sections[3] || '대응 권고사항을 준비 중입니다.',
              section5: sections[4] || '추가 조치가 필요한지 검토 중입니다.'
            };
          }

          // 🆕 디버그 정보를 저장하여 나중에 result에 추가
          globalThis.currentDebugInfo = {
            originalResponse: analysisText,
            ...debugInfo
          };

          // 위험도 추출
          if (analysisText.toLowerCase().includes('critical')) aiAnalysis.riskLevel = 'critical' as const;
          else if (analysisText.toLowerCase().includes('high')) aiAnalysis.riskLevel = 'high' as const;
          else if (analysisText.toLowerCase().includes('low')) aiAnalysis.riskLevel = 'low' as const;
          else aiAnalysis.riskLevel = 'medium' as const;
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