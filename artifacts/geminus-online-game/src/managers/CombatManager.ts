/**
 * src/managers/CombatManager.ts
 * GOG Combat Manager -- GDD 3.4
 * Wraps gdd.js resolveTurn() into a clean result object for App.tsx.
 * App.tsx calls runTurn() and reads the result -- no DOM logic here.
 */

import {
  resolveTurn,
  rollSpecialDrop,
  xpToLevel,
  raceOf,
  isHybrid,
  GDD,
} from '../gdd.js'
import { ECONOMY } from '../systems/services'

// ─── Types ────────────────────────────────────────────────────────

export type ActionKind = 'fight' | 'cast' | 'spellstrike'

export interface Monster {
  id: string
  name: string
  hp: number
  atk: number
  def: number
  xp: number
  gold: number
  isBoss?: boolean
  currentHP?: number
}

export interface CombatResult {
  // Action
  action: ActionKind
  // Player attack
  hit: boolean
  crit: boolean
  playerDmg: number
  // Monster attack
  monsterDmg: number
  // New HP values
  monsterHp: number
  playerHp: number
  // Outcome
  status: 'ONGOING' | 'VICTORY' | 'DEFEAT'
  // Loot (only on VICTORY)
  xpGained: number
  goldGained: number
  itemDrop: boolean
  specialDrop: { kind: string | null; grade?: number } | null
  // Level up (only on VICTORY if applicable)
  leveledUp: boolean
  newLevel: number
  apGained: number
}

// ─── Zone helper (minimal -- just what combat needs) ───────────────

interface ZoneRef {
  id?: string
  zoneId?: string
  type?: string
  gemMin?: number
  gemMax?: number
}

// ─── Item drop roll (40% chance, race-appropriate) ────────────────

const FIGHTER_POOL = ['base_helm_1', 'base_armor_1', 'base_gauntlets_1', 'base_leggings_1', 'base_boots_1']
const CASTER_POOL  = ['base_helm_1', 'base_armor_1', 'base_gauntlets_1', 'base_leggings_1', 'base_boots_1']

function rollItemDrop(raceKey: string): boolean {
  // 40% drop chance -- item creation handled in App.tsx via rollItemDrop()
  // CombatManager just signals whether a drop occurred
  return Math.random() < ECONOMY.ITEM_DROP_CHANCE
}

// ─── Core: runTurn ────────────────────────────────────────────────

/**
 * Run one full combat turn.
 *
 * @param player  - live player object (must have derivedStats, hp, race, level etc.)
 * @param monster - current monster with currentHP set
 * @param action  - 'fight' | 'cast' | 'spellstrike'
 * @param zone    - current zone ref for special drop roll
 * @returns CombatResult
 */
export function runTurn(
  player: any,
  monster: Monster,
  action: ActionKind,
  zone: ZoneRef = { id: 'Z01' }
): CombatResult {
  // 1. Resolve turn via GDD
  const turn = resolveTurn({
    player,
    monster: {
      ...monster,
      currentHP: monster.currentHP ?? monster.hp,
      def: monster.def,
      atk: monster.atk,
      AC: monster.def,   // alias for gdd compat
      Attack: monster.atk,
    },
    kind: action,
  })

  // 2. Determine status
  let status: 'ONGOING' | 'VICTORY' | 'DEFEAT' = 'ONGOING'
  if (turn.deadMonster) status = 'VICTORY'
  else if (turn.deadPlayer) status = 'DEFEAT'

  // 3. Loot (only on victory)
  let xpGained = 0
  let goldGained = 0
  let itemDrop = false
  let specialDrop: { kind: string | null; grade?: number } | null = null
  let leveledUp = false
  let newLevel = player.level ?? 1
  let apGained = 0

  if (status === 'VICTORY') {
    xpGained = monster.xp
    goldGained = monster.gold

    // Item drop
    itemDrop = rollItemDrop(player.race)

    // Special drop (gem / shadow / gold-bag) via GDD
    specialDrop = rollSpecialDrop({
      id: zone.id || zone.zoneId || 'Z01',
      type: zone.type,
      gemMin: zone.gemMin ?? 1,
      gemMax: zone.gemMax ?? 1,
    })

    // Level up check
    const xpAfter = (player.xp ?? 0) + xpGained
    const xpNeeded = xpToLevel(player.level ?? 1)
    if (xpAfter >= xpNeeded) {
      leveledUp = true
      newLevel = (player.level ?? 1) + 1
      apGained = GDD.AP_PER_LEVEL
    }
  }

  return {
    action,
    hit: turn.hit,
    crit: turn.crit,
    playerDmg: turn.playerDmg,
    monsterDmg: turn.monsterDmg,
    monsterHp: turn.monsterHp,
    playerHp: turn.playerHp,
    status,
    xpGained,
    goldGained,
    itemDrop,
    specialDrop,
    leveledUp,
    newLevel,
    apGained,
  }
}

