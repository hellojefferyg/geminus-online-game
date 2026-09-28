/**
 * src/systems/balance.ts
 * Live game balance. The God Editor publishes a JSON document (Supabase game_config,
 * key 'balance'); the game applies it over the code defaults at startup.
 *
 * Each section fully replaces the matching default table, in place, so every module that
 * imported the table sees the new values. A section that fails validation is skipped
 * (logged) so a bad publish can never break the game; the code defaults stay in force.
 */

import { supabase } from '../supabase'
import { GDD, DROPPER_TIERS, ZONE_TYPES, SHADOW_LADDER, PURE_GEM_FARMS } from '../gdd.js'
import { FORGE } from './services'
import ZONES_DATA from '../data/zones.json'
import BESTIARY_DATA from '../data/bestiary.json'
import GEMS_DATA from '../data/gems.json'
import ENCHANT_DATA from '../data/enchantments.json'

export const BALANCE_KEY = 'balance'
export const DRAFT_STORAGE_KEY = 'g_balance_draft'

export type SectionId =
  | 'gdd' | 'dropperTiers' | 'zoneTypes' | 'shadowLadder' | 'pureGemFarms'
  | 'zones' | 'starterMonsters' | 'forge' | 'gems' | 'enchantments'

export type Balance = Partial<Record<SectionId, any>>

// The live objects each section writes into
const TARGETS: Record<SectionId, () => any> = {
  gdd: () => GDD,
  dropperTiers: () => DROPPER_TIERS,
  zoneTypes: () => ZONE_TYPES,
  shadowLadder: () => SHADOW_LADDER,
  pureGemFarms: () => PURE_GEM_FARMS,
  zones: () => ZONES_DATA,
  starterMonsters: () => (BESTIARY_DATA as any).starter,
  forge: () => FORGE,
  gems: () => GEMS_DATA,
  enchantments: () => (ENCHANT_DATA as any).enchantments,
}

export const SECTION_IDS = Object.keys(TARGETS) as SectionId[]

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

/** Code defaults, captured before any override is applied. */
export const DEFAULTS: Record<SectionId, any> = Object.fromEntries(
  SECTION_IDS.map(id => [id, clone(TARGETS[id]())]),
) as Record<SectionId, any>

// ─── Validation ───────────────────────────────────────────────────

const isNum = (v: any) => typeof v === 'number' && Number.isFinite(v)
const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v)

/** Returns an error message, or null when the section is safe to apply. */
export function validateSection(id: SectionId, v: any): string | null {
  const def = DEFAULTS[id]
  switch (id) {
    case 'gdd': case 'forge':
      if (!isObj(v)) return 'must be an object'
      for (const k of Object.keys(def)) if (!isNum(v[k])) return `${k} must be a number`
      if (id === 'gdd' && (v.AP_PER_LEVEL <= 0 || v.DAMAGE_CONST <= 0 || v.AC_REDUCTION <= 0)) return 'AP_PER_LEVEL, DAMAGE_CONST and AC_REDUCTION must be above 0'
      if (id === 'forge' && (v.MINION_DMG_SHARE <= 0 || v.BOSS_DMG_SHARE <= 0)) return 'damage shares must be above 0'
      return null
    case 'dropperTiers':
      if (!Array.isArray(v) || !v.length) return 'must be a list of tiers'
      for (const t of v) if (!isNum(t.tier) || !isNum(t.levelReq) || !isNum(t.gold) || !isNum(t.cv)) return `tier ${t?.tier ?? '?'} has a missing number`
      return null
    case 'zoneTypes':
      if (!isObj(v)) return 'must be an object'
      for (const [k, r] of Object.entries<any>(v)) {
        for (const f of ['xp', 'gold', 'gem', 'hpDef']) if (!isNum(r?.[f])) return `${k}.${f} must be a number`
        if (!isNum(r.shadow) && r.shadow !== 'ladder') return `${k}.shadow must be a number or "ladder"`
      }
      for (const k of Object.keys(def)) if (!v[k]) return `zone type ${k} is missing`
      return null
    case 'shadowLadder': case 'pureGemFarms':
      if (!isObj(v)) return 'must be an object'
      for (const [k, n] of Object.entries(v)) if (!isNum(n)) return `${k} must be a number`
      return null
    case 'zones':
      if (!isObj(v)) return 'must be an object'
      for (const k of Object.keys(def)) {
        const z = v[k]
        if (!isObj(z)) return `zone ${k} is missing`
        if (!isNum(z.level) || !isNum(z.gemMin) || !isNum(z.gemMax)) return `${k}: level / gemMin / gemMax must be numbers`
        if (!(z.type in ZONE_TYPES) && !(z.type in (DEFAULTS.zoneTypes || {}))) return `${k}: unknown zone type ${z.type}`
      }
      return null
    case 'starterMonsters':
      if (!Array.isArray(v) || !v.length) return 'must be a list of monsters'
      for (const m of v) for (const f of ['hp', 'atk', 'def', 'xp', 'gold']) if (!isNum(m?.[f])) return `${m?.id ?? '?'}.${f} must be a number`
      if (v.some(m => m.hp <= 0)) return 'monster HP must be above 0'
      return null
    case 'gems':
      if (!isObj(v) || !isObj(v.standard) || !isObj(v.fusion)) return 'must have standard and fusion gems'
      return null
    case 'enchantments':
      if (!Array.isArray(v)) return 'must be a list'
      for (const e of v) for (const [k, arr] of Object.entries<any>(e?.stats || {})) if (!Array.isArray(arr) || arr.length !== 9 || !arr.every(isNum)) return `${e?.id ?? '?'}.${k} needs 9 numbers`
      return null
  }
}

