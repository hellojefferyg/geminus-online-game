/**
 * src/systems/services.ts
 * Town services + loot systems ported from Geminus.1 (src/utils/systems.js,
 * src/managers/economy/*, public/modules/gem_cutter.html) onto the live GDD 3.4 rules.
 *
 * Pure functions only -- no React, no DOM, no saving. Every action returns a new
 * player object (or an error message) and App.tsx decides what to render and save.
 * Formulas that affect combat stay in gdd.js; this file only moves items, gems and gold.
 */

import GEMS_DATA from '../data/gems.json'
import ENCHANT_DATA from '../data/enchantments.json'
import ZONE_MONSTERS from '../data/zoneMonsters.json'
import ZONES_DATA from '../data/zones.json'
import { LATTICE_VERSION, getStampById } from '../game/map/lattice'
import { DROPPER_TIERS, GEM_GATES, GDD, ZONE_TYPES, STARTER_RACE } from '../gdd.js'

export type ServiceResult = { ok: true; player: any; msg: string } | { ok: false; msg: string }
type Rng = () => number

export const MAX_GEM_GRADE = 9

/** Shop, Gemcutter, Teleporter and bag numbers. God Editor → Shops & Services edits this live. */
export const ECONOMY = {
  SELL_RATE: 0.25,              // Geminus.1 MerchantManager: sell for 25%
  UNSOCKET_COST: 250,           // Geminus.1 gem_cutter GDD.UNSOCKET_COST
  FUSE_COST_BASE: 10000,        // upgrade/fuse = grade² x this (Geminus.1 gem_cutter fusingCost)
  CRUCIBLE_DUST_PER_GRADE: 25,  // crucible = grade x this gem dust
  TELEPORT_BASE: 10000,         // teleport = base + zone level x per-level (Geminus.1 portal.html)
  TELEPORT_PER_LEVEL: 50,
  ITEM_DROP_CHANCE: 0.40,       // chance a kill drops a normal item
  INVENTORY_CAP: 200,           // gem pouch size lives in Constants (GEM_POUCH_CAP)
}
export const gemPouchCap = () => GDD.GEM_POUCH_CAP ?? 200
export const fuseCost = (grade: number) => grade * grade * ECONOMY.FUSE_COST_BASE

const fail = (msg: string): ServiceResult => ({ ok: false, msg })
const clonePlayer = (p: any) => ({
  ...p,
  inventory: [...(p.inventory || [])],
  equipment: { ...(p.equipment || {}) },
  gems: [...(p.gems || [])],
})
const newId = () => crypto.randomUUID()

// ─── Gems ─────────────────────────────────────────────────────────

const STANDARD: Record<string, any> = (GEMS_DATA as any).standard
const FUSION: Record<string, any> = (GEMS_DATA as any).fusion

export const STANDARD_GEM_IDS = Object.keys(STANDARD)

/** Normalises legacy ids ('warStone', 'obsidian_heart') to gems.json keys ('warstone'). */
export function gemKey(id: string): string {
  return (id || '').toLowerCase().replace(/[-_\s]/g, '')
}

export function gemDef(id: string): any | null {
  const k = gemKey(id)
  return STANDARD[k] || FUSION[k] || null
}

export function gemInfo(id: string): { name: string; category: string; color: string; description: string; isFusion: boolean } {
  const d = gemDef(id)
  if (!d) return { name: 'Gem', category: 'Misc', color: 'Green', description: '', isFusion: false }
  return { name: d.name, category: d.category, color: d.color, description: d.description, isFusion: !!FUSION[gemKey(id)] }
}

export function gemMinLevel(id: string, grade: number): number {
  const d = gemDef(id)
  return d?.minLevel?.[String(grade)] ?? GEM_GATES[grade] ?? 1
}

export function gemEffectText(id: string, grade: number): string {
  const d = gemDef(id)
  if (!d) return ''
  const g = d.grades?.[String(grade)]
  if (g == null) return ''
  if (typeof g === 'number') return `${d.effect} +${g}`
  return Object.entries(g).map(([k, v]) => `${k} +${v}`).join(' · ')
}

/** Random standard gem for a special gem drop (Geminus.1 crucible pool = all standard gems). */
export function rollGemId(rng: Rng = Math.random): string {
  return STANDARD_GEM_IDS[Math.floor(rng() * STANDARD_GEM_IDS.length)]
}

export const FUSION_RECIPES: { id: string; name: string; from: [string, string] }[] =
  Object.entries(FUSION).map(([id, d]: [string, any]) => ({ id, name: d.name, from: [d.fusedFrom[0], d.fusedFrom[1]] }))

function pouchIndex(gems: any[], id: string, grade: number, skip: number[] = []): number {
  const k = gemKey(id)
  return gems.findIndex((g, i) => !skip.includes(i) && gemKey(g.id) === k && (g.grade || 1) === grade)
}

export function countGems(gems: any[], id: string, grade: number): number {
  const k = gemKey(id)
  return gems.filter(g => gemKey(g.id) === k && (g.grade || 1) === grade).length
}

