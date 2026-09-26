import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from '@supabase/supabase-js';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const { xp, gold, level, hp, max_hp, attribute_points,
            base_stats, pos, inventory, gems, kills } = req.body;

    const { error } = await supabase.from('players').upsert({
      uid, xp, gold, level, hp, max_hp, attribute_points,
      base_stats, pos, inventory, gems, kills,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'uid' });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
