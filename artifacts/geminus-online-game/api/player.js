import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'No uid' });
  const { data, error } = await supabase
    .from('players').select('*').eq('uid', uid).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  return res.json(data ?? { uid, xp: 0, gold: 0, level: 1, hp: 100, max_hp: 100, attribute_points: 0, base_stats: {}, pos: {}, inventory: [], gems: [], kills: 0 });
}