/** Pouch grouped by gem + grade, for display. */
export function groupPouch(gems: any[]): { id: string; grade: number; count: number }[] {
  const map = new Map<string, { id: string; grade: number; count: number }>()
  for (const g of gems || []) {
    const id = gemKey(g.id); const grade = g.grade || 1
    const key = `${id}|${grade}`
    const cur = map.get(key)
    if (cur) cur.count++
    else map.set(key, { id, grade, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.grade - a.grade || a.id.localeCompare(b.id))
}

// ─── Gemcutter ────────────────────────────────────────────────────

export function socketCapacity(item: any, BASE_ITEMS: any[]): number {
  const base = BASE_ITEMS.find(b => b.id === item?.baseItemId)
  return base?.sockets ?? 0
}

export function socketGem(p: any, instanceId: string, pouchIdx: number, BASE_ITEMS: any[]): ServiceResult {
  const idx = (p.inventory || []).findIndex((i: any) => i.instanceId === instanceId)
  if (idx < 0) return fail('Item not found.')
  const gem = p.gems?.[pouchIdx]
  if (!gem) return fail('Gem not found.')
  const item = p.inventory[idx]
  const socketed = item.socketedGems || []
  if (socketed.length >= socketCapacity(item, BASE_ITEMS)) return fail('No free sockets on this item.')
  const need = gemMinLevel(gem.id, gem.grade || 1)
  if ((p.level || 1) < need) return fail(`Grade ${gem.grade} gems require level ${need.toLocaleString()}.`)
  const next = clonePlayer(p)
  next.gems.splice(pouchIdx, 1)
  next.inventory[idx] = { ...item, socketedGems: [...socketed, { id: gemKey(gem.id), grade: gem.grade || 1 }] }
  return { ok: true, player: next, msg: `Socketed ${gemInfo(gem.id).name} G${gem.grade || 1}.` }
}

export function unsocketGem(p: any, instanceId: string, socketIdx: number): ServiceResult {
  const idx = (p.inventory || []).findIndex((i: any) => i.instanceId === instanceId)
  if (idx < 0) return fail('Item not found.')
  const item = p.inventory[idx]
  const gem = (item.socketedGems || [])[socketIdx]
  if (!gem) return fail('Socket is empty.')
  if ((p.gold || 0) < ECONOMY.UNSOCKET_COST) return fail(`Unsocketing costs ${ECONOMY.UNSOCKET_COST} gold.`)
  if ((p.gems || []).length >= gemPouchCap()) return fail('Gem pouch is full.')
  const next = clonePlayer(p)
  next.gold = (p.gold || 0) - ECONOMY.UNSOCKET_COST
  next.inventory[idx] = { ...item, socketedGems: item.socketedGems.filter((_: any, i: number) => i !== socketIdx) }
  next.gems.push({ id: gemKey(gem.id), grade: gem.grade || 1 })
  return { ok: true, player: next, msg: `${gemInfo(gem.id).name} returned to pouch (-${ECONOMY.UNSOCKET_COST} gold).` }
}

/** Three identical gems -> one gem of the next grade. */
export function upgradeGems(p: any, id: string, grade: number): ServiceResult {
  if (grade >= MAX_GEM_GRADE) return fail('Already max grade.')
  const cost = fuseCost(grade)
  if ((p.gold || 0) < cost) return fail(`Need ${cost.toLocaleString()} gold.`)
  const used: number[] = []
  for (let n = 0; n < 3; n++) {
    const i = pouchIndex(p.gems || [], id, grade, used)
    if (i < 0) return fail('Need 3 identical gems of the same grade.')
    used.push(i)
  }
  const next = clonePlayer(p)
  next.gems = next.gems.filter((_: any, i: number) => !used.includes(i))
  next.gems.push({ id: gemKey(id), grade: grade + 1 })
  next.gold = (p.gold || 0) - cost
  return { ok: true, player: next, msg: `Forged ${gemInfo(id).name} G${grade + 1}!` }
}

/** Two component gems of the same grade -> fusion gem of that grade (gems.json fusedFrom). */
export function fuseGems(p: any, fusionId: string, grade: number): ServiceResult {
  const recipe = FUSION_RECIPES.find(r => r.id === fusionId)
  if (!recipe) return fail('Unknown recipe.')
  const cost = fuseCost(grade)
  if ((p.gold || 0) < cost) return fail(`Need ${cost.toLocaleString()} gold.`)
  const a = pouchIndex(p.gems || [], recipe.from[0], grade)
  const b = pouchIndex(p.gems || [], recipe.from[1], grade, a < 0 ? [] : [a])
  if (a < 0 || b < 0) return fail(`Need ${gemInfo(recipe.from[0]).name} + ${gemInfo(recipe.from[1]).name} at G${grade}.`)
  const next = clonePlayer(p)
  next.gems = next.gems.filter((_: any, i: number) => i !== a && i !== b)
  next.gems.push({ id: recipe.id, grade })
  next.gold = (p.gold || 0) - cost
  return { ok: true, player: next, msg: `Fused ${recipe.name} G${grade}!` }
}

// ─── Gilded Vault ─────────────────────────────────────────────────

export function depositGold(p: any, amount: number): ServiceResult {
  const amt = Math.floor(amount)
  if (!(amt > 0)) return fail('Invalid amount.')
  if ((p.gold || 0) < amt) return fail('Insufficient gold on hand.')
  return { ok: true, player: { ...p, gold: (p.gold || 0) - amt, bank: (p.bank || 0) + amt }, msg: `Deposited ${amt.toLocaleString()} gold.` }
}

export function withdrawGold(p: any, amount: number): ServiceResult {
  const amt = Math.floor(amount)
  if (!(amt > 0)) return fail('Invalid amount.')
  if ((p.bank || 0) < amt) return fail('Insufficient gold in vault.')
  return { ok: true, player: { ...p, gold: (p.gold || 0) + amt, bank: (p.bank || 0) - amt }, msg: `Withdrew ${amt.toLocaleString()} gold.` }
}

// ─── Sanctuary ────────────────────────────────────────────────────
// Geminus.1's Penitent/Bargain revival (100% gold + XP loss) is superseded by
// GDD 3.4 (death resets HP, no wipe), so the Sanctuary only restores health.

export function sanctuaryRest(p: any): ServiceResult {
  const max = p.derivedStats?.maxHp ?? 100
  if ((p.hp ?? max) >= max) return fail('Your chassis is already at full integrity.')
  return { ok: true, player: { ...p, hp: max }, msg: 'Health fully restored.' }
}

// ─── Armory / Arcanium ────────────────────────────────────────────

export const SHOP_TYPES: Record<string, string[]> = {
  armory: ['Armor', 'Weapons', 'Amulet', 'Ring'],
  arcanium: ['Spells', 'BuffSpells', 'OffHands'],
}

export function shopStock(shop: string, BASE_ITEMS: any[]): any[] {
  const types = SHOP_TYPES[shop] || []
  return BASE_ITEMS.filter(b => types.includes(b.type))
}

export function tierInfo(tier: number) {
  return DROPPER_TIERS.find(t => t.tier === tier) || DROPPER_TIERS[0]
}

export function buyItem(p: any, baseItemId: string, tier: number, BASE_ITEMS: any[]): ServiceResult {
  const base = BASE_ITEMS.find(b => b.id === baseItemId)
  if (!base) return fail('Item not found.')
  const t = tierInfo(tier)
  if ((p.level || 1) < t.levelReq) return fail(`Tier ${tier} requires level ${t.levelReq.toLocaleString()}.`)
  if ((p.gold || 0) < t.gold) return fail('Insufficient gold.')
  if ((p.inventory || []).length >= ECONOMY.INVENTORY_CAP) return fail('Inventory is full.')
  const next = clonePlayer(p)
  next.gold = (p.gold || 0) - t.gold
  next.inventory.push({ instanceId: newId(), baseItemId, tier, type: 'Dropper', socketedGems: [] })
  return { ok: true, player: next, msg: `Purchased ${base.name} (T${tier}).` }
}

export function sellPrice(item: any): number {
  return Math.floor(tierInfo(item?.tier || 1).gold * ECONOMY.SELL_RATE * (item?.qualityMultiplier ?? 1))
}

export function sellItem(p: any, instanceId: string): ServiceResult {
  const item = (p.inventory || []).find((i: any) => i.instanceId === instanceId)
  if (!item) return fail('Item not found.')
  if (Object.values(p.equipment || {}).includes(instanceId)) return fail('Unequip the item first.')
  if ((item.socketedGems || []).length) return fail('Remove socketed gems at the Gemcutter first.')
  const price = sellPrice(item)
  const next = clonePlayer(p)
  next.inventory = next.inventory.filter((i: any) => i.instanceId !== instanceId)
  next.gold = (p.gold || 0) + price
  return { ok: true, player: next, msg: `Sold for ${price.toLocaleString()} gold.` }
}

// ─── Shadow / Echo loot (GDD 2.4, Geminus.1 generateShadowLoot) ───

const ENCHANTMENTS: any[] = (ENCHANT_DATA as any).enchantments

/** Magic tier from item tier (the 2.25 rule), clamped 1-9. */
export function magicTier(itemTier: number): number {
  return Math.max(1, Math.min(9, Math.ceil((itemTier || 1) / 2.25)))
}

function enchantCount(qm: number, rng: Rng): number {
  if (qm >= 1.5) return 4
  if (qm >= 1.25) return 2 + Math.floor(rng() * 2)
  if (qm >= 1.15) return 2
  if (qm >= 1.0) return 1 + Math.floor(rng() * 2)
  return rng() < 0.5 ? 1 : 0
}

export function rollEnchantments(itemTier: number, qm: number, rng: Rng = Math.random): any[] {
  const mt = magicTier(itemTier)
  const pool = [...ENCHANTMENTS]
  const out: any[] = []
  for (let n = enchantCount(qm, rng); n > 0 && pool.length; n--) {
    const e = pool.splice(Math.floor(rng() * pool.length), 1)[0]
    out.push({
      id: e.id, name: e.name, tier: mt,
      effects: Object.entries(e.stats).map(([stat, values]: [string, any]) => ({ stat, value: values[mt - 1] })),
    })
  }
  return out
}

const SLOT_POOLS: Record<string, (b: any) => boolean> = {
  'Helmet': b => b.subType === 'Helmet',
  'Armor': b => b.subType === 'Armor',
  'Gloves': b => b.subType === 'Gauntlets',
  'Leggings': b => b.subType === 'Leggings',
  'Boots': b => b.subType === 'Boots',
  'Weapon 1': b => b.type === 'Weapons',
  'Weapon 2': b => b.type === 'Weapons',
  'Spell 1': b => ['Spells', 'BuffSpells', 'OffHands'].includes(b.type),
  'Spell 2': b => ['Spells', 'BuffSpells', 'OffHands'].includes(b.type),
  'Amulet': b => b.subType === 'Amulet',
  'Ring': b => b.subType === 'Ring',
  'Accessory': b => b.subType === 'Amulet' || b.subType === 'Ring',
}
const pick = <T,>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)]

