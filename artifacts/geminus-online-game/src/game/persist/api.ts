/**
 * src/game/persist/api.ts
 * Supabase-only player I/O — Firebase removed.
 */

import { supabase } from '../../supabase'
import type { Player } from '../types'
import { calcDerived } from '../rules/derived'
import { getXpToNextLevel } from '../rules/xp'
import { RACES } from '../data/races'

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
      subType: item.baseItemId.split('_')[2] ?? 'Sword',
    }
  }
}

export async function loadPlayer(uid: string): Promise<Player> {
  const res = await fetch(`/api/player?uid=${uid}`)
  const row = await res.json()

  if (!row || row.error || !row.uid) {
    throw new Error('Character not found. Sign out and create your character.')
  }

  const raceData = RACES[row.race] || RACES.human

  const p: Omit<Player, 'derivedStats'> & { derivedStats?: Player['derivedStats'] } = {
    uid,
    name:            row.name        || 'Pilot',
    race:            row.race        || 'human',
    raceName:        row.race_name   || raceData.raceName,
    archetype:       row.archetype   || raceData.archetype,
    cci:             row.cci         || raceData.primaryStat,
    level:           row.level       ?? 1,
    xp:              row.xp          ?? 0,
    xpToNextLevel:   getXpToNextLevel(row.level ?? 1),
    attributePoints: row.attribute_points ?? 0,
    gold:            row.gold        ?? 0,
    bank:            row.bank        ?? 0,
    hp:              row.hp          ?? 0,
    baseStats:       (row.base_stats && Object.keys(row.base_stats).length > 0)
                       ? row.base_stats
                       : raceData.baseStats,
    inventory:       Array.isArray(row.inventory) ? row.inventory : [],
    equipment:       (row.equipment && typeof row.equipment === 'object') ? row.equipment : {},
    gems:            Array.isArray(row.gems) ? row.gems : [],
    pos:             (row.pos && typeof row.pos === 'object') ? row.pos : { x: 7, y: 7 },
    kills:           row.kills ?? 0,
  }

  p.xpToNextLevel = getXpToNextLevel(p.level)

  const derived = calcDerived(p as Player, makeGetItemCV(p.inventory))
  const player: Player = { ...(p as Player), derivedStats: derived }

  if (!player.hp || player.hp > derived.maxHp) player.hp = derived.maxHp

  return player
}

export async function savePlayer(player: Player, reason = ''): Promise<void> {
  if (!player?.uid) return
  try {
    const res = await fetch('/api/player/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid:              player.uid,
        xp:               player.xp             ?? 0,
        gold:             player.gold            ?? 0,
        level:            player.level           ?? 1,
        hp:               player.hp              ?? 100,
        max_hp:           player.derivedStats?.maxHp ?? 100,
        attribute_points: player.attributePoints  ?? 0,
        base_stats:       player.baseStats        ?? {},
        pos:              player.pos              ?? { x: 7, y: 7 },
        inventory:        player.inventory        ?? [],
        equipment:        player.equipment        ?? {},
        gems:             player.gems             ?? [],
        kills:            player.kills            ?? 0,
      }),
    })
    if (!res.ok) console.warn(`[savePlayer] ${reason} — HTTP ${res.status}`)
    else if (reason) console.log(`[savePlayer] ${reason} ✓`)
  } catch (e) {
    console.error('[savePlayer] failed:', e)
  }
}
