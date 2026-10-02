/**
 * server/rules.ts -- server-side combat + save validation.
 * Bundled to api/_lib/rules.mjs (pnpm build:server) so api/player/save.js runs the SAME
 * gdd.js formulas as the client. Never fork formulas here: import them.
 */
import {
  calcDerived, resolveTurn, playerPacket, monsterPacket, xpToLevel, GDD, DROPPER_TIERS,
  spendAttributeBank, STAT_KEYS,
} from '../src/gdd.js'
import { BASE_ITEMS } from '../src/data/baseItems'
import BESTIARY_DATA from '../src/data/bestiary.json'
import { zoneTargets, zoneInfo, canEnterZone, sellPrice, romanToInt, MAX_GEM_GRADE } from '../src/systems/services'
import { applyTurnResult, getDefaultAction, type CombatResult } from '../src/managers/CombatManager'
import { applyBalance, type Balance } from '../src/systems/balance'

export { applyBalance }

// ─── Ported: calculateDerivedStats / resolveCombatTurn ────────────
/** gdd.js calcDerived() with the live item table. Mutates and returns p. */
export function calculateDerivedStats(p: any): any {
  calcDerived(p, BASE_ITEMS)
  return p
}

/** gdd.js resolveTurn(), server RNG. */
export function resolveCombatTurn(player: any, monster: any, kind: string, rng: () => number = Math.random) {
  return resolveTurn({ player, monster, kind, rng })
}

// ─── Tunables ─────────────────────────────────────────────────────
export const LIMITS = {
  MIN_TURN_MS: 120,          // fastest a human can press a combat button
  CLOCK_SKEW_MS: 3000,       // tolerance between client clock and server clock
  MAX_KILLS_PER_SAVE: 25,
  MAX_AP_SPENDS_PER_SAVE: 20,
}

export interface KillEvent { monsterId: string; zoneId: string; turns: number; at: number }

/** Player object (client shape) from a players row. */
export function rowToPlayer(row: any): any {
  const p: any = {
    uid: row.uid, race: row.race || 'human', level: row.level ?? 1, xp: row.xp ?? 0,
    gold: Number(row.gold) || 0, bank: Number(row.bank) || 0,
    gemDust: Number(row.gem_dust) || 0, essence: Number(row.essence) || 0,
    hp: row.hp ?? null, attributePoints: row.attribute_points ?? 0, kills: row.kills ?? 0,
    baseStats: row.base_stats && Object.keys(row.base_stats).length ? { ...row.base_stats } : { STR: 15, DEX: 20, VIT: 10, NTL: 5, WIS: 5 },
    inventory: Array.isArray(row.inventory) ? row.inventory : [],
    equipment: row.equipment && typeof row.equipment === 'object' ? row.equipment : {},
    gems: Array.isArray(row.gems) ? row.gems : [],
    pos: row.pos && typeof row.pos === 'object' ? { zoneId: 'Z01', ...row.pos } : { zoneId: 'Z01' },
  }
  return calculateDerivedStats(p)
}

// ─── Kill validation ──────────────────────────────────────────────
function findMonster(zoneId: string, monsterId: string): any | null {
  return zoneTargets(zoneId, (BESTIARY_DATA as any).starter).find((m: any) => String(m.id) === String(monsterId)) || null
}

/** Best-case turns to kill (every hit lands and crits) and damage taken over a fight of `turns`. */
export function killBounds(player: any, monster: any, turns: number) {
  const d = player.derivedStats
  const kinds = [getDefaultAction(player.race), 'cast']
  const bestHit = Math.max(...kinds.map(k => playerPacket(d, monster.def, k))) * GDD.DEFAULT_CRIT_MULT
  const minTurns = bestHit > 0 ? Math.ceil(monster.hp / bestHit) : Infinity
  // Monster swings on every turn except the killing one
  const damageTaken = monsterPacket(monster.atk, d.AC) * Math.max(0, turns - 1)
  return { minTurns, damageTaken, survives: damageTaken < d.maxHp }
}