/**
 * Builds the Shadow/Echo item for a shadow special drop.
 * A random equipment slot is the "mother":
 *  - empty slot            -> Tier 1 Shadow for that slot
 *  - Dropper in slot       -> Shadow of the same family (3x weight on the mother's item), same tier or -1
 *  - Shadow/Echo in slot   -> Echo of it: lower tier, 50% quality, enchantments at half power
 */
export function generateShadowItem(p: any, BASE_ITEMS: any[], rng: Rng = Math.random): any | null {
  const slot = pick(Object.keys(SLOT_POOLS), rng)
  const motherId = p.equipment?.[slot]
  const mother = motherId ? (p.inventory || []).find((i: any) => i.instanceId === motherId) : null
  const motherBase = mother ? BASE_ITEMS.find(b => b.id === mother.baseItemId) : null

  if (!mother || !motherBase) {
    const pool = BASE_ITEMS.filter(SLOT_POOLS[slot])
    if (!pool.length) return null
    const qm = 0.75 + rng() * 0.75
    return { instanceId: newId(), baseItemId: pick(pool, rng).id, tier: 1, type: 'Shadow', qualityMultiplier: qm, enchantments: rollEnchantments(1, qm, rng), socketedGems: [] }
  }

  if (mother.type === 'Shadow' || mother.type === 'Echo') {
    const tier = mother.tier > 1 ? 1 + Math.floor(rng() * (mother.tier - 1)) : 1
    const enchantments = (mother.enchantments || []).map((e: any) => ({
      ...e,
      effects: (e.effects || []).map((x: any) => ({ ...x, value: x.value * 0.5 })),
    }))
    return { instanceId: newId(), baseItemId: mother.baseItemId, tier, type: 'Echo', qualityMultiplier: 0.5, enchantments, socketedGems: [] }
  }

  const family = BASE_ITEMS.filter(b => b.type === motherBase.type)
  const weighted = family.flatMap(b => (b.id === motherBase.id ? [b, b, b] : [b]))
  let tier = mother.tier || 1
  if (tier > 1 && rng() < 0.5) tier -= 1
  const qm = 0.75 + rng() * 0.75
  return { instanceId: newId(), baseItemId: pick(weighted, rng).id, tier, type: 'Shadow', qualityMultiplier: qm, enchantments: rollEnchantments(tier, qm, rng), socketedGems: [] }
}

