import type { Player, DerivedStats } from '../types'

interface SlotMod { stat: 'AC' | 'WC' | 'SC'; prop: number }

const SLOT_MODS: Record<string, SlotMod> = {
  Armor:     { stat: 'AC', prop: 1.00 },
  Helmet:    { stat: 'AC', prop: 0.75 },
  Boots:     { stat: 'AC', prop: 0.75 },
  Leggings:  { stat: 'AC', prop: 0.50 },
  Gauntlets: { stat: 'AC', prop: 0.50 },
  Gloves:    { stat: 'AC', prop: 0.50 },
  Sword:     { stat: 'WC', prop: 1.00 },
  Axe:       { stat: 'WC', prop: 1.00 },
  Fire:      { stat: 'SC', prop: 1.00 },
  Air:       { stat: 'SC', prop: 1.00 },
  Death:     { stat: 'SC', prop: 1.00 },
  Staff:     { stat: 'SC', prop: 1.00 },
  Rune:      { stat: 'AC', prop: 0.00 },
  Amulet:    { stat: 'AC', prop: 0.00 },
  Ring:      { stat: 'AC', prop: 0.00 },
}

export type GetItemCV = (instanceId: string) => { cv: number; subType: string } | null

export function calcDerived(
  player: Omit<Player, 'derivedStats'> & { derivedStats?: DerivedStats },
  getItemCV: GetItemCV,
): DerivedStats {
  const { baseStats, equipment, archetype, race } = player

  let totalAC = 0, totalWC = 0, totalSC = 0

  for (const [, instanceId] of Object.entries(equipment)) {
    if (!instanceId) continue
    const item = getItemCV(instanceId)
    if (!item) continue
    const mod = SLOT_MODS[item.subType]
    if (!mod || mod.prop === 0) continue
    const contribution = item.cv * mod.prop
    if (mod.stat === 'AC') totalAC += contribution
    if (mod.stat === 'WC') totalWC += contribution
    if (mod.stat === 'SC') totalSC += contribution
  }

  const isTroll   = race === 'troll'
  const isVampire = race === 'vampire'
  const DEX = baseStats.DEX
  const WIS = baseStats.WIS
  const VIT = baseStats.VIT

  const wcScale = isTroll ? 1 + VIT * 0.0055
    : archetype === 'True Caster' ? 1
    : archetype === 'Mystic Hybrid' ? 1 + WIS * 0.0055
    : 1 + DEX * 0.0055

  const scScale = isVampire ? 1 + VIT * 0.0055
    : archetype === 'True Fighter' ? 1
    : archetype === 'Martial Hybrid' ? 1 + DEX * 0.0055
    : 1 + WIS * 0.0055

  const acScale = 1 + VIT * 0.0075

  const combatStat = archetype === 'True Caster' || archetype === 'Mystic Hybrid' ? WIS : DEX

  return {
    maxHp:     100 + VIT * 10,
    AC:        Math.max(10, totalAC * acScale),
    WC:        Math.max(12, totalWC * wcScale),
    SC:        Math.max(10, totalSC * scScale),
    hitChance: Math.min(99, 90 + combatStat * 0.05),
    critChance: Math.min(60, 5  + combatStat * 0.01),
  }
}

export function clampHp(currentHp: number, maxHp: number): number {
  return Math.max(0, Math.min(maxHp, currentHp))
}
