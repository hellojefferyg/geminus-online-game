/**
 * GEMINUS LIVE ENGINE GDD
 * Edition 3.4 working copy — 26 September 2026
 * Source of truth for client + API. Import this. Do not fork formulas in App.
 *
 * LIVE:
 *   Chapter 0 combat (28 Mar 2026)
 *   1.3 / 1.3.1 / 6.3 derived stats
 *   1.4 XP + AP
 *   ZONE-SPINE-GEM-RANGES-v1 (25 Sep 2026)
 *
 * SUPERSEDED — not in this file:
 *   MonsterDamage = ATK - (AC * 0.5)
 *   Cast-then-Fight as two turns
 *   Starter gems G1+G2
 *   Flat shadow 1/150
 */
import GEMS_DATA from './data/gems.json'

export const GDD_VERSION = '3.4-live-2026-09-26'

// ─── Chapter 0 constants ─────────────────────────────────────────
export const GDD = Object.freeze({
  XP_BASE: 200,
  XP_GROWTH: 1.12,
  AP_PER_LEVEL: 40,
  DAMAGE_CONST: 90,
  AC_REDUCTION: 0.5,
  MAX_HP_BASE: 100,
  MAX_HP_PER_VIT: 10,
  AC_VIT_SCALE: 0.0075,
  CLASS_STAT_SCALE: 0.0055,
  HIT_BASE: 90,
  HIT_PER_FOCUS: 0.05,
  CRIT_BASE: 5,
  CRIT_PER_FOCUS: 0.01,
  SPELLSTRIKE_MOD: 0.8,
  DEFAULT_CRIT_MULT: 1.5,
  IN_COMBAT_REGEN_PENALTY: 0.5,
  REGEN_BASE: 5,
  REGEN_PER_LEVEL: 1.5,
  CLASSVALUE_BASE: 13,
  CLASSVALUE_GROWTH: 1.22,
  INITIAL_AP: 40,
  GEM_POUCH_CAP: 200,
  GEM_STEP_UP: 0.33,
  TITLED_CHANCE: 1 / 75,
  ALIGNMENT_TITLE_CHANCE: 0.4,
})

export function xpToLevel(level) {
  return Math.floor(GDD.XP_BASE * Math.pow(GDD.XP_GROWTH, level))
}

export function classValue(tier) {
  return GDD.CLASSVALUE_BASE * Math.pow(GDD.CLASSVALUE_GROWTH, Math.max(1, tier) - 1)
}

export function getLevelBank(level) {
  return 1 + Math.floor(level / 50)
}

export function getBankedLevels(ap) {
  return Math.floor((ap || 0) / GDD.AP_PER_LEVEL)
}

export function canSpendAP(ap, level) {
  return (ap || 0) >= GDD.AP_PER_LEVEL && (level || 1) > 1
}

// ─── Races (24) + 6.3 archetype gates ────────────────────────────
export const races = Object.freeze({
  human:      { raceName: 'Human',      archetype: 'True Fighter',   sub: null,             primaryStat: 'DEX', weapons: 'Sword/Sword' },
  dragonborn: { raceName: 'Dragonborn', archetype: 'True Fighter',   sub: null,             primaryStat: 'DEX', weapons: 'Sword/Sword' },
  orc:        { raceName: 'Orc',        archetype: 'True Fighter',   sub: null,             primaryStat: 'DEX', weapons: 'Mace/Mace' },
  werewolf:   { raceName: 'Werewolf',   archetype: 'True Fighter',   sub: null,             primaryStat: 'DEX', weapons: 'Claw/Claw' },
  minotaur:   { raceName: 'Minotaur',   archetype: 'True Fighter',   sub: null,             primaryStat: 'DEX', weapons: 'Axe/Axe' },
  troll:      { raceName: 'Troll',      archetype: 'True Fighter',   sub: 'VIT',             primaryStat: 'VIT', weapons: 'Staff/Staff' },
  hobbit:     { raceName: 'Hobbit',     archetype: 'True Fighter',   sub: null,             primaryStat: 'DEX', weapons: 'Dagger/Dagger' },
  centaur:    { raceName: 'Centaur',    archetype: 'True Fighter',   sub: null,             primaryStat: 'DEX', weapons: 'Bow/Arrow' },
  phoenix:    { raceName: 'Phoenix',    archetype: 'True Caster',    sub: null,             primaryStat: 'WIS', weapons: 'Fire/Fire' },
  tiefling:   { raceName: 'Tiefling',   archetype: 'True Caster',    sub: null,             primaryStat: 'WIS', weapons: 'Fire/Fire' },
  mermaid:    { raceName: 'Mermaid',    archetype: 'True Caster',    sub: null,             primaryStat: 'WIS', weapons: 'Cold/Cold' },
  gnome:      { raceName: 'Gnome',      archetype: 'True Caster',    sub: null,             primaryStat: 'WIS', weapons: 'Arcane/Arcane' },
  griffin:    { raceName: 'Griffin',    archetype: 'True Caster',    sub: null,             primaryStat: 'WIS', weapons: 'Air/Air' },
  vampire:    { raceName: 'Vampire',    archetype: 'True Caster',    sub: 'VIT',             primaryStat: 'VIT', weapons: 'Death/Death' },
  elf:        { raceName: 'Elf',        archetype: 'True Caster',    sub: null,             primaryStat: 'WIS', weapons: 'Arcane/Arcane' },
  babayaga:   { raceName: 'Baba Yaga',  archetype: 'True Caster',    sub: null,             primaryStat: 'WIS', weapons: 'Death/Death' },
  angel:      { raceName: 'Angel',      archetype: 'Martial Hybrid', sub: 'Martial',        primaryStat: 'DEX', weapons: 'Sword/Arcane' },
  aasimar:    { raceName: 'Aasimar',    archetype: 'Martial Hybrid', sub: 'Martial',        primaryStat: 'DEX', weapons: 'Mace/Arcane' },
  banshee:    { raceName: 'Banshee',    archetype: 'Martial Hybrid', sub: 'Martial',        primaryStat: 'DEX', weapons: 'Dagger/Arcane' },
  halfling:   { raceName: 'Halfling',   archetype: 'Martial Hybrid', sub: 'Martial',        primaryStat: 'DEX', weapons: 'Staff/Arcane' },
  dwarf:      { raceName: 'Dwarf',      archetype: 'Mystic Hybrid',  sub: 'Mystic',         primaryStat: 'WIS', weapons: 'Axe/Fire' },
  demon:      { raceName: 'Demon',      archetype: 'Mystic Hybrid',  sub: 'Mystic',         primaryStat: 'WIS', weapons: 'Staff/Fire' },
  draugr:     { raceName: 'Draugr',     archetype: 'Mystic Hybrid',  sub: 'Mystic',         primaryStat: 'WIS', weapons: 'Staff/Death' },
  unicorn:    { raceName: 'Unicorn',    archetype: 'Mystic Hybrid',  sub: 'Mystic',         primaryStat: 'WIS', weapons: 'Sword/Death' },
})