export function validateKill(player: any, ev: KillEvent): { ok: true; monster: any } | { ok: false; reason: string } {
  const zoneId = String(ev.zoneId || '')
  if (!zoneInfo(zoneId)) return { ok: false, reason: `unknown zone ${zoneId}` }
  if (!canEnterZone(player, zoneId)) return { ok: false, reason: `level ${player.level} cannot enter ${zoneId}` }
  const monster = findMonster(zoneId, ev.monsterId)
  if (!monster) return { ok: false, reason: `monster ${ev.monsterId} not in ${zoneId}` }
  const turns = Math.floor(Number(ev.turns))
  if (!(turns >= 1)) return { ok: false, reason: 'bad turn count' }
  const b = killBounds(player, monster, turns)
  if (turns < b.minTurns) return { ok: false, reason: `${monster.name} needs ${b.minTurns}+ turns, got ${turns}` }
  if (!b.survives) return { ok: false, reason: `would not survive ${turns} turns vs ${monster.name}` }
  return { ok: true, monster }
}

// ─── Attribute spending ───────────────────────────────────────────
/** True if `next` = `prior` + exactly `spends` attribute-bank clicks. */
function reachableStats(prior: any, next: any, race: string, spends: number): boolean {
  const vec = STAT_KEYS.map((k: string) => {
    const s = spendAttributeBank({}, race, k)
    return STAT_KEYS.map((j: string) => s[j] || 0)
  })
  const target = STAT_KEYS.map((k: string) => (next[k] || 0) - (prior[k] || 0))
  const close = (a: number[]) => a.every((v, i) => Math.abs(v - target[i]) < 1e-6)
  const walk = (i: number, left: number, acc: number[]): boolean => {
    if (i === vec.length - 1) return close(acc.map((v, j) => v + vec[i][j] * left))
    for (let n = 0; n <= left; n++) if (walk(i + 1, left - n, acc.map((v, j) => v + vec[i][j] * n))) return true
    return false
  }
  return walk(0, spends, target.map(() => 0))
}

// ─── Inventory / gems ─────────────────────────────────────────────
const gemTotal = (inv: any[], gems: any[]) =>
  gems.length + inv.reduce((n, i) => n + (i.socketedGems || []).length, 0)

function maxTierForLevel(level: number): number {
  return DROPPER_TIERS.filter((t: any) => level >= t.levelReq).reduce((m: number, t: any) => Math.max(m, t.tier), 1)
}

// ─── Main entry ───────────────────────────────────────────────────
export interface ValidateOpts { isDev: boolean; now: number; priorUpdatedAt: number; clientSentAt?: number }

/**
 * Validates a save against the last canonical row.
 * Returns the canonical row to write plus corrections (empty when the client was honest).
 */
