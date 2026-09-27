/**
 * src/game/persist/api.ts
 *
 * All async player I/O — load from Firestore + Supabase, save to Supabase.
 * This is the ONLY file that talks to the network. Rules and components
 * never fetch anything directly.
 *
 * Security model:
 *   - Firebase Auth issues an ID token to the client
 *   - We send that token in the Authorization header on every request
 *   - The Vercel API route verifies it server-side with Firebase Admin SDK
 *   - The Supabase service-role key never leaves the server
 *   - We never trust uid from the JSON body — the server extracts it from the token
 */

import { auth, db } from '../../firebase/index'
import { doc, getDoc } from 'firebase/firestore'
import type { Player } from '../types'
import { calcDerived } from '../rules/derived'
import { getXpToNextLevel } from '../rules/xp'
import { RACES } from '../data/races'

// ── getItemCV lookup for calcDerived ─────────────────────────────────────────
// Minimal inline implementation so persist/api.ts doesn't import items.ts yet.
// When items.ts exists, swap this out.
const DROPPER_CVS: Record<number, number> = {
  1: 13.00, 2: 15.86, 3: 19.35, 4: 23.61, 5: 28.80,
  6: 35.14, 7: 42.87, 8: 52.30, 9: 63.81, 10: 77.85,
}

function makeGetItemCV(inventory: Player['inventory']) {
  return (instanceId: string) => {
    const item = inventory.find(i => i.instanceId === instanceId)
    if (!item) return null
    return {
      cv: DROPPER_CVS[item.tier] ?? 13.00,
      subType: item.baseItemId.split('_')[2] ?? 'Sword', // rough subType from id
    }
  }
}

// ── loadPlayer ───────────────────────────────────────────────────────────────
/**
 * Load a player from Firestore (identity) + Supabase (live stats).
 * Returns a fully hydrated Player with derivedStats calculated.
 * Throws if Firestore read fails (permission denied, not found, etc.)
 */
export async function loadPlayer(uid: string): Promise<Player> {
  // 1. Firestore — identity data written once at signup
  const snap = await getDoc(doc(db, 'players', uid))
  if (!snap.exists()) {
    throw new Error('Character not found. Sign out and create your character.')
  }
  const identity = snap.data() as {
    name: string
    loginName?: string
    race: string
    raceName: string
    archetype: string
    cci: string
    baseStats?: Player['baseStats']
    equipment?: Player['equipment']
    bank?: number
  }

  // 2. Build base player from Firestore identity
  const raceData = RACES[identity.race] || RACES.human
  const p: Omit<Player, 'derivedStats'> & { derivedStats?: Player['derivedStats'] } = {
    uid,
    name:           identity.name || 'Pilot',
    race:           identity.race || 'human',
    raceName:       identity.raceName || raceData.raceName,
    archetype:      identity.archetype || raceData.archetype,
    cci:            identity.cci || raceData.primaryStat,
    level:          1,
    xp:             0,
    xpToNextLevel:  getXpToNextLevel(1),
    attributePoints: 0,
    gold:           0,
    bank:           identity.bank ?? 0,
    hp:             0, // will be set after calcDerived
    baseStats:      identity.baseStats || raceData.baseStats,
    inventory:      [],
    equipment:      identity.equipment || {},
    gems:           [],
    pos:            { x: 7, y: 7 },
    kills:          0,
  }

  // 3. Supabase — live stats (xp, gold, level, hp, inventory, gems, kills)
  try {
    const token = await auth.currentUser?.getIdToken()
    if (token) {
      const res = await fetch(`/api/player?uid=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const supa = await res.json()
        if (supa && !supa.error) {
          p.xp             = supa.xp             ?? 0
          p.gold           = supa.gold            ?? 0
          p.level          = supa.level           ?? 1
          p.hp             = supa.hp              ?? 0
          p.attributePoints = supa.attribute_points ?? 0
          p.kills          = supa.kills           ?? 0
          if (supa.base_stats  && Object.keys(supa.base_stats).length  > 0) p.baseStats  = supa.base_stats
          if (Array.isArray(supa.inventory) && supa.inventory.length   > 0) p.inventory  = supa.inventory
          if (Array.isArray(supa.gems)      && supa.gems.length        > 0) p.gems       = supa.gems
          if (supa.pos) p.pos = supa.pos
        }
      }
    }
  } catch (e) {
    // Supabase load failed — continue with Firestore defaults
    console.warn('[loadPlayer] Supabase load skipped:', e)
  }

  // 4. Recalculate xpToNextLevel after level is known
  p.xpToNextLevel = getXpToNextLevel(p.level)

  // 5. calcDerived — pure function, returns fresh DerivedStats
  const derived = calcDerived(p as Player, makeGetItemCV(p.inventory))
  const player: Player = { ...(p as Player), derivedStats: derived }

  // 6. Clamp HP
  if (!player.hp || player.hp > derived.maxHp) player.hp = derived.maxHp

  return player
}

// ── savePlayer ───────────────────────────────────────────────────────────────
/**
 * Save live player stats to Supabase via the Vercel API route.
 * The route verifies the Firebase ID token — we never send uid in the body.
 * Silently swallows errors (save is best-effort, not load-blocking).
 *
 * @param player - current player state
 * @param reason - debug label e.g. 'level-up', 'logout', 'kill-checkpoint'
 */
export async function savePlayer(player: Player, reason = ''): Promise<void> {
  if (!player?.uid) return
  try {
    const token = await auth.currentUser?.getIdToken()
    if (!token) {
      console.warn('[savePlayer] No auth token — skipping save')
      return
    }
    const res = await fetch('/api/player/save', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        // uid is NOT here — server extracts it from the verified token
        xp:               player.xp             ?? 0,
        gold:             player.gold            ?? 0,
        level:            player.level           ?? 1,
        hp:               player.hp              ?? 100,
        max_hp:           player.derivedStats?.maxHp ?? 100,
        attribute_points: player.attributePoints  ?? 0,
        base_stats:       player.baseStats        ?? {},
        pos:              player.pos              ?? { x: 7, y: 7 },
        inventory:        player.inventory        ?? [],
        gems:             player.gems             ?? [],
        kills:            player.kills            ?? 0,
      }),
    })
    if (!res.ok) {
      console.warn(`[savePlayer] ${reason} — HTTP ${res.status}`)
    } else if (reason) {
      console.log(`[savePlayer] ${reason} ✓`)
    }
  } catch (e) {
    console.error('[savePlayer] failed:', e)
  }
}