export function raceOf(key) {
  return races[key] || races.human
}

export function isHybrid(rd) {
  return rd.archetype === 'Martial Hybrid' || rd.archetype === 'Mystic Hybrid'
}

export function combatAction(rd) {
  if (isHybrid(rd)) return 'Spellstrike'
  if (rd.archetype === 'True Caster') return 'Cast'
  return 'Fight'
}

/** Focus stat used for hit/crit and (when applicable) WC/SC. */
export function focusStat(rd) {
  if (rd.primaryStat === 'VIT') return 'VIT'
  if (rd.archetype === 'True Caster' || rd.archetype === 'Mystic Hybrid') return 'WIS'
  return 'DEX'
}

export function racialPowerSource(rd) {
  return focusStat(rd)
}

export function racialPower(p) {
  const rd = raceOf(p.race)
  const s = p.baseStats || {}
  const src = racialPowerSource(rd)
  let raw
  if (isHybrid(rd)) {
    raw = (s.DEX || 0) * 0.05 + (s.WIS || 0) * 0.05
  } else {
    raw = (s[src] || 0) * 0.10
  }
  const lvl = p.level || 1
  const rung = lvl >= 150000 ? 3 : lvl >= 50000 ? 2 : lvl >= 101 ? 1 : 0
  return { value: raw * rung, rung, source: src }
}

// ─── Temporary AP weights (Dwarf printed; others family defaults) ─
export const AP_WEIGHTS = Object.freeze({
  'True Fighter':   { STR: 10, DEX: 18, VIT: 12, NTL: 8,  WIS: 8 },
  'True Caster':    { STR: 8,  DEX: 8,  VIT: 12, NTL: 10, WIS: 18 },
  'Martial Hybrid': { STR: 10, DEX: 18, VIT: 12, NTL: 8,  WIS: 8 },
  'Mystic Hybrid':  { STR: 8,  DEX: 8,  VIT: 12, NTL: 10, WIS: 18 },
  Troll:            { STR: 10, DEX: 8,  VIT: 18, NTL: 8,  WIS: 8 },
  Vampire:          { STR: 8,  DEX: 8,  VIT: 18, NTL: 10, WIS: 8 },
  dwarf:            { STR: 12, DEX: 8,  VIT: 10, NTL: 12, WIS: 18 },
})

export const STAT_KEYS = Object.freeze(['STR', 'DEX', 'VIT', 'NTL', 'WIS'])
export const OFF_PAIRS = Object.freeze({ STR: 'NTL', NTL: 'STR', DEX: 'WIS', WIS: 'DEX' })

export function apWeightsFor(raceKey) {
  if (raceKey === 'dwarf') return { ...AP_WEIGHTS.dwarf }
  if (raceKey === 'troll') return { ...AP_WEIGHTS.Troll }
  if (raceKey === 'vampire') return { ...AP_WEIGHTS.Vampire }
  const rd = raceOf(raceKey)
  return { ...(AP_WEIGHTS[rd.archetype] || AP_WEIGHTS['True Fighter']) }
}

export function mainStatFor(rd) {
  if (rd.primaryStat === 'VIT') return 'VIT'
  if (rd.archetype === 'True Caster' || rd.archetype === 'Mystic Hybrid') return 'WIS'
  return 'DEX'
}

/**
 * Spend one 40-point bank per GDD 1.4.2.
 * clicked = 'STR'|'DEX'|'VIT'|'NTL'|'WIS'
 */