// ─── Applying ─────────────────────────────────────────────────────

/** Rewrites `target` to equal `value`, keeping nested objects' identity (other modules hold references). */
function replaceInPlace(target: any, value: any) {
  if (Array.isArray(target)) {
    target.splice(0, target.length, ...clone(value))
    return
  }
  for (const k of Object.keys(target)) if (!(k in value)) delete target[k]
  for (const [k, v] of Object.entries(value)) {
    if (isObj(target[k]) && isObj(v)) replaceInPlace(target[k], v)
    else if (Array.isArray(target[k]) && Array.isArray(v)) replaceInPlace(target[k], v)
    else target[k] = clone(v)
  }
}

/** Resets every section to code defaults, then applies `balance`. Returns per-section problems. */
export function applyBalance(balance: Balance | null | undefined): Record<string, string> {
  const problems: Record<string, string> = {}
  for (const id of SECTION_IDS) {
    const override = balance?.[id]
    let value = DEFAULTS[id]
    if (override !== undefined) {
      const err = validateSection(id, override)
      if (err) { problems[id] = err; console.warn(`[balance] ${id} skipped: ${err}`) }
      else value = override
    }
    replaceInPlace(TARGETS[id](), value)
  }
  return problems
}

/** The value the game is using right now for a section (after overrides). */
export function currentSection(id: SectionId): any {
  return clone(TARGETS[id]())
}

// ─── Loading / publishing ─────────────────────────────────────────

export interface PublishedBalance { data: Balance; version: number; updated_at: string; updated_by: string | null }

export async function fetchPublishedBalance(): Promise<PublishedBalance | null> {
  const { data, error } = await supabase
    .from('game_config')
    .select('data, version, updated_at, updated_by')
    .eq('key', BALANCE_KEY)
    .maybeSingle()
  if (error) { console.warn('[balance] load failed:', error.message); return null }
  return (data as any) || null
}

/** Draft a dev is previewing on this device only (set from the God Editor). */
export function readDraft(): Balance | null {
  try { const raw = localStorage.getItem(DRAFT_STORAGE_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
export function writeDraft(b: Balance | null) {
  try { if (b) localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(b)); else localStorage.removeItem(DRAFT_STORAGE_KEY) } catch {}
}

/**
 * Called once at game start. Applies the published balance (and, for devs previewing,
 * their local draft). Never throws; falls back to code defaults after `timeoutMs`.
 */
export async function loadLiveBalance(opts: { isDev: boolean; timeoutMs?: number }): Promise<{ version: number | null; draft: boolean }> {
  const timeout = new Promise<null>(r => setTimeout(() => r(null), opts.timeoutMs ?? 4000))
  const published = await Promise.race([fetchPublishedBalance(), timeout])
  const draft = opts.isDev ? readDraft() : null
  applyBalance(draft || published?.data || null)
  return { version: published?.version ?? null, draft: !!draft }
}

export async function publishBalance(balance: Balance): Promise<{ ok: boolean; error?: string; version?: number }> {
  for (const id of Object.keys(balance) as SectionId[]) {
    if (!SECTION_IDS.includes(id)) return { ok: false, error: `Unknown section ${id}` }
    const err = validateSection(id, balance[id])
    if (err) return { ok: false, error: `${id}: ${err}` }
  }
  const { data, error } = await supabase
    .from('game_config')
    .upsert({ key: BALANCE_KEY, data: balance }, { onConflict: 'key' })
    .select('version')
    .single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, version: (data as any)?.version }
}

export async function fetchBalanceHistory(limit = 15) {
  const { data, error } = await supabase
    .from('game_config_history')
    .select('id, data, version, updated_by, updated_at')
    .eq('key', BALANCE_KEY)
    .order('version', { ascending: false })
    .limit(limit)
  if (error) { console.warn('[balance] history failed:', error.message); return [] }
  return data || []
}

// ─── Roles ────────────────────────────────────────────────────────

export type Role = 'dev' | 'admin' | 'arch' | 'mod' | 'player'
export const ROLE_LABELS: Record<Role, string> = { dev: 'Dev', admin: 'Admin', arch: 'Arch', mod: 'Mod', player: 'Player' }

export async function fetchMyRole(): Promise<Role> {
  const { data, error } = await supabase.rpc('my_role')
  if (error) return 'player'
  return (['dev', 'admin', 'arch', 'mod'].includes(data) ? data : 'player') as Role
}
