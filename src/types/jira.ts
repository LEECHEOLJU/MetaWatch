export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: {
    name: string;
    statusCategory: {
      key: string;
    };
  };
  priority: {
    name: string;
    iconUrl: string;
  };
  assignee?: {
    displayName: string;
    emailAddress: string;
  };
  reporter: {
    displayName: string;
    emailAddress: string;
  };
  created: string;
  updated: string;
  resolutiondate?: string;
  project: {
    key: string;
    name: string;
  };
  issuetype: {
    name: string;
    iconUrl: string;
  };
  customFields: {
    [key: string]: any;
  };
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraTicket[];
}

export interface CustomerStatusCount {
  customer: string;
  customerName: string;
  unresolved: number;
  requiresApproval: number;
  falsePositive: number;
  unapprovedBlocking: number;
  pendingApproval: number;
  preBlocked: number;
  approvedBlocking: number;
  agreedBlocking: number;
  total: number;
}

export interface TicketStatistics {
  daily: {
    date: string;
    count: number;
    byStatus: Record<string, number>;
    byCustomer: Record<string, number>;
  }[];
  weekly: {
    week: string;
    count: number;
    byStatus: Record<string, number>;
    byCustomer: Record<string, number>;
  }[];
  monthly: {
    month: string;
    count: number;
    byStatus: Record<string, number>;
    byCustomer: Record<string, number>;
  }[];
}

export interface UrgentTicketSummary {
  id: string;
  key: string;
  summary: string;
  priority: string;
  customer: string;
  created: string;
  assignee?: string;
  age: number; // hours
}

export interface CustomerIssue {
  id: string;
  customer: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}