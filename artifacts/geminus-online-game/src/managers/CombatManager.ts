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
  return Math.random() < 0.40
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
