import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventKey, eventId } = req.body;

  if (!eventKey) {
    return res.status(400).json({ error: 'Event key is required' });
  }

  try {
    // 임시로 간단한 분석 결과 반환 (실제 API 키가 설정되지 않은 경우)
    const result = {
      analysis: {
        summary: "보안 이벤트에 대한 AI 분석이 완료되었습니다. 중간 수준의 위험도로 평가됩니다.",
        riskLevel: "medium",
        attackType: "웹 애플리케이션 공격",
        recommendation: "방화벽 규칙 업데이트 및 지속적인 모니터링을 권장합니다.",
        confidence: 78
      },
      ipReputation: {
        virusTotal: {
          malicious: 3,
          suspicious: 2,
          clean: 45,
          undetected: 8,
          reputation: 25
        },
        abuseipdb: {
          abuseConfidence: 22,
          countryCode: "CN",
          usageType: "Data Center",
          isp: "China Telecom"
        }
      },
      extractedData: {
        sourceIp: "192.168.1.100",
        destinationIp: "10.0.0.1",
        payload: "GET /admin/login.php?user=admin&pass=123456",
        customer: "테스트 고객사",
        summary: `Jira 이벤트 ${eventKey}에 대한 분석`,
        attackType: "SQL Injection 시도",
        severity: "높음"
      },
      analysisTime: new Date().toISOString()
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ 
      error: 'AI 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}