export function validateSave(priorRow: any, body: any, events: KillEvent[], opts: ValidateOpts) {
  const corrections: string[] = []
  const prior = rowToPlayer(priorRow)
  const client = rowToPlayer({ ...priorRow, ...body, race: priorRow.race })

  if (opts.isDev) return { row: canonicalRow(client), corrections, acceptedKills: events.length }

  // 1. Kill events: timing window, plausibility, rewards (server numbers, not client's)
  const offset = opts.clientSentAt ? opts.now - opts.clientSentAt : 0
  let cursor = opts.priorUpdatedAt - LIMITS.CLOCK_SKEW_MS
  let p = { ...prior, inventory: [...prior.inventory], equipment: { ...prior.equipment }, gems: [...prior.gems] }
  let killGold = 0, accepted = 0, maxDropTier = 1
  const list = Array.isArray(events) ? events.slice(0, LIMITS.MAX_KILLS_PER_SAVE) : []
  if (Array.isArray(events) && events.length > list.length) corrections.push(`dropped ${events.length - list.length} kills over the per-save cap`)
  // Judge each kill with the stronger of the stored gear and the submitted gear
  // (players equip drops mid-batch); submitted gear is itself checked in step 4.
  const judge = (client.derivedStats.WC + client.derivedStats.SC) > (prior.derivedStats.WC + prior.derivedStats.SC) ? client : prior
  for (const ev of list) {
    const at = Number(ev.at) + offset
    const turns = Math.max(1, Math.floor(Number(ev.turns) || 1))
    if (!(at >= cursor + turns * LIMITS.MIN_TURN_MS) || at > opts.now + LIMITS.CLOCK_SKEW_MS) {
      corrections.push(`kill ${ev.monsterId}: too fast`); continue
    }
    const v = validateKill({ ...judge, level: p.level }, ev)
    if (!v.ok) { corrections.push(`kill ${ev.monsterId}: ${v.reason}`); continue }
    cursor = at
    const xpAfter = (p.xp ?? 0) + v.monster.xp
    const leveledUp = xpAfter >= xpToLevel(p.level ?? 1)
    const result = {
      status: 'VICTORY', xpGained: v.monster.xp, goldGained: v.monster.gold,
      leveledUp, newLevel: (p.level ?? 1) + (leveledUp ? 1 : 0), apGained: leveledUp ? GDD.AP_PER_LEVEL : 0,
      playerHp: p.derivedStats.maxHp,
    } as CombatResult
    p = applyTurnResult(p, result)
    killGold += v.monster.gold
    accepted++
    maxDropTier = Math.max(maxDropTier, romanToInt(zoneInfo(ev.zoneId)?.gear || 'I') || 1)
  }

  // 2. XP / level / kills are server-owned
  const out: any = { ...client, xp: p.xp, level: p.level, kills: p.kills, attributePoints: p.attributePoints }
  for (const [k, label] of [['xp', 'XP'], ['level', 'level'], ['kills', 'kills']] as const) {
    if ((client as any)[k] !== out[k]) corrections.push(`${label} ${(client as any)[k]} -> ${out[k]}`)
  }

  // 3. Attribute points: only spent in whole bank clicks, matching base stat growth
  const spent = (out.attributePoints - (client.attributePoints ?? 0)) / GDD.AP_PER_LEVEL
  const statsOk = Number.isInteger(spent) && spent >= 0 && spent <= LIMITS.MAX_AP_SPENDS_PER_SAVE
    && reachableStats(prior.baseStats, client.baseStats, prior.race, spent)
  if (statsOk) out.attributePoints = client.attributePoints
  else {
    corrections.push('attribute spend rejected')
    out.baseStats = { ...prior.baseStats }
  }

  // 4. Inventory: new items must be explainable by drops (bounded) or shop tiers the level allows
  const priorIds = new Set(prior.inventory.map((i: any) => i.instanceId))
  const fresh = client.inventory.filter((i: any) => !priorIds.has(i.instanceId))
  const isStarterKit = prior.inventory.length === 0 && fresh.every((i: any) => i.starter && (i.tier || 1) === 1)
  const levelTier = maxTierForLevel(out.level)
  const badItem = (i: any) =>
    !BASE_ITEMS.some(b => b.id === i.baseItemId)
    || !((i.tier || 1) >= 1 && (i.tier || 1) <= Math.max(levelTier, maxDropTier))
    || (i.type === 'Shadow' && !((i.qualityMultiplier ?? 0) >= 0.75 && (i.qualityMultiplier ?? 0) <= 1.5))
    || (i.type === 'Echo' && i.qualityMultiplier !== 0.5)
  let keepFresh = isStarterKit ? fresh : fresh.filter((i: any) => !badItem(i))
  if (keepFresh.length < fresh.length) corrections.push(`removed ${fresh.length - keepFresh.length} invalid items`)
  // Each accepted kill explains one Dropper drop (zone gear tier) and one Shadow/Echo drop;
  // any other new Dropper is a shop purchase and must be paid for (checked in step 6).
  let purchaseCost = 0
  const purchased = new Set<string>()
  if (!isStarterKit) {
    let dropperDrops = accepted, shadowDrops = accepted
    keepFresh = keepFresh.filter((i: any) => {
      if (i.type === 'Shadow' || i.type === 'Echo') return shadowDrops-- > 0
      if (dropperDrops > 0 && (i.tier || 1) <= maxDropTier) { dropperDrops--; return true }
      purchaseCost += (DROPPER_TIERS.find((t: any) => t.tier === (i.tier || 1))?.gold ?? Infinity)
      purchased.add(i.instanceId)
      return true
    })
    const droppedShadow = fresh.filter((i: any) => i.type === 'Shadow' || i.type === 'Echo').length - keepFresh.filter((i: any) => i.type === 'Shadow' || i.type === 'Echo').length
    if (droppedShadow > 0) corrections.push(`removed ${droppedShadow} unexplained shadow items`)
  }
  const keep = new Set([...priorIds, ...keepFresh.map((i: any) => i.instanceId)])
  out.inventory = client.inventory.filter((i: any) => keep.has(i.instanceId))
  out.equipment = Object.fromEntries(Object.entries(client.equipment).filter(([, id]) => keep.has(id as string)))

  // 5. Gems: grades in range, pouch + sockets can only grow by one per kill
  out.gems = client.gems.filter((g: any) => (g.grade || 1) >= 1 && (g.grade || 1) <= MAX_GEM_GRADE)
  const gemRoom = gemTotal(prior.inventory, prior.gems) + accepted
  while (gemTotal(out.inventory, out.gems) > gemRoom && out.gems.length) out.gems.pop()
  if (out.gems.length !== client.gems.length) corrections.push('gem pouch corrected')

  // 6. Wealth: gold + bank can only grow by kill gold and sales of removed items
  const removed = prior.inventory.filter((i: any) => !out.inventory.some((o: any) => o.instanceId === i.instanceId))
  const sales = removed.reduce((n: number, i: any) => n + sellPrice(i), 0)
  let ceiling = prior.gold + prior.bank + killGold + sales - purchaseCost
  if (ceiling < 0) {
    corrections.push('unpaid shop items removed')
    out.inventory = out.inventory.filter((i: any) => !purchased.has(i.instanceId))
    ceiling += purchaseCost
    out.equipment = Object.fromEntries(Object.entries(out.equipment).filter(([, id]) => out.inventory.some((i: any) => i.instanceId === id)))
  }
  out.gold = Math.max(0, Math.floor(client.gold)); out.bank = Math.max(0, Math.floor(client.bank))
  if (out.gold + out.bank > Math.max(0, ceiling)) {
    corrections.push(`wealth ${out.gold + out.bank} > ${Math.max(0, ceiling)}`)
    const over = out.gold + out.bank - Math.max(0, ceiling)
    out.gold = Math.max(0, out.gold - over)
    out.bank = Math.max(0, Math.min(out.bank, ceiling - out.gold))
  }
  out.gemDust = Math.max(0, client.gemDust); out.essence = Math.max(0, client.essence)

  // 7. Position: zone must be open to this level
  if (!canEnterZone(out, out.pos?.zoneId)) { corrections.push(`zone ${out.pos?.zoneId} locked`); out.pos = prior.pos }

  calculateDerivedStats(out)
  out.hp = Math.min(Math.max(0, Number(client.hp) || 0), out.derivedStats.maxHp)
  return { row: canonicalRow(out), corrections, acceptedKills: accepted }
}

function canonicalRow(p: any) {
  calculateDerivedStats(p)
  return {
    xp: p.xp, gold: p.gold, bank: p.bank, gem_dust: p.gemDust, essence: p.essence, level: p.level,
    hp: Math.min(p.hp ?? p.derivedStats.maxHp, p.derivedStats.maxHp), max_hp: p.derivedStats.maxHp,
    attribute_points: p.attributePoints, base_stats: p.baseStats, pos: p.pos,
    inventory: p.inventory, equipment: p.equipment, gems: p.gems, kills: p.kills,
  }
}

export function applyPublishedBalance(balance: Balance | null) { applyBalance(balance) }
