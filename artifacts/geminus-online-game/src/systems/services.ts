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
import { DROPPER_TIERS, GEM_GATES } from '../gdd.js'

export type ServiceResult = { ok: true; player: any; msg: string } | { ok: false; msg: string }
type Rng = () => number

export const GEM_POUCH_CAP = 200
export const INVENTORY_CAP = 200
export const MAX_GEM_GRADE = 9
export const UNSOCKET_COST = 250                       // Geminus.1 gem_cutter GDD.UNSOCKET_COST
export const SELL_RATE = 0.25                          // Geminus.1 MerchantManager: sell for 25%
export const fuseCost = (grade: number) => grade * grade * 10000 // Geminus.1 gem_cutter fusingCost

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
  if ((p.gold || 0) < UNSOCKET_COST) return fail(`Unsocketing costs ${UNSOCKET_COST} gold.`)
  if ((p.gems || []).length >= GEM_POUCH_CAP) return fail('Gem pouch is full.')
  const next = clonePlayer(p)
  next.gold = (p.gold || 0) - UNSOCKET_COST
  next.inventory[idx] = { ...item, socketedGems: item.socketedGems.filter((_: any, i: number) => i !== socketIdx) }
  next.gems.push({ id: gemKey(gem.id), grade: gem.grade || 1 })
  return { ok: true, player: next, msg: `${gemInfo(gem.id).name} returned to pouch (-${UNSOCKET_COST} gold).` }
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
  if ((p.inventory || []).length >= INVENTORY_CAP) return fail('Inventory is full.')
  const next = clonePlayer(p)
  next.gold = (p.gold || 0) - t.gold
  next.inventory.push({ instanceId: newId(), baseItemId, tier, type: 'Dropper', socketedGems: [] })
  return { ok: true, player: next, msg: `Purchased ${base.name} (T${tier}).` }
}

export function sellPrice(item: any): number {
  return Math.floor(tierInfo(item?.tier || 1).gold * SELL_RATE * (item?.qualityMultiplier ?? 1))
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

// ─── Display helpers ──────────────────────────────────────────────

export function itemDisplayName(item: any, base: any): string {
  const name = base?.name || 'Item'
  if (item?.type === 'Shadow') return `Shadow of ${name}`
  if (item?.type === 'Echo') return `Echo of ${name}`
  return name
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

// ─── Zone monsters ────────────────────────────────────────────────

/** Starter-zone monster list with Geminus.1's per-zone names; stats unchanged. */
export function zoneTargets(zoneId: string, starter: any[]): any[] {
  const names = (ZONE_MONSTERS as any)[zoneId]
  if (!names) return starter
  return starter.map(m => (names[m.id] ? { ...m, name: names[m.id] } : m))
}
