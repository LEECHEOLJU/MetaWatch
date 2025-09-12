import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

// 특정 티켓 수동 업데이트 API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { jiraKey } = req.body;
  if (!jiraKey) {
    return res.status(400).json({ message: 'jiraKey is required' });
  }

  try {
    console.log(`🔄 Updating ticket: ${jiraKey}`);
    
    // Jira에서 해당 티켓 정보 조회
    const jiraTicket = await fetchSpecificTicket(jiraKey);
    if (!jiraTicket) {
      return res.status(404).json({ message: 'Ticket not found in Jira' });
    }

    // DB에서 기존 티켓 조회
    const { data: existingTicket } = await supabaseAdmin
      .from('jira_tickets')
      .select('*')
      .eq('jira_key', jiraKey)
      .single();

    if (!existingTicket) {
      return res.status(404).json({ message: 'Ticket not found in database' });
    }

    // 티켓 업데이트
    const fields = jiraTicket.fields;
    const { data: updatedTicket, error } = await supabaseAdmin
      .from('jira_tickets')
      .update({
        status: fields.status?.name || existingTicket.status,
        updated_at: fields.updated,
        assignee_name: fields.assignee?.displayName || null,
        resolved_at: fields.resolutiondate || null,
        resolution: fields.resolution?.name || null,
        last_synced_at: new Date().toISOString(),
        sync_version: (existingTicket.sync_version || 0) + 1
      })
      .eq('jira_key', jiraKey)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully updated: ${jiraKey} -> ${fields.status?.name}`);

    return res.status(200).json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket,
      jiraStatus: fields.status?.name,
      previousStatus: existingTicket.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Failed to update ticket ${jiraKey}:`, error);
    
    return res.status(500).json({
      message: 'Failed to update ticket',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// Jira에서 특정 티켓 조회
async function fetchSpecificTicket(jiraKey: string): Promise<any | null> {
  const jiraDomain = process.env.NEXT_PUBLIC_JIRA_DOMAIN!;
  const jiraEmail = process.env.JIRA_EMAIL!;
  const jiraToken = process.env.JIRA_API_TOKEN!;
  const authHeader = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  const baseUrl = `https://${jiraDomain}`;
  const ticketUrl = `${baseUrl}/rest/api/2/issue/${jiraKey}`;

  try {
    const response = await fetch(ticketUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn(`⚠️ Could not fetch ticket ${jiraKey}: ${response.status}`);
      return null;
    }

    return await response.json();

  } catch (error) {
    console.warn(`⚠️ Failed to fetch specific ticket ${jiraKey}:`, error);
    return null;
  }
}