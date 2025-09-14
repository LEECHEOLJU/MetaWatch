// GOODRICH-193254 티켓의 모든 커스텀 필드 확인
const ticketKey = 'GOODRICH-193254';
const jiraAuth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

fetch(`https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/rest/api/2/issue/${ticketKey}`, {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${jiraAuth}`,
    'Accept': 'application/json',
  },
})
.then(response => response.json())
.then(data => {
  console.log('🔍 모든 커스텀 필드:');
  Object.keys(data.fields)
    .filter(key => key.startsWith('customfield_'))
    .forEach(key => {
      const value = data.fields[key];
      if (value && typeof value === 'string' && value.toLowerCase().includes('androx')) {
        console.log(`✅ ${key}: ${value}`);
      } else if (value && typeof value === 'string' && value.includes('PATTERN')) {
        console.log(`✅ ${key}: ${value}`);
      }
    });
});