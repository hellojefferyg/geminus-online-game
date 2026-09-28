// Type declarations for gdd.js (the live engine rules). Loosely typed on purpose:
// gdd.js stays the single source of truth for values and formulas.
export const GDD_VERSION: string
export const GDD: Record<string, number>
export const races: Record<string, any>
export const AP_WEIGHTS: Record<string, any>
export const STAT_KEYS: readonly string[]
export const OFF_PAIRS: Record<string, string>
export const SLOT_MODS: Record<string, any>
export const DROPPER_TIERS: readonly { tier: number; levelReq: number; gold: number; cv: number }[]
export const GEM_GATES: Record<number, number>
export const EQUIP_SLOTS_BY_ARCHETYPE: Record<string, string[]>
export const ZONE_TYPES: Record<string, any>
export const SHADOW_LADDER: Record<string, number>
export const PURE_GEM_FARMS: Record<string, number>
export const GOLD_FARMS: readonly string[]
export const SHADOW_FARMS: readonly string[]
export const STARTER_RACE: Record<string, string>

export function xpToLevel(level: number): number
export function classValue(tier: number): number
export function getLevelBank(level: number): number
export function getBankedLevels(ap: number): number
export function canSpendAP(ap: number, level: number): boolean
export function raceOf(key: string): any
export function isHybrid(rd: any): boolean
export function combatAction(rd: any): string
export function focusStat(rd: any): string
export function racialPowerSource(rd: any): string
export function racialPower(p: any): { value: number; rung: number; source: string }
export function apWeightsFor(raceKey: string): Record<string, number>
export function mainStatFor(rd: any): string
export function spendAttributeBank(baseStats: any, raceKey: string, clicked: string): any
export function getAttributeFocusOrder(raceKey: string): string[]
export function sumGear(p: any, BASE_ITEMS?: any[]): any
export function calcDerived(p: any, BASE_ITEMS?: any[]): any
export function playerPacket(derived: any, monsterDef: number, kind: string): number
export function monsterPacket(monsterAtk: number, playerAC: number): number
export function resolveTurn(args: { player: any; monster: any; kind?: string; rng?: () => number }): any
export function zoneType(zoneId: string, explicitType?: string): string
export function shadowRate(zoneId: string): number
export function rollGemGrade(gemMin: number, gemMax: number, rng?: () => number): number
export function rollSpecialDrop(zone: any, rng?: () => number): { kind: string | null; grade?: number }
export function savePayload(p: any): any
export function applyLiveRow(p: any, row: any): any
export function savePlayer(p: any, reason?: string, fetchImpl?: typeof fetch): Promise<any>
export function newItemInstance(baseItemId: string, tier?: number, extras?: any): any

declare const _default: Record<string, any>
export default _default