// ─── Soulforge (Geminus.1 soulforgeData.js) ───────────────────────

export const SOULFORGE = {
  CRIT_CHANCE: 0.05,            // baseCriticalSuccessChance
  MAX_INFUSION: 10,             // ascensionMinInfusionLevel (Ascension itself not ported yet)
  INFUSION_GAIN: 0.10,          // +10% base stat per infusion
  INFUSION_CRIT_GAIN: 0.20,     // "Double stat gain" on a critical
  INFUSION_GOLD: 100000,        // infusionBaseCosts.goldBase
  INFUSION_ESSENCE: 50,         // infusionBaseCosts.essenceBase
  INFUSION_COST_MULT: 1.5,      // cost = base x 1.5^level
  SHATTER_BASE: 10,             // shatteringYields.tierEssenceBase (x item tier)
  SHATTER_MULT: { Shadow: 1.0, Echo: 0.5 } as Record<string, number>,
  // Reroll essence cost for tiers 1-20 (the gold part matches the gear tier price)
  REROLL_ESSENCE: [25, 40, 65, 100, 150, 225, 350, 500, 750, 1200, 1800, 2700, 4000, 6000, 9000, 13500, 20000, 30000, 45000, 70000],
}

export function shatterYield(item: any): number {
  return Math.floor(SOULFORGE.SHATTER_BASE * (item?.tier || 1) * (SOULFORGE.SHATTER_MULT[item?.type] ?? 0))
}

export function infusionCost(item: any): { gold: number; essence: number } {
  const m = Math.pow(SOULFORGE.INFUSION_COST_MULT, item?.infusionLevel || 0)
  return { gold: Math.floor(SOULFORGE.INFUSION_GOLD * m), essence: Math.floor(SOULFORGE.INFUSION_ESSENCE * m) }
}

export function rerollCost(item: any): { gold: number; essence: number } {
  const t = Math.max(1, Math.min(20, item?.tier || 1))
  return { gold: tierInfo(t).gold, essence: SOULFORGE.REROLL_ESSENCE[t - 1] ?? 0 }
}

function findItem(p: any, instanceId: string) {
  const idx = (p.inventory || []).findIndex((i: any) => i.instanceId === instanceId)
  if (idx < 0) return { idx, item: null, err: 'Item not found.' }
  return { idx, item: p.inventory[idx], err: null }
}