export function spendAttributeBank(baseStats, raceKey, clicked) {
  const weights = apWeightsFor(raceKey)
  const totalW = STAT_KEYS.reduce((n, k) => n + weights[k], 0)
  const raw = {}
  for (const k of STAT_KEYS) raw[k] = Math.floor(GDD.AP_PER_LEVEL * (weights[k] / totalW))

  const rd = raceOf(raceKey)
  const main = mainStatFor(rd)
  const next = { ...baseStats }

  if (clicked === 'VIT' && main !== 'VIT') {
    const bonus = raw.VIT * 0.5
    raw.VIT = raw.VIT + bonus
    raw[main] = Math.max(0, raw[main] - bonus)
  } else if (clicked !== main && OFF_PAIRS[clicked]) {
    const pair = OFF_PAIRS[clicked]
    const a = raw[clicked]
    const b = raw[pair]
    raw[clicked] = b * 0.75
    raw[pair] = a
  }

  for (const k of STAT_KEYS) next[k] = (next[k] || 0) + raw[k]
  return next
}

export function getAttributeFocusOrder(raceKey) {
  const rd = raceOf(raceKey)
  const primary = rd.primaryStat
  return [...STAT_KEYS.filter(s => s !== primary), primary]
}

// ─── Slot proportions (Appendix J1) ──────────────────────────────
export const SLOT_MODS = Object.freeze({
  Weapon: { prop: 1.0, stat: 'WC' },
  Sword: { prop: 1.0, stat: 'WC' },
  Axe: { prop: 1.0, stat: 'WC' },
  Staff: { prop: 1.0, stat: 'WC' },
  Spell: { prop: 1.0, stat: 'SC' },
  Fire: { prop: 1.0, stat: 'SC' },
  Air: { prop: 1.0, stat: 'SC' },
  Death: { prop: 1.0, stat: 'SC' },
  Armor: { prop: 1.0, stat: 'AC' },
  Helmet: { prop: 0.75, stat: 'AC' },
  Boots: { prop: 0.75, stat: 'AC' },
  Leggings: { prop: 0.50, stat: 'AC', hitBonus: 0.10 },
  Gauntlets: { prop: 0.50, stat: 'AC', classBonus: 0.15 },
  Gloves: { prop: 0.50, stat: 'AC', classBonus: 0.15 },
  OffHand: { prop: 0.25, stat: 'SC' },
  BuffSpell: { prop: 0.25, stat: 'WC' },
  Amulet: { prop: 0, stat: null },
  Ring: { prop: 0, stat: null },
  Accessory: { prop: 0, stat: null },
  Rune: { prop: 0, stat: null },
})

export const DROPPER_TIERS = Object.freeze([
  { tier: 1,  levelReq: 1,      gold: 50000,        cv: 13.00 },
  { tier: 2,  levelReq: 1,      gold: 87500,        cv: 15.86 },
  { tier: 3,  levelReq: 100,    gold: 153125,       cv: 19.35 },
  { tier: 4,  levelReq: 135,    gold: 267968,       cv: 23.61 },
  { tier: 5,  levelReq: 184,    gold: 468945,       cv: 28.80 },
  { tier: 6,  levelReq: 253,    gold: 820654,       cv: 35.14 },
  { tier: 7,  levelReq: 386,    gold: 1436145,      cv: 42.87 },
  { tier: 8,  levelReq: 1000,   gold: 2513253,      cv: 52.30 },
  { tier: 9,  levelReq: 3571,   gold: 4398193,      cv: 63.81 },
  { tier: 10, levelReq: 6143,   gold: 7696838,      cv: 77.85 },
  { tier: 11, levelReq: 8714,   gold: 13469467,     cv: 94.97 },
  { tier: 12, levelReq: 17272,  gold: 23571567,     cv: 115.87 },
  { tier: 13, levelReq: 28180,  gold: 41250242,     cv: 141.36 },
  { tier: 14, levelReq: 39088,  gold: 72187924,     cv: 172.46 },
  { tier: 15, levelReq: 50000,  gold: 126328867,    cv: 210.40 },
  { tier: 16, levelReq: 83333,  gold: 221075517,    cv: 256.69 },
  { tier: 17, levelReq: 127777, gold: 386882155,    cv: 313.16 },
  { tier: 18, levelReq: 172222, gold: 677043771,    cv: 382.06 },
  { tier: 19, levelReq: 216666, gold: 1184826599,   cv: 466.11 },
  { tier: 20, levelReq: 400000, gold: 2073446549,   cv: 568.65 },
])

export const GEM_GATES = Object.freeze({
  1: 1, 2: 100, 3: 253, 4: 1000, 5: 6143, 6: 13636, 7: 35452, 8: 83333, 9: 172222,
})

export const EQUIP_SLOTS_BY_ARCHETYPE = Object.freeze({
  'True Fighter': [
    'Helmet', 'Weapon 1', 'Gloves', 'Weapon 2',
    'Armor', 'Buff Spell 1', 'Leggings', 'Buff Spell 2',
    'Boots', 'Accessory', 'Amulet', 'Ring',
  ],
  'True Caster': [
    'Helmet', 'Spell 1', 'Gloves', 'Spell 2',
    'Armor', 'Off-Hand 1', 'Leggings', 'Off-Hand 2',
    'Boots', 'Accessory', 'Amulet', 'Ring',
  ],
  'Martial Hybrid': [
    'Helmet', 'Weapon 1', 'Gloves', 'Weapon 2',
    'Armor', 'Spell 1', 'Leggings', 'Spell 2',
    'Boots', 'Accessory', 'Amulet', 'Ring',
  ],
  'Mystic Hybrid': [
    'Helmet', 'Weapon 1', 'Gloves', 'Weapon 2',
    'Armor', 'Spell 1', 'Leggings', 'Spell 2',
    'Boots', 'Accessory', 'Amulet', 'Ring',
  ],
})

