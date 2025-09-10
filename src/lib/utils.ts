import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return parsedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\./g, '-').replace(/ /g, '').slice(0, -1);
}

export function formatDateTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return parsedDate.toLocaleString('ko-KR');
}

export function formatTimeAgo(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - parsedDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else {
    return `${diffInDays}일 전`;
  }
}

export function getTicketAge(createdDate: string): number {
  const created = new Date(createdDate);
  const now = new Date();
  const diffInMs = now.getTime() - created.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60)); // hours
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    '미해결': 'red',
    '정탐(승인필요 대상)': 'orange',
    '오탐 확인 완료': 'gray',
    '차단 미승인 완료': 'yellow',
    '승인 대기': 'yellow',
    '기 차단 완료': 'green',
    '승인 후 차단 완료': 'green',
    '협의된 차단 완료': 'green',
  };
  
  return statusColors[status] || 'gray';
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    'Highest': 'red',
    'High': 'orange',
    'Medium': 'yellow',
    'Low': 'green',
  };
  
  return priorityColors[priority] || 'gray';
}

export function getCustomerName(projectKey: string): string {
  const customerNames: Record<string, string> = {
    'GOODRICH': '굿리치',
    'FINDA': '핀다',
    'SAMKOO': '삼구아이앤씨',
    'WCVS': '한화위캠버스',
    'GLN': 'GLN',
    'KURLY': '컬리',
    'ISU': '이수시스템',
  };
  
  return customerNames[projectKey] || projectKey;
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}