/** Shadow/Echo -> Essence. 5% critical doubles the yield. */
export function shatterItem(p: any, instanceId: string, rng: Rng = Math.random): ServiceResult {
  const { item, err } = findItem(p, instanceId)
  if (err) return fail(err)
  if (item.type !== 'Shadow' && item.type !== 'Echo') return fail('Only Shadow and Echo items can be shattered.')
  if (Object.values(p.equipment || {}).includes(instanceId)) return fail('Unequip the item first.')
  if ((item.socketedGems || []).length) return fail('Remove socketed gems at the Gemcutter first.')
  const crit = rng() < SOULFORGE.CRIT_CHANCE
  const gain = shatterYield(item) * (crit ? 2 : 1)
  const next = clonePlayer(p)
  next.inventory = next.inventory.filter((i: any) => i.instanceId !== instanceId)
  next.essence = (p.essence || 0) + gain
  return { ok: true, player: next, msg: `${crit ? 'CRITICAL! ' : ''}Shattered for ${gain.toLocaleString()} essence.` }
}

/** Raise a Dropper/Shadow item's base stat by 10% (20% on a critical), up to +10. */
export function infuseItem(p: any, instanceId: string, rng: Rng = Math.random): ServiceResult {
  const { idx, item, err } = findItem(p, instanceId)
  if (err) return fail(err)
  if (item.type === 'Echo') return fail('Echoes cannot be infused.')
  const lvl = item.infusionLevel || 0
  if (lvl >= SOULFORGE.MAX_INFUSION) return fail(`Already at +${SOULFORGE.MAX_INFUSION}.`)
  const cost = infusionCost(item)
  if ((p.gold || 0) < cost.gold || (p.essence || 0) < cost.essence) return fail(`Need ${cost.gold.toLocaleString()} gold and ${cost.essence.toLocaleString()} essence.`)
  const crit = rng() < SOULFORGE.CRIT_CHANCE
  const gain = crit ? SOULFORGE.INFUSION_CRIT_GAIN : SOULFORGE.INFUSION_GAIN
  const next = clonePlayer(p)
  next.gold = (p.gold || 0) - cost.gold
  next.essence = (p.essence || 0) - cost.essence
  next.inventory[idx] = { ...item, infusionLevel: lvl + 1, infusionMult: +((item.infusionMult ?? 1) * (1 + gain)).toFixed(4) }
  return { ok: true, player: next, msg: `${crit ? 'CRITICAL! ' : ''}Infused to +${lvl + 1} (+${gain * 100}% base stat).` }
}

/** Replace one enchantment on a Shadow item with a different one. 5% critical refunds the cost. */
export function rerollItemEnchant(p: any, instanceId: string, enchantIdx: number, rng: Rng = Math.random): ServiceResult {
  const { idx, item, err } = findItem(p, instanceId)
  if (err) return fail(err)
  if (item.type !== 'Shadow') return fail('Only Shadow items can be rerolled.')
  const old = (item.enchantments || [])[enchantIdx]
  if (!old) return fail('Pick an enchantment to reroll.')
  const cost = rerollCost(item)
  if ((p.gold || 0) < cost.gold || (p.essence || 0) < cost.essence) return fail(`Need ${cost.gold.toLocaleString()} gold and ${cost.essence.toLocaleString()} essence.`)
  const have = (item.enchantments || []).map((e: any) => e.id)
  const pool = ENCHANTMENTS.filter(e => !have.includes(e.id))
  const e = (pool.length ? pool : ENCHANTMENTS)[Math.floor(rng() * (pool.length || ENCHANTMENTS.length))]
  const mt = magicTier(item.tier)
  const fresh = { id: e.id, name: e.name, tier: mt, effects: Object.entries(e.stats).map(([stat, values]: [string, any]) => ({ stat, value: values[mt - 1] })) }
  const crit = rng() < SOULFORGE.CRIT_CHANCE
  const next = clonePlayer(p)
  if (!crit) { next.gold = (p.gold || 0) - cost.gold; next.essence = (p.essence || 0) - cost.essence }
  next.inventory[idx] = { ...item, enchantments: item.enchantments.map((x: any, i: number) => (i === enchantIdx ? fresh : x)) }
  return { ok: true, player: next, msg: `${crit ? 'CRITICAL! Cost refunded. ' : ''}${old.name} → ${e.name}.` }
}

// ─── Gem salvage + Crucible (Geminus.1 gem_cutter GEM_CRUCIBLE) ───

/** Gem dust per salvaged gem (min, max) and the level needed to mass-salvage each grade. God Editor → Gem Salvage. */
export const SALVAGE = {
  DUST: { 1: [1, 4], 2: [2, 8], 3: [3, 12], 4: [4, 16], 5: [5, 20], 6: [6, 24], 7: [7, 28], 8: [9, 36], 9: [10, 40] } as Record<number, [number, number]>,
  MASS_LEVEL: { 1: 1, 2: 1, 3: 300, 4: 450, 5: 1500, 6: 5000, 7: 15000, 8: 50000, 9: 200000 } as Record<number, number>,
}
const SALVAGE_DUST = SALVAGE.DUST
export const MASS_SALVAGE_LEVEL = SALVAGE.MASS_LEVEL
export const crucibleCost = (grade: number) => ECONOMY.CRUCIBLE_DUST_PER_GRADE * grade

export function salvageRange(grade: number): [number, number] {
  return SALVAGE_DUST[grade] || SALVAGE_DUST[1]
}

function rollDust(grade: number, rng: Rng): number {
  const [lo, hi] = salvageRange(grade)
  return lo + Math.floor(rng() * (hi - lo + 1))
}