// ─── Helper: getDefaultAction ─────────────────────────────────────
// Returns the correct default action for a race per GDD

export function getDefaultAction(raceKey: string): ActionKind {
  const rd = raceOf(raceKey)
  if (isHybrid(rd)) return 'spellstrike'
  if (rd.archetype === 'True Caster') return 'cast'
  return 'fight'
}

// ─── Helper: applyTurnResult ──────────────────────────────────────
// Applies a CombatResult to a player object (returns new player, does not mutate)

export function applyTurnResult(player: any, result: CombatResult): any {
  const p = {
    ...player,
    baseStats: { ...player.baseStats },
    derivedStats: { ...player.derivedStats },
  }

  if (result.status === 'DEFEAT') {
    // GDD 3.4: chassis resets to maxHP, death counter +1, no gold/XP wipe
    p.hp = p.derivedStats.maxHp
    p.deaths = (p.deaths ?? 0) + 1
    return p
  }

  // Update HP
  p.hp = result.status === 'VICTORY'
    ? Math.min(result.playerHp, p.derivedStats.maxHp)
    : Math.max(0, result.playerHp)

  if (result.status === 'VICTORY') {
    p.xp = (p.xp ?? 0) + result.xpGained
    p.gold = (p.gold ?? 0) + result.goldGained
    p.kills = (p.kills ?? 0) + 1

    if (result.leveledUp) {
      p.level = result.newLevel
      p.xp = p.xp - xpToLevel(player.level ?? 1)
      p.attributePoints = (p.attributePoints ?? 0) + result.apGained
      p.xpToNextLevel = xpToLevel(p.level)
    }
  }

  return p
}

// ─── ADDED FROM JOSH ──────────────────────────────────────────────
// Josh's CombatManager.js renders Double/Triple strikes (strike.type) but resolves
// them in Systems.resolveCombatTurn. The rules below come from GDD 2.8-2.10 / 3.8.
// Not yet wired into runTurn() / applyTurnResult().

import { racialPower, playerPacket } from '../gdd.js'
// @ts-ignore -- untyped JS data
import { alignmentData } from '../data/alignmentData.js'
// @ts-ignore -- untyped JS data
import { masteryData } from '../data/masteryData.js'

// ADDED FROM JOSH
export interface Strike {
  hit: boolean
  crit: boolean
  dmg: number
  type: 'single' | 'double' | 'triple'
}

// ADDED FROM JOSH
/** GDD 2.10: Base 0 + Mastery (+0.1%/MP, cap 10%) + Racial (Human/Werewolf) + Gem. Returns percent. */
export function doubleHitChance(player: any): number {
  const mp = Math.min(masteryData.config.baseCap, player.mastery?.doubleHit ?? 0)
  const mastery = mp * masteryData.benefits.doubleHit * 100
  const race = String(player.race || '').toLowerCase()
  const racial = race === 'human' || race === 'werewolf' ? racialPower(player).value : 0
  const gem = player.derivedStats?.gemDoubleHit ?? 0
  return Math.min(100, mastery + racial + gem)
}

// ADDED FROM JOSH
/**
 * GDD 2.10 resolution order: hit -> dmg -> crit -> double roll -> second hit/crit.
 * Triple Hit (Grasp of Unrelenting accessory): 25% for a double to add a third strike.
 */
