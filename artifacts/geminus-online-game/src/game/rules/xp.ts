import type { Player } from '../types'
import { GDD } from '../data/constants'

export function getXpToNextLevel(level: number): number {
  return Math.floor(GDD.XP_BASE * Math.pow(GDD.XP_GROWTH, level))
}

export function applyKillRewards(player: Player, xp: number, gold: number): Player {
  let newXp    = player.xp + xp
  let newLevel = player.level
  let newAP    = player.attributePoints
  let xpNeeded = getXpToNextLevel(newLevel)

  while (newXp >= xpNeeded && newLevel < GDD.LEVEL_CAP) {
    newXp    -= xpNeeded
    newLevel += 1
    newAP    += GDD.AP_PER_LEVEL
    xpNeeded  = getXpToNextLevel(newLevel)
  }

  return {
    ...player,
    xp: newXp,
    xpToNextLevel: xpNeeded,
    level: newLevel,
    attributePoints: newAP,
    gold: player.gold + gold,
    kills: (player.kills ?? 0) + 1,
  }
}

export function xpProgressPct(player: Player): number {
  if (!player.xpToNextLevel) return 0
  return Math.max(0, Math.min(100, (player.xp / player.xpToNextLevel) * 100))
}

export function hpProgressPct(player: Player): number {
  const maxHp = player.derivedStats?.maxHp ?? 100
  return Math.max(0, Math.min(100, (player.hp / maxHp) * 100))
}

export function fmt(n: number): string {
  if (!n || isNaN(n)) return '0'
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}