/** Salvage one gem (by pouch index) or every gem of a grade (all=true, level gated) into Gem Dust. */
export function salvageGems(p: any, id: string, grade: number, all = false, rng: Rng = Math.random): ServiceResult {
  if (all && (p.level || 1) < (MASS_SALVAGE_LEVEL[grade] ?? 1)) return fail(`Mass salvage of G${grade} requires level ${MASS_SALVAGE_LEVEL[grade].toLocaleString()}.`)
  const k = gemKey(id)
  const hits: number[] = []
  ;(p.gems || []).forEach((g: any, i: number) => {
    if ((g.grade || 1) === grade && (all || gemKey(g.id) === k) && (all || hits.length === 0)) hits.push(i)
  })
  if (!hits.length) return fail('No matching gems.')
  let dust = 0
  for (let n = 0; n < hits.length; n++) dust += rollDust(grade, rng)
  const next = clonePlayer(p)
  next.gems = next.gems.filter((_: any, i: number) => !hits.includes(i))
  next.gemDust = (p.gemDust || 0) + dust
  return { ok: true, player: next, msg: `Salvaged ${hits.length} gem${hits.length > 1 ? 's' : ''} for ${dust.toLocaleString()} Gem Dust.` }
}

/** Crucible: two gems of the same grade + dust -> one random standard gem of that grade. */
export function crucibleFuse(p: any, idxA: number, idxB: number, rng: Rng = Math.random): ServiceResult {
  const a = p.gems?.[idxA], b = p.gems?.[idxB]
  if (!a || !b || idxA === idxB) return fail('Pick two different gems.')
  const grade = a.grade || 1
  if ((b.grade || 1) !== grade) return fail('Both gems must be the same grade.')
  const cost = crucibleCost(grade)
  if ((p.gemDust || 0) < cost) return fail(`Need ${cost} Gem Dust.`)
  const id = rollGemId(rng)
  const next = clonePlayer(p)
  next.gems = next.gems.filter((_: any, i: number) => i !== idxA && i !== idxB)
  next.gems.push({ id, grade })
  next.gemDust = (p.gemDust || 0) - cost
  return { ok: true, player: next, msg: `The Crucible yields ${gemInfo(id).name} G${grade}!` }
}

// ─── Display helpers ──────────────────────────────────────────────

export function itemDisplayName(item: any, base: any): string {
  const name = base?.name || 'Item'
  const plus = item?.infusionLevel ? ` +${item.infusionLevel}` : ''
  if (item?.type === 'Shadow') return `Shadow of ${name}${plus}`
  if (item?.type === 'Echo') return `Echo of ${name}${plus}`
  return name + plus
}

const PCT_KEYS = ['ACPercent', 'WCPercent', 'SCPercent', 'DEXPercent', 'STRPercent', 'WISPercent', 'NTLPercent', 'VITPercent']

export function effectText(stat: string, value: number): string {
  if (PCT_KEYS.includes(stat)) return `${stat.replace('Percent', '')} +${+(value * 100).toFixed(2)}%`
  if (stat.startsWith('-Enemy')) return `Enemy ${stat.slice(6)} -${+value.toFixed(2)}%`
  return `${stat} +${+value.toFixed(2)}%`
}

export function enchantmentLines(item: any): string[] {
  return (item?.enchantments || []).map((e: any) =>
    `${e.name}: ${(e.effects || []).map((x: any) => effectText(x.stat, x.value)).join(', ')}`)
}

// ─── Zone monsters (Geminus.1 Monster Forge) ──────────────────────

const ZONES: Record<string, any> = ZONES_DATA as any
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10 }

export function romanToInt(r: string): number {
  let n = 0
  const s = String(r || 'I').toUpperCase()
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]] || 0, next = ROMAN[s[i + 1]] || 0
    n += v < next ? -v : v
  }
  return Math.max(1, n)
}

export function isStarterZone(zoneId: string): boolean {
  return ZONES[zoneId]?.type === 'starter'
}

/**
 * Monster stats for non-starter zones, ported from Geminus.1 DevManager.forgeEntireBestiary().
 * Uses the live GDD damage formula (DAMAGE_CONST, AC_REDUCTION), the zone's entry level and gear
 * tier from zones.json, and the zone type's hpDef / xp / gold multipliers.
 * Minions: two floor-geared hits to kill, deal 1/10 of a level-appropriate player's HP.
 * Bosses/Elites: five ceiling-geared hits, deal 1/4 of that HP.
 */
export const FORGE = {
  FLOOR_WC: 26, FLOOR_AC: 27,          // previous-tier player gear the minions are tuned against
  CEIL_WC: 52, CEIL_AC: 55,            // current-tier player gear the bosses are tuned against
  MINION_DEF: 40, BOSS_DEF: 100,       // monster defence at tier 1 (scales with gear tier)
  MINION_HITS: 2, BOSS_HITS: 5,        // hits to kill
  MINION_HP_MIN: 20, BOSS_HP_MIN: 100,
  MINION_DMG_SHARE: 10, BOSS_DMG_SHARE: 4, // monster hit = player max HP / this
  PLAYER_VIT_PER_LEVEL: 12,            // assumed VIT per level for the HP target
  XP_PER_LEVEL: 10, GOLD_PER_LEVEL: 5, // reward = zone level x this (bosses/elites full, minions half)
}

