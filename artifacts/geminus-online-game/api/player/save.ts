import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uid, xp, gold, level, hp, max_hp, attribute_points,
          base_stats, pos, inventory, gems, kills } = req.body;

  if (!uid) return res.status(400).json({ error: 'No uid' });

  const { error } = await supabase.from('players').upsert({
    uid, xp, gold, level, hp, max_hp, attribute_points,
    base_stats, pos, inventory, gems, kills,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'uid' });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}
