import { NextApiRequest, NextApiResponse } from 'next';
import { jiraClient } from '@/lib/jira-client';
import { CustomerStatusCount } from '@/types/jira';
import { CUSTOMERS, TICKET_STATUSES, JIRA_FIELDS } from '@/lib/constants';
import { getDateRange } from '@/lib/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { days = '7' } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days as string));
    
    const customerStatusCounts: CustomerStatusCount[] = [];

    // 각 고객사별로 상태 집계
    for (const customer of Object.values(CUSTOMERS)) {
      const statusCounts = {
        customer: customer.key,
        customerName: customer.name,
        unresolved: 0,
        requiresApproval: 0,
        falsePositive: 0,
        unapprovedBlocking: 0,
        pendingApproval: 0,
        preBlocked: 0,
        approvedBlocking: 0,
        agreedBlocking: 0,
        total: 0,
      };

      // 각 상태별로 티켓 수 조회
      for (const [statusKey, statusName] of Object.entries(TICKET_STATUSES)) {
        try {
          const response = await jiraClient.getTicketsByDateRange(
            startDate,
            endDate,
            customer.key
          );
          
          // 상태별로 필터링
          const filteredTickets = response.issues.filter(issue => 
            issue.status.name === statusName
          );
          
          const count = filteredTickets.length;
          
          // 상태별 매핑
          switch (statusKey) {
            case 'UNRESOLVED':
              statusCounts.unresolved = count;
              break;
            case 'REQUIRES_APPROVAL':
              statusCounts.requiresApproval = count;
              break;
            case 'FALSE_POSITIVE':
              statusCounts.falsePositive = count;
              break;
            case 'UNAPPROVED_BLOCKING':
              statusCounts.unapprovedBlocking = count;
              break;
            case 'PENDING_APPROVAL':
              statusCounts.pendingApproval = count;
              break;
            case 'PRE_BLOCKED':
              statusCounts.preBlocked = count;
              break;
            case 'APPROVED_BLOCKING':
              statusCounts.approvedBlocking = count;
              break;
            case 'AGREED_BLOCKING':
              statusCounts.agreedBlocking = count;
              break;
          }
        } catch (error) {
          console.error(`Error fetching ${statusName} for ${customer.name}:`, error);
        }
      }

      // 총계 계산
      statusCounts.total = Object.values(statusCounts)
        .filter(val => typeof val === 'number')
        .reduce((sum, val) => sum + val, 0) - statusCounts.total; // 중복 제거

      customerStatusCounts.push(statusCounts);
    }

    res.status(200).json({
      data: customerStatusCounts,
      dateRange: { startDate, endDate },
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching customer status:', error);
    res.status(500).json({ 
      message: 'Failed to fetch customer status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}