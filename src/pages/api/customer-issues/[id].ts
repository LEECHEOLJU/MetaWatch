import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Issue ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(id, res);
      case 'PATCH':
        return await handlePatch(id, req, res);
      case 'DELETE':
        return await handleDelete(id, res);
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customer issue API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('customer_issues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Issue not found' });
    }
    console.error('Supabase query error:', error);
    return res.status(500).json({ error: 'Failed to fetch issue' });
  }

  return res.status(200).json(data);
}

async function handlePatch(id: string, req: NextApiRequest, res: NextApiResponse) {
  const updates = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // ID 필드는 업데이트하지 않음
  delete updates.id;
  delete updates.created_at;

  const { data, error } = await supabase
    .from('customer_issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Issue not found' });
    }
    console.error('Supabase update error:', error);
    return res.status(500).json({ error: 'Failed to update issue' });
  }

  return res.status(200).json(data);
}

async function handleDelete(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('customer_issues')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase delete error:', error);
    return res.status(500).json({ error: 'Failed to delete issue' });
  }

  return res.status(204).end();
}