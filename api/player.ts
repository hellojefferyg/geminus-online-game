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
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data ?? {
      uid, xp: 0, gold: 0, level: 1, hp: 100, max_hp: 100,
      attribute_points: 0, base_stats: {}, pos: {}, inventory: [], gems: [], kills: 0
    });
  } catch (e: any) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
