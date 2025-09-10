import { JiraTicket, JiraSearchResponse } from '@/types/jira';

const JIRA_BASE_URL = `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}`;

export class JiraClient {
  private baseUrl: string;
  private auth: string;

  constructor() {
    this.baseUrl = JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;
    
    if (!email || !token) {
      throw new Error('Jira credentials are not configured');
    }
    
    this.auth = Buffer.from(`${email}:${token}`).toString('base64');
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/rest/api/2${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async searchIssues(
    jql: string,
    startAt: number = 0,
    maxResults: number = 50,
    fields?: string[]
  ): Promise<JiraSearchResponse> {
    const params = new URLSearchParams({
      jql,
      startAt: startAt.toString(),
      maxResults: maxResults.toString(),
      expand: 'renderedFields',
    });

    if (fields && fields.length > 0) {
      params.append('fields', fields.join(','));
    }

    return this.makeRequest<JiraSearchResponse>(`/search?${params.toString()}`);
  }

  async getIssue(issueKey: string): Promise<JiraTicket> {
    return this.makeRequest<JiraTicket>(`/issue/${issueKey}`);
  }

  async getIssuesByProject(
    projectKey: string,
    maxResults: number = 100
  ): Promise<JiraSearchResponse> {
    const jql = `project = "${projectKey}" AND issuetype="보안이벤트" ORDER BY created DESC`;
    return this.searchIssues(jql, 0, maxResults);
  }

  async getUrgentTickets(maxResults: number = 50): Promise<JiraSearchResponse> {
    const jql = `
      project IN ("GOODRICH", "FINDA", "SAMKOO", "WCVS", "GLN", "KURLY", "ISU") 
      AND issuetype="보안이벤트" 
      AND status="미해결" 
      AND priority IN ("Highest", "High")
      ORDER BY priority DESC, created ASC
    `.trim();
    
    return this.searchIssues(jql, 0, maxResults);
  }

  async getTicketsByStatus(
    status: string,
    projectKey?: string,
    maxResults: number = 100
  ): Promise<JiraSearchResponse> {
    let jql = `issuetype="보안이벤트" AND status="${status}"`;
    
    if (projectKey) {
      jql = `project = "${projectKey}" AND ${jql}`;
    } else {
      jql = `project IN ("GOODRICH", "FINDA", "SAMKOO", "WCVS", "GLN", "KURLY", "ISU") AND ${jql}`;
    }
    
    jql += ' ORDER BY created DESC';
    
    return this.searchIssues(jql, 0, maxResults);
  }

  async getTicketsByDateRange(
    startDate: string,
    endDate: string,
    projectKey?: string,
    maxResults: number = 1000
  ): Promise<JiraSearchResponse> {
    let jql = `issuetype="보안이벤트" AND created >= "${startDate} 00:00" AND created <= "${endDate} 23:59"`;
    
    if (projectKey) {
      jql = `project = "${projectKey}" AND ${jql}`;
    } else {
      jql = `project IN ("GOODRICH", "FINDA", "SAMKOO", "WCVS", "GLN", "KURLY", "ISU") AND ${jql}`;
    }
    
    jql += ' ORDER BY created DESC';
    
    return this.searchIssues(jql, 0, maxResults);
  }

  extractCustomFieldValue(ticket: JiraTicket, fieldId: string): string | null {
    const field = ticket.customFields?.[fieldId] || (ticket as any).fields?.[fieldId];
    
    if (!field) return null;
    
    // Handle different field types
    if (typeof field === 'string') return field;
    if (field.value) return field.value;
    if (field.displayName) return field.displayName;
    if (field.name) return field.name;
    if (Array.isArray(field) && field.length > 0) {
      return field[0].value || field[0].name || field[0];
    }
    
    return null;
  }
}

export const jiraClient = new JiraClient();