// ─── Derived stats ───────────────────────────────────────────────
export function sumGear(p, BASE_ITEMS = []) {
  let ac = 0, wc = 0, sc = 0, hitBonus = 0, classBonus = 0
  const inv = Array.isArray(p.inventory) ? p.inventory : []
  const eq = p.equipment && typeof p.equipment === 'object' ? p.equipment : {}
  for (const slotName of Object.keys(eq)) {
    const iid = eq[slotName]
    if (!iid) continue
    const item = inv.find(i => i.instanceId === iid)
    if (!item) continue
    const base = BASE_ITEMS.find(b => b.id === item.baseItemId)
    if (!base) continue
    const mod = SLOT_MODS[base.subType] || SLOT_MODS[base.type] || { prop: 0.8, stat: 'AC' }
    const tier = DROPPER_TIERS.find(t => t.tier === item.tier) || DROPPER_TIERS[0]
    const val = (item.cv != null ? item.cv : tier.cv) * (mod.prop || 0)
    if (mod.stat === 'AC') ac += val
    if (mod.stat === 'WC') wc += val
    if (mod.stat === 'SC') sc += val
    if (mod.hitBonus) hitBonus += mod.hitBonus
    if (mod.classBonus) classBonus += mod.classBonus
  }
  return { ac, wc, sc, hitBonus, classBonus }
}

/**
 * GEMINUS -- Updated calcDerived
 * Replace the existing calcDerived function in gdd.js with this one.
 *
 * Changes from previous version:
 * 1. Hybrid items contribute both WC and SC at 75% (cv * 0.75 each)
 * 2. qualityMultiplier (QM) applied to item base stat
 * 3. Enchantments on shadow items applied (flat stat adds)
 * 4. Socketed gems applied per item -- WC/SC/AC flat adds + stat bonuses
 * 5. Leggings +10% hit, Gauntlets +15% WC/SC fully wired
 */



// ─── Gem lookup helper ────────────────────────────────────────
// Finds a gem definition by id key (e.g. 'warstone', 'warheart')
function getGemDef(gemId) {
  const id = (gemId || '').toLowerCase().replace(/[-_\s]/g, '')
  return (
    GEMS_DATA.standard[id] ||
    GEMS_DATA.fusion[id] ||
    null
  )
}

// ─── Apply gem bonuses to a running totals object ─────────────
function applyGemBonuses(gem, totals) {
  if (!gem || !gem.id) return
  const gradeKey = String(gem.grade || 1)
  const def = getGemDef(gem.id)
  if (!def) return

  // Standard gem -- single effect
  if (def.grades) {
    const val = def.grades[gradeKey]
    if (val === undefined) return
    applyEffect(def.effect, val, totals)
  }

  // Fusion gem -- multiple effects object
  if (def.effects && def.grades) {
    const gradeValues = def.grades[gradeKey]
    if (!gradeValues) return
    for (const [effectKey, effectVal] of Object.entries(gradeValues)) {
      applyEffect(effectKey, effectVal, totals)
    }
  }
}

// ─── Map effect key → stat totals ─────────────────────────────
function applyEffect(effectKey, val, totals) {
  switch (effectKey) {
    case 'WC':         totals.gemWC  += val; break
    case 'SC':         totals.gemSC  += val; break
    case 'AC':         totals.gemAC  += val; break
    case 'DEX':        totals.gemDEX += val; break
    case 'STR':        totals.gemSTR += val; break
    case 'WIS':        totals.gemWIS += val; break
    case 'NTL':        totals.gemNTL += val; break
    case 'VIT':        totals.gemVIT += val; break
    case 'Hit':        totals.gemHit += val; break
    case 'Crit':       totals.gemCrit += val; break
    case 'XP':         totals.gemXP  += val; break
    case 'Gold':       totals.gemGold += val; break
    case 'Drop':       totals.gemDrop += val; break
    case 'ShadowDrop': totals.gemShadowDrop += val; break
    case 'DoubleHit':  totals.gemDoubleHit += val; break
    case 'Mastery':    totals.gemMastery += val; break
    case 'LifeSteal':  totals.gemLifeSteal += val; break
    case 'ResourceDrop': totals.gemResourceDrop += val; break
    // Percent bonuses (fractions: 0.05 = +5%) -- shadow enchantments
    case 'ACPercent':  totals.ACPercent  += val; break
    case 'WCPercent':  totals.WCPercent  += val; break
    case 'SCPercent':  totals.SCPercent  += val; break
    case 'DEXPercent': totals.DEXPercent += val; break
    case 'STRPercent': totals.STRPercent += val; break
    case 'WISPercent': totals.WISPercent += val; break
    case 'NTLPercent': totals.NTLPercent += val; break
    case 'VITPercent': totals.VITPercent += val; break
    // Enemy debuffs -- stored for combat resolution, not calcDerived
    case '-EnemyWIS': case '-EnemyNTL': case '-EnemyDEX':
    case '-EnemySTR': case '-EnemyHit':
    case 'StealWIS': case 'StealNTL': case 'StealDEX': case 'StealSTR':
      totals.enemyDebuffs[effectKey] = (totals.enemyDebuffs[effectKey] || 0) + val
      break
    default: break
  }
}

