// api/player/save.js
// Server-authoritative save. The client updates optimistically and POSTs its state plus
// kill events; this handler re-runs the gdd.js rules (calculateDerivedStats / resolveCombatTurn,
// bundled in api/_lib/rules.mjs), validates every kill, and writes only the canonical row.
// Response: { ok, corrections, player } -- player is the canonical row whenever corrections exist.
import { createClient } from '@supabase/supabase-js';
import { validateSave, applyPublishedBalance } from '../_lib/rules.mjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// God Editor balance: same overrides the client runs with. Cached per warm instance.
const BALANCE_TTL_MS = 60_000;
let balanceLoadedAt = 0;
async function ensureBalance() {
  if (Date.now() - balanceLoadedAt < BALANCE_TTL_MS) return;
  const { data } = await supabase.from('game_config').select('data').eq('key', 'balance').maybeSingle();
  applyPublishedBalance(data?.data || null);
  balanceLoadedAt = Date.now();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // 1. Auth: the caller's JWT decides whose row is written, never the body
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  const { data: auth, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !auth?.user) return res.status(401).json({ error: 'Invalid session' });
  const uid = auth.user.id;
  const body = req.body || {};
  if (body.uid && body.uid !== uid) return res.status(403).json({ error: 'uid mismatch' });

  // 2. Last canonical state + role
  const [{ data: prior, error: loadErr }, { data: roleRow }] = await Promise.all([
    supabase.from('players').select('*').eq('uid', uid).single(),
    supabase.from('user_roles').select('role').eq('uid', uid).maybeSingle(),
    ensureBalance(),
  ]);
  if (loadErr || !prior) return res.status(404).json({ error: 'Character not found' });

  // 3. Validate (dev role keeps God-mode tools: trusted)
  const now = Date.now();
  const { row, corrections, acceptedKills } = validateSave(prior, body, Array.isArray(body.events) ? body.events : [], {
    isDev: roleRow?.role === 'dev',
    now,
    priorUpdatedAt: prior.updated_at ? Date.parse(prior.updated_at) : 0,
    clientSentAt: Number(body.sentAt) || undefined,
  });

  // 4. Write canonical row
  const gender = body.gender === 'male' || body.gender === 'female' ? { gender: body.gender } : {};
  const { error } = await supabase.from('players')
    .update({ ...row, ...gender, updated_at: new Date(now).toISOString() })
    .eq('uid', uid);
  if (error) return res.status(500).json({ error: error.message });

  if (corrections.length) console.warn('[save] corrected', uid, corrections);
  return res.json({ ok: true, acceptedKills, corrections, player: corrections.length ? { uid, ...row } : undefined });
}
