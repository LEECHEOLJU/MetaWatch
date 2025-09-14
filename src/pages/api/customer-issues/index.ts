import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { CustomerIssue } from '@/types/customer-issues';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customer issues API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { search, customer, priority, limit = '100', offset = '0' } = req.query;

  let query = supabase
    .from('customer_issues')
    .select('*')
    .order('created_at', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  // 검색 필터
  if (search && typeof search === 'string') {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 고객사 필터
  if (customer && typeof customer === 'string') {
    query = query.eq('customer_code', customer);
  }

  // 우선순위 필터
  if (priority && typeof priority === 'string') {
    query = query.eq('priority', priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase query error:', error);
    return res.status(500).json({ error: 'Failed to fetch issues' });
  }

  return res.status(200).json(data);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const issueData = req.body;

  // 필수 필드 검증
  if (!issueData.customer_code || !issueData.title || !issueData.description) {
    return res.status(400).json({ 
      error: 'Missing required fields: customer_code, title, description' 
    });
  }

  // ID 생성 (UUID는 Supabase에서 자동 생성)
  const newIssue = {
    ...issueData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('customer_issues')
    .insert([newIssue])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Failed to create issue' });
  }

  return res.status(201).json(data);
}