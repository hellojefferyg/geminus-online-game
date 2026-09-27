// Geminus Layer 1 — game object types. No values, no logic.

export interface BaseStats {
  STR: number
  DEX: number
  VIT: number
  NTL: number
  WIS: number
}

export interface DerivedStats {
  maxHp: number
  AC: number
  WC: number
  SC: number
  hitChance: number
  critChance: number
}

export interface Player {
  uid: string
  name: string
  race: string
  raceName: string
  archetype: string
  cci: string
  level: number
  xp: number
  xpToNextLevel: number
  attributePoints: number
  gold: number
  bank: number
  hp: number
  baseStats: BaseStats
  derivedStats: DerivedStats
  inventory: InventoryItem[]
  equipment: Record<string, string | null>
  gems: GemInstance[]
  pos: { x: number; y: number }
  kills: number
}

export interface Monster {
  id: string
  name: string
  hp: number
  atk: number
  def: number
  xp: number
  gold: number
  drop: { name: string; rarity: string } | null
}

export interface MonsterInstance extends Monster {
  currentHP: number
}

export interface BaseItem {
  id: string
  name: string
  type: 'Armor' | 'Weapons' | 'Spells' | 'Amulet' | 'Ring' | 'Accessory'
  subType: string
  sockets: number
}

export interface InventoryItem {
  instanceId: string
  baseItemId: string
  tier: number
  quality: 'Dropper' | 'Shadow' | 'Echo'
  socketedGems: GemInstance[]
}

export interface GemInstance {
  id: string
  grade: number
}

export interface CombatResult {
  playerHpAfter: number
  monsterHpAfter: number
  playerDmg: number
  monsterDmg: number
  monsterDied: boolean
  playerDied: boolean
  xpGained: number
  goldGained: number
  drop: { name: string; rarity: string } | null
  gemDrop: GemInstance | null
  logLines: { text: string; color: string }[]
  bankFull: boolean
  leveledUp: boolean
  newLevel: number
}

export interface ZoneData {
  zoneId: string
  zoneName: string
  minLevel: number
  gearTier: number
  type: 'starter' | 'xp' | 'gold' | 'shadow' | 'gem' | 'prestige'
  gemMin: number
  gemMax: number
  monsters: Monster[]
}