export function resolveDoubleHit(
  player: any,
  monsterDef: number,
  action: ActionKind,
  rng: () => number = Math.random
): { strikes: Strike[]; totalDmg: number } {
  const d = player.derivedStats || {}
  const hitPct = d.hitChance || 90
  const critPct = d.critChance || 5
  const one = (type: Strike['type']): Strike => {
    if (rng() * 100 > hitPct) return { hit: false, crit: false, dmg: 0, type }
    let dmg = playerPacket(d, monsterDef, action)
    const crit = rng() * 100 <= critPct
    if (crit) dmg *= GDD.DEFAULT_CRIT_MULT
    return { hit: true, crit, dmg, type }
  }
  const strikes: Strike[] = [one('single')]
  if (!strikes[0].hit) return { strikes, totalDmg: 0 }
  if (rng() * 100 <= doubleHitChance(player)) {
    strikes.push(one('double'))
    const hasGrasp = player.equippedGear?.ACC?.id === 'grasp_of_unrelenting' || player.equipment?.ACC === 'grasp_of_unrelenting'
    if (hasGrasp && rng() < 0.25) strikes.push(one('triple'))
  }
  return { strikes, totalDmg: strikes.reduce((s, k) => s + k.dmg, 0) }
}

// ADDED FROM JOSH
/** GDD 3.8: QM = Base QM + (kills / 1000) * 0.01, hard cap 1.50. Echo items never grow. */
export const SHADOW_QM_CAP = 1.5
export function shadowQM(item: any): number {
  const base = item.baseQM ?? item.qualityMultiplier ?? 0.75
  return Math.min(SHADOW_QM_CAP, base + ((item.killsAccumulated ?? 0) / 1000) * 0.01)
}

// ADDED FROM JOSH
/** Credits one kill to every equipped Shadow item (all zone types). Returns a new player. */
export function trackKillGrowth(player: any, kills = 1): any {
  const equipped = new Set(Object.values(player.equipment || {}).filter(Boolean))
  const inventory = (player.inventory || []).map((it: any) => {
    if (!equipped.has(it.instanceId) || it.type !== 'Shadow') return it
    const next = { ...it, baseQM: it.baseQM ?? it.qualityMultiplier, killsAccumulated: (it.killsAccumulated ?? 0) + kills }
    next.qualityMultiplier = shadowQM(next)
    return next
  })
  return { ...player, inventory }
}

// ADDED FROM JOSH
/** GDD 2.9: Marauder +1, Dreadlord +2, Juggernaut -1, Apex -2. Clamped to +/-25,000. */
export function applyAlignmentGain(player: any, monsterTitle?: string | null): any {
  const trig = monsterTitle ? (alignmentData.monsterTriggers as any)[String(monsterTitle).toUpperCase()] : null
  if (!trig) return player
  const { minAlignment, maxAlignment } = alignmentData.config
  const alignment = Math.max(minAlignment, Math.min(maxAlignment, (player.alignment ?? 0) + trig.value))
  return { ...player, alignment }
}

// ADDED FROM JOSH
/** GDD 2.8: MasteryXP Required = 5000 * 1.15^MP. Awards XP to a track; returns a new player. */
export type MasteryTrack = 'weapon' | 'spell' | 'armor' | 'doubleHit'
export function masteryXpRequired(mp: number): number {
  return masteryData.config.xpBase * Math.pow(masteryData.config.xpMultiplier, mp)
}
export function addMasteryXp(player: any, track: MasteryTrack, xp: number): any {
  const mastery = { ...(player.mastery || {}) }
  const xpMap = { ...(player.masteryXp || {}) }
  let mp = mastery[track] ?? 0
  let pool = (xpMap[track] ?? 0) + xp
  while (mp < masteryData.config.baseCap && pool >= masteryXpRequired(mp)) {
    pool -= masteryXpRequired(mp)
    mp++
  }
  if (mp >= masteryData.config.baseCap) pool = 0
  mastery[track] = mp
  xpMap[track] = pool
  return { ...player, mastery, masteryXp: xpMap }
}