// ─── Apply enchantment bonuses (shadow items) ─────────────────
function applyEnchantments(enchantments, totals) {
  if (!Array.isArray(enchantments)) return
  for (const ench of enchantments) {
    // Multi-stat enchantments (Soulforge/Shadow loot) carry an effects array
    if (Array.isArray(ench?.effects)) {
      for (const e of ench.effects) applyEffect(e.stat, e.value, totals)
      continue
    }
    if (!ench?.effect) continue
    const { stat, value } = ench.effect
    // Map enchant stat names → our effect keys
    const statMap = {
      armorClass:             'AC',
      armorClassPercent:      'ACPercent',
      weaponClass:            'WC',
      weaponClassPercent:     'WCPercent',
      spellClass:             'SC',
      spellClassPercent:      'SCPercent',
      vitality:               'VIT',
      dexterity:              'DEX',
      strength:               'STR',
      wisdom:                 'WIS',
      intelligence:           'NTL',
      criticalHitChancePercent: 'Crit',
      hitChancePercent:       'Hit',
    }
    const mapped = statMap[stat] || stat
    applyEffect(mapped, value, totals)
  }
}

// ─── Main calcDerived ─────────────────────────────────────────
export function calcDerived(p, BASE_ITEMS = []) {
  if (!p.baseStats) p.baseStats = { STR: 15, DEX: 20, VIT: 10, NTL: 5, WIS: 5 }
  if (!Array.isArray(p.inventory)) p.inventory = []
  if (!Array.isArray(p.gems)) p.gems = []
  if (!p.equipment || typeof p.equipment !== 'object') p.equipment = {}
  if (!p.pos || typeof p.pos !== 'object') p.pos = { zoneId: 'Z01', x: 7, y: 7 }

  const rd = raceOf(p.race)

  // ── Running totals ─────────────────────────────────────────
  let ac = 0, wc = 0, sc = 0
  let hitBonus = 0    // flat % (leggings +10)
  let classBonus = 0  // flat % (gauntlets +15)

  // Gem totals (accumulated across all socketed gems on all equipped items)
  const gemTotals = {
    gemWC: 0, gemSC: 0, gemAC: 0,
    gemDEX: 0, gemSTR: 0, gemWIS: 0, gemNTL: 0, gemVIT: 0,
    gemHit: 0, gemCrit: 0,
    gemXP: 0, gemGold: 0, gemDrop: 0, gemShadowDrop: 0,
    gemDoubleHit: 0, gemMastery: 0, gemLifeSteal: 0, gemResourceDrop: 0,
    enemyDebuffs: {},
    // Enchant percent bonuses
    ACPercent: 0, WCPercent: 0, SCPercent: 0,
    DEXPercent: 0, STRPercent: 0, WISPercent: 0, NTLPercent: 0, VITPercent: 0,
  }

  // ── Loop equipped items ────────────────────────────────────
  for (const slotName of Object.keys(p.equipment)) {
    const iid = p.equipment[slotName]
    if (!iid) continue
    const item = p.inventory.find(i => i.instanceId === iid)
    if (!item) continue
    const base = BASE_ITEMS.find(b => b.id === item.baseItemId)
    if (!base) continue

    const subType = base.subType || base.type || ''
    // Quality x Soulforge infusion (+10% per infusion, +20% on a critical)
    const qm = (item.qualityMultiplier ?? 1.0) * (item.infusionMult ?? 1.0)
    const isHybrid = item.isHybrid ?? false

    // Get CV -- hybrid items store both WC and SC explicitly
    // Otherwise look up from DROPPER_TIERS
    let itemWC = 0, itemSC = 0, itemAC = 0

    if (isHybrid && item.hybridWC !== undefined) {
      // Hybrid weapon/spell -- has both WC and SC at 75%
      itemWC = (item.hybridWC || 0) * qm
      itemSC = (item.hybridSC || 0) * qm
    } else {
      // Standard dropper -- use DROPPER_TIERS cv × slot prop
      const tier = DROPPER_TIERS.find(t => t.tier === item.tier) || DROPPER_TIERS[0]
      const cv = item.cv ?? tier.cv
      const baseVal = cv * qm

      const SLOT_PROPS = {
        Armor: { prop: 1.00, stat: 'AC' },
        Helmet: { prop: 0.75, stat: 'AC' },
        Boots: { prop: 0.75, stat: 'AC' },
        Leggings: { prop: 0.50, stat: 'AC', hitBonus: 10 },
        Gauntlets: { prop: 0.50, stat: 'AC', classBonus: 15 },
        Gloves: { prop: 0.50, stat: 'AC', classBonus: 15 },
        Sword: { prop: 1.0, stat: 'WC' }, Mace: { prop: 1.0, stat: 'WC' },
        Claw: { prop: 1.0, stat: 'WC' }, Axe: { prop: 1.0, stat: 'WC' },
        Staff: { prop: 1.0, stat: 'WC' }, Dagger: { prop: 1.0, stat: 'WC' },
        Bow: { prop: 1.0, stat: 'WC' }, Arrow: { prop: 0.0, stat: 'WC' },
        BuffSpell: { prop: 0.25, stat: 'WC' },
        Fire: { prop: 1.0, stat: 'SC' }, Cold: { prop: 1.0, stat: 'SC' },
        Earth: { prop: 1.0, stat: 'SC' }, Air: { prop: 1.0, stat: 'SC' },
        Drain: { prop: 1.0, stat: 'SC' }, Arcane: { prop: 1.0, stat: 'SC' },
        Death: { prop: 1.0, stat: 'SC' }, OffHand: { prop: 0.25, stat: 'SC' },
        Amulet: { prop: 0, stat: null }, Ring: { prop: 0, stat: null },
        Rune: { prop: 0, stat: null }, Accessory: { prop: 0, stat: null },
      }

      const mod = SLOT_PROPS[subType] || { prop: 0, stat: null }
      const val = baseVal * (mod.prop || 0)

      if (mod.stat === 'AC') itemAC = val
      if (mod.stat === 'WC') itemWC = val
      if (mod.stat === 'SC') itemSC = val
      if (mod.hitBonus) hitBonus += mod.hitBonus
      if (mod.classBonus) classBonus += mod.classBonus
    }

    ac += itemAC
    wc += itemWC
    sc += itemSC

    // Apply socketed gems
    const socketedGems = item.socketedGems || []
    for (const gem of socketedGems) {
      applyGemBonuses(gem, gemTotals)
    }

    // Apply enchantments (shadow items)
    applyEnchantments(item.enchantments, gemTotals)
  }

  // ── Apply gem stat bonuses to base stats ───────────────────
  const bs = p.baseStats
  const effDEX = ((bs.DEX || 0) + gemTotals.gemDEX) * (1 + gemTotals.DEXPercent)
  const effSTR = ((bs.STR || 0) + gemTotals.gemSTR) * (1 + gemTotals.STRPercent)
  const effWIS = ((bs.WIS || 0) + gemTotals.gemWIS) * (1 + gemTotals.WISPercent)
  const effNTL = ((bs.NTL || 0) + gemTotals.gemNTL) * (1 + gemTotals.NTLPercent)
  const effVIT = ((bs.VIT || 0) + gemTotals.gemVIT) * (1 + gemTotals.VITPercent)

  // ── Apply flat gem class bonuses ───────────────────────────
  ac += gemTotals.gemAC
  wc += gemTotals.gemWC
  sc += gemTotals.gemSC

  // ── Apply percent enchant bonuses ──────────────────────────
  if (gemTotals.ACPercent) ac *= (1 + gemTotals.ACPercent)
  if (gemTotals.WCPercent) wc *= (1 + gemTotals.WCPercent)
  if (gemTotals.SCPercent) sc *= (1 + gemTotals.SCPercent)

  // ── Class scaling ──────────────────────────────────────────
  const focusKey = focusStat(rd)
  const focusVal = focusKey === 'VIT' ? effVIT : focusKey === 'WIS' ? effWIS : effDEX

  let WC = 0, SC = 0
  const classMult = 1 + (classBonus / 100)

  if (rd.archetype === 'True Fighter') {
    const scaleStat = rd.primaryStat === 'VIT' ? effVIT : effDEX
    WC = Math.max(12, wc * (1 + scaleStat * GDD.CLASS_STAT_SCALE) * classMult)
    SC = 0
  } else if (rd.archetype === 'True Caster') {
    const scaleStat = rd.primaryStat === 'VIT' ? effVIT : effWIS
    SC = Math.max(10, sc * (1 + scaleStat * GDD.CLASS_STAT_SCALE) * classMult)
    WC = 0
  } else {
    // Hybrid -- both WC and SC scale off focus stat
    WC = Math.max(12, wc * (1 + focusVal * GDD.CLASS_STAT_SCALE) * classMult)
    SC = Math.max(10, sc * (1 + focusVal * GDD.CLASS_STAT_SCALE) * classMult)
  }

  // ── Hit and Crit ───────────────────────────────────────────
  const baseHit = Math.min(99, GDD.HIT_BASE + focusVal * GDD.HIT_PER_FOCUS)
  const hitWithBonus = Math.min(99, baseHit * (1 + hitBonus / 100) + gemTotals.gemHit)
  const critChance = Math.min(60, GDD.CRIT_BASE + focusVal * GDD.CRIT_PER_FOCUS + gemTotals.gemCrit)

  // ── AC scaling ─────────────────────────────────────────────
  const finalAC = Math.max(10, ac * (1 + effVIT * GDD.AC_VIT_SCALE))

  p.derivedStats = {
    maxHp: GDD.MAX_HP_BASE + effVIT * GDD.MAX_HP_PER_VIT,
    AC: finalAC,
    WC,
    SC,
    hitChance: hitWithBonus,
    critChance,
    baseRegen: Math.floor(GDD.REGEN_BASE + (p.level || 1) * GDD.REGEN_PER_LEVEL),
    // Bonus stats from gems -- passed to combat/loot resolution
    gemXPBonus: gemTotals.gemXP,
    gemGoldBonus: gemTotals.gemGold,
    gemDropBonus: gemTotals.gemDrop,
    gemShadowDropBonus: gemTotals.gemShadowDrop,
    gemDoubleHit: gemTotals.gemDoubleHit,
    gemLifeSteal: gemTotals.gemLifeSteal,
    enemyDebuffs: gemTotals.enemyDebuffs,
  }

  if (p.hp === undefined || p.hp === null || p.hp > p.derivedStats.maxHp) {
    p.hp = p.derivedStats.maxHp
  }

  return p
}


