import { NextApiRequest, NextApiResponse } from 'next';
import { jiraClient } from '@/lib/jira-client';
import { UrgentTicketSummary } from '@/types/jira';
import { getTicketAge, getCustomerName } from '@/lib/utils';
import { JIRA_FIELDS } from '@/lib/constants';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await jiraClient.getUrgentTickets(50);
    
    const urgentTickets: UrgentTicketSummary[] = response.issues.map((issue) => {
      const customer = jiraClient.extractCustomFieldValue(issue, JIRA_FIELDS.CUSTOMER) 
        || issue.project.key;
      
      return {
        id: issue.id,
        key: issue.key,
        summary: issue.summary,
        priority: issue.priority.name,
        customer: getCustomerName(customer),
        created: issue.created,
        assignee: issue.assignee?.displayName,
        age: getTicketAge(issue.created),
      };
    });

    // Sort by priority and age
    const priorityOrder = { 'Highest': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    urgentTickets.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) 
        - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.age - a.age; // Older tickets first
    });

    res.status(200).json({
      tickets: urgentTickets,
      total: response.total,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching urgent tickets:', error);
    res.status(500).json({ 
      message: 'Failed to fetch urgent tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}