export function forgeZoneMonsters(zoneId: string): any[] {
  const zone = ZONES[zoneId]
  const slots: any[] = (ZONE_MONSTERS as any)[zoneId] || []
  if (!zone) return []
  const K = GDD.DAMAGE_CONST, ACR = GDD.AC_REDUCTION
  const level = Math.max(1, zone.level || 1)
  const gear = romanToInt(zone.gear)
  const prevTier = Math.max(0, gear - 1)
  const prevMult = prevTier === 0 ? 0.5 : Math.pow(GDD.CLASSVALUE_GROWTH, prevTier - 1)
  const currMult = Math.pow(GDD.CLASSVALUE_GROWTH, gear - 1)

  const F = FORGE
  const floorWC = F.FLOOR_WC * prevMult, floorAC = F.FLOOR_AC * prevMult
  const ceilWC = F.CEIL_WC * currMult, ceilAC = F.CEIL_AC * currMult
  const minionDef = Math.max(5, Math.floor(F.MINION_DEF * prevMult))
  const bossDef = Math.max(10, Math.floor(F.BOSS_DEF * currMult))
  const minionHP = Math.max(F.MINION_HP_MIN, Math.max(1, Math.floor((K * floorWC) / minionDef)) * F.MINION_HITS)
  const bossHP = Math.max(F.BOSS_HP_MIN, Math.max(1, Math.floor((K * ceilWC) / bossDef)) * F.BOSS_HITS)
  const playerMaxHP = GDD.MAX_HP_BASE + F.PLAYER_VIT_PER_LEVEL * level * GDD.MAX_HP_PER_VIT
  const minionAtk = Math.max(2, Math.floor(((playerMaxHP / F.MINION_DMG_SHARE) * Math.max(1, floorAC * ACR)) / K))
  const bossAtk = Math.max(5, Math.floor(((playerMaxHP / F.BOSS_DMG_SHARE) * Math.max(1, ceilAC * ACR)) / K))

  const rules = ZONE_TYPES[zone.type] || ZONE_TYPES.xp
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const present = slots.map((m, i) => (m ? { ...m, slot: i + 1 } : null)).filter(Boolean) as any[]
  return present.map((m, idx) => {
    const isBoss = m.rank === 'Boss'
    const t = isBoss || m.rank === 'Elite' ? 1 : present.length > 1 ? idx / (present.length - 1) : 1
    return {
      id: `${zoneId}:${String(m.slot).padStart(2, '0')}`,
      name: m.name,
      rank: m.rank,
      isBoss,
      hp: Math.max(1, Math.floor(lerp(minionHP, bossHP, t) * rules.hpDef)),
      atk: Math.floor(lerp(minionAtk, bossAtk, t)),
      def: Math.max(1, Math.floor(lerp(minionDef, bossDef, t) * rules.hpDef)),
      xp: Math.floor(Math.max(1, level * F.XP_PER_LEVEL * (0.5 + 0.5 * t)) * rules.xp),
      gold: Math.floor(Math.max(1, level * F.GOLD_PER_LEVEL * (0.5 + 0.5 * t)) * rules.gold),
    }
  })
}

/**
 * Monsters for a zone. Starter zones (Z01-Z24) keep the balanced starter list from
 * bestiary.json with Geminus.1's per-zone names; other zones are forged.
 */
export function zoneTargets(zoneId: string, starter: any[]): any[] {
  if (!ZONES[zoneId] || isStarterZone(zoneId)) {
    const slots: any[] = (ZONE_MONSTERS as any)[zoneId] || []
    return starter.map(m => {
      const slot = m.id === 'E10*' ? 10 : parseInt(String(m.id).replace(/\D/g, ''), 10) - 1
      return slots[slot] ? { ...m, name: slots[slot].name } : m
    })
  }
  const forged = forgeZoneMonsters(zoneId)
  return forged.length ? forged : starter
}

// ─── Zone travel (Exits + Teleporter) ─────────────────────────────

export const TELEPORT_COST = (zoneId: string) => ECONOMY.TELEPORT_BASE + (ZONES[zoneId]?.level || 1) * ECONOMY.TELEPORT_PER_LEVEL

export function zoneIds(): string[] {
  return Object.keys(ZONES).sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10))
}

export function zoneInfo(zoneId: string): any {
  return ZONES[zoneId] || null
}

export function homeZone(raceKey: string): string {
  const hit = Object.entries(STARTER_RACE).find(([, r]) => r === raceKey)
  return hit ? hit[0] : 'Z01'
}

/** Exits walk to the neighbouring zones (and home), for free. */
export function exitDestinations(zoneId: string, raceKey: string): string[] {
  const n = parseInt(zoneId.slice(1), 10)
  const ids = [n - 1, n + 1].map(k => 'Z' + String(k).padStart(2, '0')).filter(id => ZONES[id])
  const home = homeZone(raceKey)
  if (home !== zoneId && !ids.includes(home)) ids.push(home)
  return ids
}

export function canEnterZone(p: any, zoneId: string): boolean {
  return (p.level || 1) >= (ZONES[zoneId]?.level || 1)
}