// ─── Chapter 0 combat packets ────────────────────────────────────
export function playerPacket(derived, monsterDef, kind) {
  const def = Math.max(1, monsterDef || 5)
  if (kind === 'spellstrike') {
    const wcDmg = (GDD.DAMAGE_CONST * (derived.WC || 0)) / def
    const scDmg = (GDD.DAMAGE_CONST * (derived.SC || 0)) / def
    return (wcDmg + scDmg) * GDD.SPELLSTRIKE_MOD
  }
  if (kind === 'cast') return (GDD.DAMAGE_CONST * (derived.SC || 0)) / def
  return (GDD.DAMAGE_CONST * (derived.WC || 0)) / def
}

export function monsterPacket(monsterAtk, playerAC) {
  const ac = Math.max(1, playerAC || 10)
  return (GDD.DAMAGE_CONST * (monsterAtk || 0)) / (ac * GDD.AC_REDUCTION)
}

export function resolveTurn({ player, monster, kind, rng = Math.random }) {
  const rd = raceOf(player.race)
  const action = kind || (isHybrid(rd) ? 'spellstrike' : rd.archetype === 'True Caster' ? 'cast' : 'fight')
  const hitRoll = rng() * 100
  const hit = hitRoll <= (player.derivedStats.hitChance || 90)
  let dmg = 0
  let crit = false
  if (hit) {
    dmg = playerPacket(player.derivedStats, monster.def ?? monster.AC, action)
    crit = rng() * 100 <= (player.derivedStats.critChance || 5)
    if (crit) dmg *= GDD.DEFAULT_CRIT_MULT
  }
  const monsterHp = Math.max(0, (monster.currentHP ?? monster.hp) - dmg)
  let playerHp = player.hp
  let deadPlayer = false
  let deadMonster = monsterHp <= 0
  if (!deadMonster) {
    const incoming = monsterPacket(monster.atk ?? monster.Attack, player.derivedStats.AC)
    playerHp = player.hp - incoming
    deadPlayer = playerHp <= 0
    return {
      action, hit, crit, playerDmg: dmg,
      monsterDmg: incoming,
      monsterHp, playerHp: deadPlayer ? 0 : playerHp,
      deadMonster: false, deadPlayer,
    }
  }
  return {
    action, hit, crit, playerDmg: dmg,
    monsterDmg: 0, monsterHp: 0, playerHp,
    deadMonster: true, deadPlayer: false,
  }
}

