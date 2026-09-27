import type { Player, BaseStats } from '../types'
import type { RaceData } from '../data/races'
import { GDD } from '../data/constants'

const STAT_PAIRS: Partial<Record<string, string>> = {
  STR: 'NTL', NTL: 'STR',
  DEX: 'WIS', WIS: 'DEX',
}

function getMainStat(archetype: string): 'DEX' | 'WIS' {
  if (archetype === 'True Caster' || archetype === 'Mystic Hybrid') return 'WIS'
  return 'DEX'
}

function distributeAP(weights: RaceData['weights'], totalAP: number): BaseStats {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  return {
    STR: Math.floor(totalAP * (weights.STR / totalWeight)),
    DEX: Math.floor(totalAP * (weights.DEX / totalWeight)),
    VIT: Math.floor(totalAP * (weights.VIT / totalWeight)),
    NTL: Math.floor(totalAP * (weights.NTL / totalWeight)),
    WIS: Math.floor(totalAP * (weights.WIS / totalWeight)),
  }
}

export function spendPoint(player: Player, stat: string, raceData: RaceData): Player {
  if ((player.attributePoints ?? 0) < GDD.AP_PER_LEVEL) return player
  if (player.level <= 1 && player.attributePoints <= GDD.AP_PER_LEVEL) return player

  const mainStat = getMainStat(player.archetype)
  const isVitPrimary = raceData.primaryStat === 'VIT'
  const gain = distributeAP(raceData.weights, GDD.AP_PER_LEVEL)

  if (stat === 'VIT' && !isVitPrimary) {
    const vitBonus = Math.floor(gain.VIT * 0.5)
    gain.VIT += vitBonus
    gain[mainStat] = Math.max(0, gain[mainStat] - vitBonus)
  } else if (stat !== mainStat && stat !== 'VIT' && STAT_PAIRS[stat]) {
    const pairedStat = STAT_PAIRS[stat] as keyof BaseStats
    const temp = gain[stat as keyof BaseStats]
    gain[stat as keyof BaseStats] = gain[pairedStat]
    gain[pairedStat] = temp
    gain[stat as keyof BaseStats] = Math.floor(gain[stat as keyof BaseStats] * 0.75)
  }

  return {
    ...player,
    baseStats: {
      STR: player.baseStats.STR + gain.STR,
      DEX: player.baseStats.DEX + gain.DEX,
      VIT: player.baseStats.VIT + gain.VIT,
      NTL: player.baseStats.NTL + gain.NTL,
      WIS: player.baseStats.WIS + gain.WIS,
    },
    attributePoints: player.attributePoints - GDD.AP_PER_LEVEL,
  }
}

export function getAttributeFocusOrder(archetype: string, race: string): string[] {
  const allStats = ['STR', 'DEX', 'VIT', 'NTL', 'WIS']
  if (race === 'troll' || race === 'vampire') return [...allStats.filter(s => s !== 'VIT'), 'VIT']
  const mainStat = getMainStat(archetype)
  return [...allStats.filter(s => s !== mainStat), mainStat]
}

export function canAllocate(player: Player): boolean {
  return (player.attributePoints ?? 0) >= GDD.AP_PER_LEVEL && player.level > 1
}

export function freeLevels(player: Player): number {
  return Math.floor((player.attributePoints ?? 0) / GDD.AP_PER_LEVEL)
}