export function travelTo(p: any, zoneId: string, cost = 0): ServiceResult {
  const zone = ZONES[zoneId]
  if (!zone) return fail('Unknown zone.')
  if (zoneId === p.pos?.zoneId) return fail('You are already here.')
  if (!canEnterZone(p, zoneId)) return fail(`${zone.name} requires level ${zone.level.toLocaleString()}.`)
  if ((p.gold || 0) < cost) return fail(`Travel costs ${cost.toLocaleString()} gold.`)
  // Arrive at the Sanctuary (the stamp's spawn), same cell in Text and Graphic mode
  const [x, y] = getStampById(zone.stamp).spawn
  return {
    ok: true,
    player: { ...p, gold: (p.gold || 0) - cost, pos: { zoneId, x, y, v: LATTICE_VERSION } },
    msg: `Arrived at ${zoneId}: ${zone.name}${cost ? ` (-${cost.toLocaleString()} gold)` : ''}.`,
  }
}

// ─── ADDED FROM JOSH ──────────────────────────────────────────────
// Josh's MerchantManager.js (buyback), VaultManager.js. Safety Lock, Upgrade Advisor and
// Artisan XP are not in Josh's files; they follow GDD 3.5 / 3.7 / Appendix N.

// ADDED FROM JOSH
/** GDD 3.7: buyback recovers the last 5 sold items at sold price. Josh's JS kept 10; GDD says 5. */
export const BUYBACK_LIMIT = 5

// ADDED FROM JOSH
/** Sell + record in p.buyback (newest first). Respects Safety Lock. */
export function sellItemWithBuyback(p: any, instanceId: string): ServiceResult {
  const item = (p.inventory || []).find((i: any) => i.instanceId === instanceId)
  if (item && isItemLocked(p, item)) return fail('Item is locked.')
  const res = sellItem(p, instanceId)
  if (!res.ok) return res
  const price = sellPrice(item)
  const buyback = [{ ...item, buybackPrice: price }, ...(p.buyback || [])].slice(0, BUYBACK_LIMIT)
  return { ...res, player: { ...res.player, buyback } }
}

// ADDED FROM JOSH
export function buybackItem(p: any, index: number): ServiceResult {
  const entry = (p.buyback || [])[index]
  if (!entry) return fail('Item not found.')
  if ((p.gold || 0) < entry.buybackPrice) return fail('Insufficient gold for buyback.')
  if ((p.inventory || []).length >= ECONOMY.INVENTORY_CAP) return fail('Inventory is full.')
  const { buybackPrice, ...clean } = entry
  const next = clonePlayer(p)
  next.gold = (p.gold || 0) - buybackPrice
  next.inventory.push(clean)
  next.buyback = (p.buyback || []).filter((_: any, i: number) => i !== index)
  return { ok: true, player: next, msg: `Recovered ${clean.name || 'item'}.` }
}

// ADDED FROM JOSH
/** GDD 3.7: players lock items against sale; equipped items lock automatically. */
export function isItemLocked(p: any, item: any): boolean {
  return !!item?.locked || Object.values(p.equipment || {}).includes(item?.instanceId)
}

// ADDED FROM JOSH
export function toggleItemLock(p: any, instanceId: string): ServiceResult {
  const item = (p.inventory || []).find((i: any) => i.instanceId === instanceId)
  if (!item) return fail('Item not found.')
  const next = clonePlayer(p)
  next.inventory = next.inventory.map((i: any) => (i.instanceId === instanceId ? { ...i, locked: !i.locked } : i))
  return { ok: true, player: next, msg: item.locked ? 'Item unlocked.' : 'Item locked.' }
}

// ADDED FROM JOSH
/** GDD 3.7: per equipped slot, the best affordable, level-eligible tier above the current one. */
export function upgradeAdvisor(p: any, BASE_ITEMS: any[]): { slot: string; baseItemId: string; tier: number; cost: number }[] {
  const out: { slot: string; baseItemId: string; tier: number; cost: number }[] = []
  for (const [slot, instId] of Object.entries(p.equipment || {})) {
    const cur = (p.inventory || []).find((i: any) => i.instanceId === instId)
    if (!cur || cur.type !== 'Dropper') continue
    const base = BASE_ITEMS.find(b => b.id === cur.baseItemId)
    if (!base) continue
    const better = DROPPER_TIERS
      .filter(t => t.tier > (cur.tier || 1) && (p.level || 1) >= t.levelReq && (p.gold || 0) >= t.gold)
      .sort((a, b) => b.tier - a.tier)[0]
    if (better) out.push({ slot, baseItemId: base.id, tier: better.tier, cost: better.gold })
  }
  return out
}

// ADDED FROM JOSH
/** GDD Appendix N: XP Required for Level N = 100 * 1.5^(N-1). */
export const ARTISAN_XP = { socket: 10, unsocket: 5, fuse: 25, crucible: 25, salvage: 2 } as const
export const artisanXpRequired = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1))

// ADDED FROM JOSH
/** Adds Artisan XP (permanent, account-wide) and levels up. Returns a new player. */
export function addArtisanXp(p: any, action: keyof typeof ARTISAN_XP): any {
  let level = p.artisanLevel || 1
  let xp = (p.artisanXp || 0) + ARTISAN_XP[action]
  while (xp >= artisanXpRequired(level)) {
    xp -= artisanXpRequired(level)
    level++
  }
  return { ...p, artisanLevel: level, artisanXp: xp }
}