// ─── Zone spine (25 Sep 2026 lock) ───────────────────────────────
export const ZONE_TYPES = Object.freeze({
  starter:  { xp: 1, gold: 1,   shadow: 0,     gem: 1 / 250, grades: 'min-max', hpDef: 1.0 },
  xp:       { xp: 1, gold: 1,   shadow: 1 / 600, gem: 1 / 250, grades: 'min-max', hpDef: 1.0 },
  gold:     { xp: 0, gold: 5,   shadow: 1 / 800, gem: 1 / 400, grades: '1-1',     hpDef: 0.5 },
  shadow:   { xp: 0, gold: 0.5, shadow: 'ladder', gem: 1 / 400, grades: '1-1',    hpDef: 0.5 },
  gem:      { xp: 0.25, gold: 0.5, shadow: 1 / 800, gem: 1 / 50, grades: 'exact', hpDef: 0.5 },
  prestige: { xp: 1, gold: 1,   shadow: 1 / 400, gem: 1 / 200, grades: '1-9',     hpDef: 1.0 },
})

export const SHADOW_LADDER = Object.freeze({
  Z25: 1 / 200,
  Z60: 1 / 175,
  Z73: 1 / 150,
  Z88: 1 / 125,
})

export const PURE_GEM_FARMS = Object.freeze({
  Z34: 3, Z51: 4, Z59: 5, Z66: 6, Z72: 7, Z79: 8, Z87: 9,
})

export const GOLD_FARMS = Object.freeze(['Z35', 'Z65', 'Z80', 'Z89'])
export const SHADOW_FARMS = Object.freeze(['Z25', 'Z60', 'Z73', 'Z88'])

export const STARTER_RACE = Object.freeze({
  Z01: 'dwarf', Z02: 'elf', Z03: 'halfling', Z04: 'human', Z05: 'gnome',
  Z06: 'tiefling', Z07: 'mermaid', Z08: 'werewolf', Z09: 'orc', Z10: 'hobbit',
  Z11: 'minotaur', Z12: 'centaur', Z13: 'griffin', Z14: 'phoenix', Z15: 'unicorn',
  Z16: 'babayaga', Z17: 'draugr', Z18: 'dragonborn', Z19: 'vampire', Z20: 'demon',
  Z21: 'troll', Z22: 'aasimar', Z23: 'phoenix', Z24: 'angel',
})

export function zoneType(zoneId, explicitType) {
  if (explicitType) return explicitType
  if (zoneId === 'Z101') return 'prestige'
  if (PURE_GEM_FARMS[zoneId]) return 'gem'
  if (GOLD_FARMS.includes(zoneId)) return 'gold'
  if (SHADOW_FARMS.includes(zoneId)) return 'shadow'
  const n = parseInt(String(zoneId).slice(1), 10)
  if (n >= 1 && n <= 24) return 'starter'
  return 'xp'
}

export function shadowRate(zoneId) {
  if (SHADOW_LADDER[zoneId] != null) return SHADOW_LADDER[zoneId]
  return ZONE_TYPES[zoneType(zoneId)].shadow || 0
}

