import { NextApiRequest, NextApiResponse } from 'next';

// 데모용 통계 데이터 생성기
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { customerId, equipment = 'all', cached = 'false' } = req.query;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    console.log(`📊 Demo stats for ${customerId} (${equipment}) - cached: ${cached}`);

    // 캐시된 데이터 시뮬레이션
    const isCached = cached === 'true';
    const delay = isCached ? 50 : 2000; // 캐시: 50ms, 실시간: 2초

    // 응답 시간 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, delay));

    // 고객사별 샘플 데이터
    const customerData: Record<string, any> = {
      goodrich: {
        totalEvents: 127,
        severityStats: [
          { name: 'High', value: 23, color: '#EF4444' },
          { name: 'Medium', value: 89, color: '#F59E0B' },
          { name: 'Low', value: 15, color: '#10B981' }
        ],
        topSignatures: [
          { name: '악성 파일 업로드 탐지', value: 45 },
          { name: 'SQL 인젝션', value: 32 },
          { name: '디렉토리 접근 탐지', value: 28 },
          { name: 'AndroxGh0st.Malware', value: 22 }
        ],
        topAttackIPs: [
          { name: '58.236.66.157', value: 12 },
          { name: '211.235.97.85', value: 8 },
          { name: '82.23.239.23', value: 6 },
          { name: '45.38.86.234', value: 5 }
        ],
        topCountries: [
          { name: 'South Korea', value: 89 },
          { name: 'United States', value: 23 },
          { name: 'United Kingdom', value: 8 },
          { name: 'Unknown', value: 7 }
        ]
      },
      finda: {
        totalEvents: 89,
        severityStats: [
          { name: 'Critical', value: 5, color: '#DC2626' },
          { name: 'High', value: 31, color: '#EF4444' },
          { name: 'Medium', value: 53, color: '#F59E0B' }
        ],
        topSignatures: [
          { name: 'DDoS Attack Detection', value: 28 },
          { name: 'Brute Force Login', value: 19 },
          { name: 'XSS Attempt', value: 17 },
          { name: 'CSRF Attack', value: 13 }
        ],
        topAttackIPs: [
          { name: '185.220.101.182', value: 15 },
          { name: '104.248.48.1', value: 11 },
          { name: '167.94.138.40', value: 8 }
        ],
        topCountries: [
          { name: 'Russia', value: 34 },
          { name: 'China', value: 28 },
          { name: 'South Korea', value: 27 }
        ]
      }
    };

    const data = customerData[customerId as string] || {
      totalEvents: Math.floor(Math.random() * 200) + 50,
      severityStats: [
        { name: 'High', value: Math.floor(Math.random() * 30) + 10, color: '#EF4444' },
        { name: 'Medium', value: Math.floor(Math.random() * 50) + 20, color: '#F59E0B' },
        { name: 'Low', value: Math.floor(Math.random() * 20) + 5, color: '#10B981' }
      ],
      topSignatures: [
        { name: 'Sample Attack 1', value: Math.floor(Math.random() * 20) + 5 },
        { name: 'Sample Attack 2', value: Math.floor(Math.random() * 15) + 3 }
      ],
      topAttackIPs: [
        { name: '192.168.1.100', value: Math.floor(Math.random() * 10) + 2 }
      ],
      topCountries: [
        { name: 'Unknown', value: Math.floor(Math.random() * 30) + 10 }
      ]
    };

    // 시간별 트렌드 생성
    const hourlyTrend = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      events: Math.floor(Math.random() * 15) + 1
    }));

    // 장비별 필터링 시뮬레이션
    let adjustedData = { ...data };
    if (equipment === 'ips') {
      adjustedData.totalEvents = Math.floor(data.totalEvents * 0.6);
    } else if (equipment === 'waf') {
      adjustedData.totalEvents = Math.floor(data.totalEvents * 0.4);
    }

    const response = {
      customer: customerId.toUpperCase(),
      equipment,
      ...adjustedData,
      hourlyTrend,
      lastUpdated: new Date().toISOString(),
      cached: isCached,
      responseTime: `${delay}ms`
    };

    console.log(`✅ Demo stats response: ${adjustedData.totalEvents} events, cached: ${isCached}`);

    res.status(200).json(response);
  } catch (error) {
    console.error('Demo stats API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch demo stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}