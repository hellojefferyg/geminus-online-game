/**
 * src/lib/saveQueue.ts
 * Sequential save queue — guarantees Supabase writes land in exact order.
 * No matter how fast a player taps, Turn 1 always saves before Turn 2.
 */

import { supabase } from '../supabase'
import { savePayload } from '../gdd.js'

// ─── Queue ────────────────────────────────────────────────────────
let saveChain = Promise.resolve()

function enqueue(task: () => Promise<void>) {
  saveChain = saveChain.then(task).catch(err => {
    console.error('[SaveQueue] write failed:', err)
  })
  return saveChain
}

// ─── Main save function ───────────────────────────────────────────
/**
 * Instantly saves player to Supabase in sequential order.
 * Deep-snapshots the player object so future mutations can't corrupt in-flight writes.
 */
export function savePlayerNow(player: any, reason = '') {
  if (!player?.uid) return

  // Deep snapshot — freeze the state at this exact moment
  const snapshot = JSON.parse(JSON.stringify(savePayload(player)))

  // Instant local backup for crash recovery
  try {
    localStorage.setItem('geminus_player_backup', JSON.stringify(snapshot))
  } catch {}

  if (reason) console.log('[save]', reason)

  enqueue(async () => {
    const { error } = await supabase
      .from('players')
      .update({
        xp:               snapshot.xp,
        gold:             snapshot.gold,
        bank:             snapshot.bank,
        gem_dust:         snapshot.gem_dust,
        essence:          snapshot.essence,
        level:            snapshot.level,
        hp:               snapshot.hp,
        max_hp:           snapshot.max_hp,
        attribute_points: snapshot.attribute_points,
        base_stats:       snapshot.base_stats,
        pos:              snapshot.pos,
        inventory:        snapshot.inventory,
        equipment:        snapshot.equipment,
        gems:             snapshot.gems,
        kills:            snapshot.kills,
        gender:           snapshot.gender,
      })
      .eq('uid', snapshot.uid)

    if (error) {
      console.error('[SaveQueue] Supabase error:', reason, error.message)
    }
  })
}