export function rollGemGrade(gemMin, gemMax, rng = Math.random) {
  let grade = gemMin
  for (let i = 0; i < gemMax - gemMin; i++) {
    if (rng() < GDD.GEM_STEP_UP) grade += 1
  }
  return grade
}

/**
 * Shared special pool. At most one of gem / shadow / gold-bag per kill.
 * primary first, then residuals.
 */
export function rollSpecialDrop(zone, rng = Math.random) {
  const type = zoneType(zone.id || zone.zoneId, zone.type)
  const rules = ZONE_TYPES[type]
  const gemMin = zone.gemMin ?? (type === 'starter' || type === 'gold' || type === 'shadow' ? 1 : 1)
  const gemMax = zone.gemMax ?? (PURE_GEM_FARMS[zone.id] || (type === 'prestige' ? 9 : gemMin))

  const primary = type === 'gem' ? 'gem'
    : type === 'shadow' ? 'shadow'
    : type === 'gold' ? 'gold-bag'
    : 'gem'

  const rates = {
    gem: rules.gem || 0,
    shadow: typeof rules.shadow === 'number' ? rules.shadow : shadowRate(zone.id || zone.zoneId),
    'gold-bag': type === 'gold' ? 1 : 0,
  }
  if (type === 'gold') rates['gold-bag'] = 1 / 200

  const order = [primary, ...['gem', 'shadow', 'gold-bag'].filter(k => k !== primary)]
  for (const kind of order) {
    const r = rates[kind] || 0
    if (r > 0 && rng() < r) {
      if (kind === 'gem') {
        const grade = type === 'gem'
          ? (PURE_GEM_FARMS[zone.id] || gemMin)
          : rollGemGrade(gemMin, gemMax, rng)
        return { kind: 'gem', grade }
      }
      return { kind }
    }
  }
  return { kind: null }
}

// ─── Persistence ─────────────────────────────────────────────────
export function savePayload(p) {
  return {
    uid: p.uid,
    xp: p.xp ?? 0,
    gold: p.gold ?? 0,
    bank: p.bank ?? 0,
    gem_dust: p.gemDust ?? 0,
    essence: p.essence ?? 0,
    level: p.level ?? 1,
    hp: p.hp ?? 100,
    max_hp: p.derivedStats?.maxHp ?? 100,
    attribute_points: p.attributePoints ?? 0,
    base_stats: p.baseStats ?? {},
    pos: {
      zoneId: p.pos?.zoneId ?? 'Z01',
      x: p.pos?.x ?? 7,
      y: p.pos?.y ?? 7,
    },
    inventory: p.inventory ?? [],
    equipment: p.equipment ?? {},
    gems: p.gems ?? [],
    kills: p.kills ?? 0,
  }
}

export function applyLiveRow(p, row) {
  if (!row || row.error) return p
  if (row.xp != null) p.xp = row.xp
  if (row.gold != null) p.gold = row.gold
  if (row.bank != null) p.bank = row.bank
  if (row.gem_dust != null) p.gemDust = row.gem_dust
  if (row.essence != null) p.essence = row.essence
  if (row.level != null) p.level = row.level
  if (row.hp != null) p.hp = row.hp
  if (row.attribute_points != null) p.attributePoints = row.attribute_points
  if (row.kills != null) p.kills = row.kills
  if (row.base_stats && typeof row.base_stats === 'object' && Object.keys(row.base_stats).length) {
    p.baseStats = row.base_stats
  }
  if (Array.isArray(row.inventory)) p.inventory = row.inventory
  if (Array.isArray(row.gems)) p.gems = row.gems
  if (row.equipment && typeof row.equipment === 'object') p.equipment = row.equipment
  if (row.pos && typeof row.pos === 'object') p.pos = { zoneId: 'Z01', x: 7, y: 7, ...row.pos }
  p.xpToNextLevel = xpToLevel(p.level || 1)
  return p
}

export async function savePlayer(p, reason = '', fetchImpl = fetch) {
  if (!p?.uid) return { ok: false, skipped: 'no-uid' }
  const body = savePayload(p)
  try {
    const res = await fetchImpl('/api/player/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.error) {
      console.error('[savePlayer]', reason, res.status, json)
      return { ok: false, status: res.status, json }
    }
    if (reason) console.log('[save]', reason)
    return { ok: true, json }
  } catch (e) {
    console.error('savePlayer failed:', e)
    return { ok: false, error: String(e) }
  }
}

export function newItemInstance(baseItemId, tier = 1, extras = {}) {
  const id = (globalThis.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'i_' + Date.now() + '_' + Math.random().toString(16).slice(2)
  return {
    instanceId: id,
    baseItemId,
    tier,
    type: extras.type || 'Dropper',
    socketedGems: extras.socketedGems || [],
    ...extras,
  }
}

export default {
  GDD_VERSION, GDD, races, raceOf, isHybrid, combatAction, focusStat,
  calcDerived, playerPacket, monsterPacket, resolveTurn,
  spendAttributeBank, canSpendAP, getBankedLevels, getAttributeFocusOrder,
  xpToLevel, classValue, rollSpecialDrop, rollGemGrade,
  savePayload, applyLiveRow, savePlayer, newItemInstance,
  SLOT_MODS, DROPPER_TIERS, EQUIP_SLOTS_BY_ARCHETYPE, ZONE_TYPES,
}
