/**
 * src/lib/saveQueue.ts
 * Sequential save queue — guarantees writes land in exact order.
 * No matter how fast a player taps, Turn 1 always saves before Turn 2.
 *
 * Saves go through api/player/save.js, which re-runs combat rules server-side and
 * validates every kill. The client stays optimistic; if the server corrects the state,
 * the canonical row is handed to the onServerCorrection() listener.
 */

import { supabase } from '../supabase'
import { savePayload } from '../gdd.js'

// ─── Queue ────────────────────────────────────────────────────────
let saveChain: Promise<void> = Promise.resolve()

function enqueue(task: () => Promise<void>) {
  saveChain = saveChain.then(task).catch(err => {
    console.error('[SaveQueue] write failed:', err)
  })
  return saveChain
}

/** Resolves once every queued save has landed. Await before signOut/reload. */
export function flush(): Promise<void> {
  return saveChain
}

// ─── Kill events (validated server-side) ──────────────────────────
export interface KillEvent { monsterId: string; zoneId: string; turns: number; at: number }
let pendingKills: KillEvent[] = []

export function recordKill(ev: KillEvent) {
  pendingKills.push(ev)
}

// ─── Server corrections ───────────────────────────────────────────
type CorrectionListener = (row: any, corrections: string[]) => void
let onCorrection: CorrectionListener | null = null
export function onServerCorrection(cb: CorrectionListener | null) {
  onCorrection = cb
}

// ─── Main save function ───────────────────────────────────────────
/**
 * Queues a save in sequential order.
 * Deep-snapshots the player object so future mutations can't corrupt in-flight writes.
 */
export function savePlayerNow(player: any, reason = ''): Promise<void> {
  if (!player?.uid) return saveChain

  // Deep snapshot — freeze the state at this exact moment
  const snapshot = JSON.parse(JSON.stringify(savePayload(player)))
  const snapshotAt = Date.now()
  const events = pendingKills
  pendingKills = []

  // Instant local backup for crash recovery
  try {
    localStorage.setItem('geminus_player_backup', JSON.stringify(snapshot))
  } catch {}

  if (reason) console.log('[save]', reason)

  return enqueue(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    let res: Response
    try {
      res = await fetch('/api/player/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        // sentAt = snapshot time, so queue backlog doesn't skew kill timing server-side
        body: JSON.stringify({ ...snapshot, events, sentAt: snapshotAt, reason }),
      })
    } catch (e) {
      // Network failure: keep the kills for the next save so XP isn't lost
      pendingKills = [...events, ...pendingKills]
      throw e
    }
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (res.status >= 500) pendingKills = [...events, ...pendingKills]
      console.error('[SaveQueue] server error:', reason, res.status, json?.error)
      return
    }
    if (json.corrections?.length) {
      console.warn('[SaveQueue] server corrected state:', json.corrections)
      if (json.player && onCorrection) onCorrection(json.player, json.corrections)
    }
  })
}
