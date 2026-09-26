import { useState, useEffect, useRef, useCallback } from 'react'
import { auth, db } from './firebase/index'
import { signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import AuthWrapper from './pages/AuthWrapper'
// ─── GAME DATA ───────────────────────────────────────────────
// All 24 races — must match RaceSelect.tsx exactly
const races: Record<string, any> = {
  // True Fighters — primary: DEX
  human:      { raceName: 'Human',      archetype: 'True Fighter',   primaryStat: 'DEX' },
  dragonborn: { raceName: 'Dragonborn', archetype: 'True Fighter',   primaryStat: 'DEX' },
  orc:        { raceName: 'Orc',        archetype: 'True Fighter',   primaryStat: 'DEX' },
  werewolf:   { raceName: 'Werewolf',   archetype: 'True Fighter',   primaryStat: 'DEX' },
  minotaur:   { raceName: 'Minotaur',   archetype: 'True Fighter',   primaryStat: 'DEX' },
  troll:      { raceName: 'Troll',      archetype: 'True Fighter',   primaryStat: 'VIT' },
  hobbit:     { raceName: 'Hobbit',     archetype: 'True Fighter',   primaryStat: 'DEX' },
  centaur:    { raceName: 'Centaur',    archetype: 'True Fighter',   primaryStat: 'DEX' },
  // True Casters — primary: WIS
  phoenix:    { raceName: 'Phoenix',    archetype: 'True Caster',    primaryStat: 'WIS' },
  tiefling:   { raceName: 'Tiefling',   archetype: 'True Caster',    primaryStat: 'WIS' },
  mermaid:    { raceName: 'Mermaid',    archetype: 'True Caster',    primaryStat: 'WIS' },
  gnome:      { raceName: 'Gnome',      archetype: 'True Caster',    primaryStat: 'WIS' },
  griffin:    { raceName: 'Griffin',    archetype: 'True Caster',    primaryStat: 'WIS' },
  vampire:    { raceName: 'Vampire',    archetype: 'True Caster',    primaryStat: 'WIS' },
  elf:        { raceName: 'Elf',        archetype: 'True Caster',    primaryStat: 'WIS' },
  babayaga:   { raceName: 'Baba Yaga',  archetype: 'True Caster',    primaryStat: 'WIS' },
  // Martial Hybrids — primary: DEX
  angel:      { raceName: 'Angel',      archetype: 'Martial Hybrid', primaryStat: 'DEX' },
  aasimar:    { raceName: 'Aasimar',    archetype: 'Martial Hybrid', primaryStat: 'DEX' },
  banshee:    { raceName: 'Banshee',    archetype: 'Martial Hybrid', primaryStat: 'DEX' },
  halfling:   { raceName: 'Halfling',   archetype: 'Martial Hybrid', primaryStat: 'DEX' },
  // Mystic Hybrids — primary: WIS
  dwarf:      { raceName: 'Dwarf',      archetype: 'Mystic Hybrid',  primaryStat: 'WIS' },
  demon:      { raceName: 'Demon',      archetype: 'Mystic Hybrid',  primaryStat: 'WIS' },
  draugr:     { raceName: 'Draugr',     archetype: 'Mystic Hybrid',  primaryStat: 'WIS' },
  unicorn:    { raceName: 'Unicorn',    archetype: 'Mystic Hybrid',  primaryStat: 'WIS' },
}

const GDD = { XP_BASE: 200, XP_GROWTH: 1.12, AP_PER_LEVEL: 40, DAMAGE_CONST: 90, AC_REDUCTION: 0.5 }

// Every 50 levels the bank limit goes up by 1 (starts at 1)
// Returns stats ordered so primary stat is rightmost
function getAttributeFocusOrder(raceKey: string): string[] {
  const rd = races[raceKey] || races.human
  const primaryStat = rd.primaryStat // DEX for fighters, WIS for casters
  const allStats = ['DEX', 'STR', 'NTL', 'WIS', 'VIT']
  // Remove primary stat and put it last (rightmost)
  const others = allStats.filter(s => s !== primaryStat)
  return [...others, primaryStat]
}

function getLevelBank(level: number): number {
  return 1 + Math.floor(level / 50)
}

// Returns banked free levels (each AP_PER_LEVEL = 1 free level)
function getBankedLevels(attributePoints: number): number {
  return Math.floor(attributePoints / GDD.AP_PER_LEVEL)
}

const BESTIARY: Record<string, any> = {
  Z01: {
    zoneName: 'Aether Silver Cavern', minLevel: 1,
    monsters: [
      { id: 'E01', name: 'Glass Construct', hp: 25, atk: 10, def: 13, xp: 18, gold: 8, drop: { name: 'Glass Construct Core', rarity: 'Common' } },
      { id: 'E02', name: 'Mercury Sprite', hp: 32, atk: 12, def: 15, xp: 24, gold: 12, drop: { name: 'Mercury Essence', rarity: 'Uncommon' } },
      { id: 'E03', name: 'Mirror Gargoyle', hp: 45, atk: 15, def: 18, xp: 36, gold: 20, drop: { name: 'Polished Mirror Shard', rarity: 'Rare' } },
      { id: 'E04*', name: 'Prism Titan', hp: 75, atk: 22, def: 25, xp: 120, gold: 75, drop: { name: "Titan's Prism Heart", rarity: 'Epic' } },
    ]
  }
}

// MOCK_PLAYERS removed — PvP targets will come from Firestore in Phase 5

const BASE_ITEMS = [
  { id: 'base_helm_1', name: 'Silver Crest Helm', type: 'Armor', subType: 'Helmet', sockets: 2 },
  { id: 'base_armor_1', name: 'Chroma Glass Cuirass', type: 'Armor', subType: 'Armor', sockets: 2 },
  { id: 'base_gauntlets_1', name: 'Platinum Gauntlets', type: 'Armor', subType: 'Gauntlets', sockets: 2 },
  { id: 'base_leggings_1', name: 'Obsidian Weave Leggings', type: 'Armor', subType: 'Leggings', sockets: 2 },
  { id: 'base_boots_1', name: 'Liquid Glass Boots', type: 'Armor', subType: 'Boots', sockets: 2 },
  { id: 'base_sword_1', name: 'Quicksilver Blade', type: 'Weapons', subType: 'Sword', sockets: 2 },
  { id: 'base_axe_1', name: 'Brutal War Axe', type: 'Weapons', subType: 'Axe', sockets: 2 },
  { id: 'base_staff_1', name: 'Monochrome Siphon', type: 'Weapons', subType: 'Staff', sockets: 2 },
  { id: 'base_firespell_1', name: 'Pyroclastic Surge', type: 'Spells', subType: 'Fire', sockets: 2 },
  { id: 'base_airspell_1', name: 'Zephyr Vortex', type: 'Spells', subType: 'Air', sockets: 2 },
  { id: 'base_deathspell_1', name: 'Void Reaping', type: 'Spells', subType: 'Death', sockets: 2 },
  { id: 'base_accessory_1', name: 'Aether Rune Matrix', type: 'Accessory', subType: 'Rune', sockets: 2 },
  { id: 'base_amulet_1', name: 'Platinum Pendant', type: 'Amulet', subType: 'Amulet', sockets: 2 },
  { id: 'base_ring_1', name: 'Polished Silver Ring', type: 'Ring', subType: 'Ring', sockets: 2 },
]

const DROPPER_TIERS = [
  { tier: 1, levelReq: 1, gold: 50000, cv: 13.00 },
  { tier: 2, levelReq: 1, gold: 87500, cv: 15.86 },
  { tier: 3, levelReq: 100, gold: 153125, cv: 19.35 },
]

const SLOT_MODS: Record<string, any> = {
  Weapon: { prop: 1.0, stat: 'WC' }, Spell: { prop: 1.0, stat: 'SC' },
  Armor: { prop: 1.0, stat: 'AC' }, Helmet: { prop: 0.75, stat: 'AC' },
  Boots: { prop: 0.75, stat: 'AC' }, Leggings: { prop: 0.50, stat: 'AC' },
  Gauntlets: { prop: 0.50, stat: 'AC' },
}

const GEMS: Record<string, any> = {
  warStone: { name: 'WarStone', category: 'Fighter', color: 'Red', effect: 'Increase Base Weapon Class' },
  mightrite: { name: 'Mightrite', category: 'Fighter', color: 'Red', effect: 'Increase Dexterity' },
  mightStone: { name: 'MightStone', category: 'Fighter', color: 'Red', effect: 'Increase Strength' },
  loreStone: { name: 'LoreStone', category: 'Caster', color: 'Blue', effect: 'Increase Base Spell Class' },
  mindrite: { name: 'Mindrite', category: 'Caster', color: 'Blue', effect: 'Increase Wisdom' },
  mindStone: { name: 'MindStone', category: 'Caster', color: 'Blue', effect: 'Increase Intelligence' },
  obsidianHeart: { name: 'Obsidian Heart', category: 'Misc', color: 'Green', effect: 'Increase Base Armor Class' },
  spikeCore: { name: 'Spike-Core', category: 'Misc', color: 'Yellow', effect: 'Increase Critical Hit Chance' },
  trueCore: { name: 'True-Core', category: 'Misc', color: 'Green', effect: 'Increase Hit Chance' },
  vitalCore: { name: 'Vital-Core', category: 'Misc', color: 'Green', effect: 'Increase Vitality' },
  treasureCore: { name: 'Treasure-Core', category: 'Misc', color: 'Yellow', effect: 'Increase Drop Chance' },
}

const RARITY_COLORS: Record<string, string> = {
  Common: '#D1D5DB', Uncommon: '#30D158', Rare: '#0A84FF',
  Epic: '#BF5AF2', Legendary: '#FF9F0A', Mythic: '#FF375F', None: '#8FA8C7',
}

const EQUIP_SLOTS = [
  { name: 'Helmet' }, { name: 'Weapon 1' }, { name: 'Gloves' }, { name: 'Weapon 2' },
  { name: 'Armor' }, { name: 'Spell 1' }, { name: 'Leggings' }, { name: 'Spell 2' },
  { name: 'Boots' }, { name: 'Accessory' }, { name: 'Amulet' }, { name: 'Ring' },
]

const INVENTORY_BAGS: Record<string, string[]> = {
  'Weapon Chest': ['Weapons'], 'Bag of Gear': ['Armor'],
  'Jewelry Box': ['Amulet', 'Ring', 'Accessory'], 'Spell Satchel': ['Spells'],
}

const CHAT_SUBS: Record<string, [string, string][]> = {
  main: [['feed', 'Main Chat'], ['settings', 'Name Color']],
  sales: [['chat', 'Sales Chat'], ['auction', 'Auction']],
  clan: [['chat', 'Clan Chat'], ['wars', 'Wars'], ['contrib', 'Contributions']],
  groups: [['g1', ''], ['g2', ''], ['g3', ''], ['g4', '']],
}

// ─── HELPERS ──────────────────────────────────────────────────
function fmt(n: number): string {
  if (!n || isNaN(n)) return '0'
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}

function calcDerived(p: any) {
  // Guard all fields — Firestore may return undefined for unset fields
  if (!p.baseStats) p.baseStats = { STR: 15, DEX: 20, VIT: 10, NTL: 5, WIS: 5 }
  if (!Array.isArray(p.inventory)) p.inventory = []
  if (!Array.isArray(p.gems)) p.gems = []
  if (!p.equipment || typeof p.equipment !== 'object') p.equipment = {}
  if (!p.pos || typeof p.pos !== 'object') p.pos = { x: 7, y: 7 }

  const rd = races[p.race] || races.human
  let ac = 0, wc = 0, sc = 0
  for (const slotName in p.equipment) {
    const iid = p.equipment[slotName]; if (!iid) continue
    const item = Array.isArray(p.inventory) ? p.inventory.find((i: any) => i.instanceId === iid) : null
    if (!item) continue
    const base = BASE_ITEMS.find(b => b.id === item.baseItemId); if (!base) continue
    const mod = SLOT_MODS[base.subType] || {}
    const tier = DROPPER_TIERS.find(t => t.tier === item.tier) || DROPPER_TIERS[0]
    const val = tier.cv * (mod.prop || 0.8)
    if (mod.stat === 'AC') ac += val
    if (mod.stat === 'WC') wc += val
    if (mod.stat === 'SC') sc += val
  }
  const pStat = (p.baseStats && p.baseStats[rd.primaryStat]) || 10
  const vit = (p.baseStats && p.baseStats.VIT) || 10
  const dex = (p.baseStats && p.baseStats.DEX) || 10
  p.derivedStats = {
    maxHp: 100 + vit * 10,
    AC: Math.max(10, ac * (1 + vit * 0.0075)),
    WC: Math.max(12, wc * (1 + pStat * 0.0055)),
    SC: Math.max(10, sc * (1 + pStat * 0.0055)),
    hitChance: Math.min(99, 90 + dex * 0.05),
    critChance: Math.min(60, 5 + dex * 0.01),
  }
  if (p.hp === undefined || p.hp === null || p.hp > p.derivedStats.maxHp) p.hp = p.derivedStats.maxHp
  return p
}

// createPlayer is no longer the source of truth — Firestore is.
// Kept as a helper for calcDerived only. New players are created by RaceSelect.tsx → Firestore.

// Save player to Firestore (called after any stat/combat change)
async function savePlayer(p: any) {
  if (!p?.uid) return
  try {
    await setDoc(doc(db, 'players', p.uid), {
      name: p.name,
      level: p.level,
      xp: p.xp,
      xpToNextLevel: p.xpToNextLevel,
      attributePoints: p.attributePoints,
      gold: p.gold,
      bank: p.bank,
      hp: p.hp,
      baseStats: p.baseStats,
      inventory: p.inventory,
      equipment: p.equipment,
      gems: p.gems,
      pos: p.pos,
      race: p.race,
      raceName: p.raceName,
      archetype: p.archetype,
      cci: p.cci,
      raceSelected: true,
    }, { merge: true })
  } catch (e) {
    console.error('savePlayer failed:', e)
  }
}

// ─── ITEM ICONS ───────────────────────────────────────────────
function ItemIcon({ subType }: { subType: string }) {
  const s = (subType || '').toLowerCase()
  if (s.includes('helmet') || s.includes('helm'))
    return <svg className="w-7 h-7" style={{ color: '#e4e4e7', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a8 8 0 00-8 8v4a4 4 0 004 4h8a4 4 0 004-4v-4a8 8 0 00-8-8z"/><path d="M9 12h6M12 2v10M8 15h8"/></svg>
  if (s.includes('sword') || s.includes('blade'))
    return <svg className="w-7 h-7" style={{ color: '#fb7185', filter: 'drop-shadow(0 0 8px rgba(255,55,95,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.5 4l5.5 5.5L7 22l-4-1 1-4L14.5 4z"/><path d="M18 7.5l-3.5-3.5M4 20l3.5-3.5"/></svg>
  if (s.includes('axe'))
    return <svg className="w-7 h-7" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(255,149,0,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 12l6-6-4-4-6 6M4 20l10-10M9 7l4 4"/></svg>
  if (s.includes('staff'))
    return <svg className="w-7 h-7" style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 8px rgba(10,132,255,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 19L19 5M17 3l4 4M19 7l-2-2M12 12l2 2"/></svg>
  if (s.includes('armor') || s.includes('cuirass'))
    return <svg className="w-7 h-7" style={{ color: '#34d399', filter: 'drop-shadow(0 0 8px rgba(48,209,88,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3L4 7v6c0 5 4 8 8 9 4-1 8-4 8-9V7l-8-4z"/><path d="M12 3v19"/></svg>
  if (s.includes('gauntlet') || s.includes('glove'))
    return <svg className="w-7 h-7" style={{ color: '#5eead4', filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="8" width="12" height="12" rx="3"/><path d="M9 4v4M12 3v5M15 4v4"/></svg>
  if (s.includes('legging'))
    return <svg className="w-7 h-7" style={{ color: '#818cf8', filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h12v4l-2 13-3-1-1-9-1 9-3 1L6 7V3z"/></svg>
  if (s.includes('boot'))
    return <svg className="w-7 h-7" style={{ color: '#d4d4d8', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h6v9l5 2v4H5v-4l2-2V4z"/></svg>
  if (s.includes('fire'))
    return <svg className="w-7 h-7" style={{ color: '#f87171', filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.7))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2c1 3.5 4 5 4 8.5 0 3-2 5.5-4 7.5-2-2-4-4.5-4-7.5 0-3.5 3-5 4-8.5z"/></svg>
  if (s.includes('air') || s.includes('zephyr'))
    return <svg className="w-7 h-7" style={{ color: '#7dd3fc', filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8h13a3 3 0 10-3-3M3 12h14a3 3 0 11-3 3M6 16h8a2 2 0 10-2-2"/></svg>
  if (s.includes('death') || s.includes('void'))
    return <svg className="w-7 h-7" style={{ color: '#c084fc', filter: 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a9 9 0 00-9 9c0 4 2.5 7 6 8.5V22h6v-2.5c3.5-1.5 6-4.5 6-8.5a9 9 0 00-9-9z"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/></svg>
  if (s.includes('rune') || s.includes('accessory'))
    return <svg className="w-7 h-7" style={{ color: '#e4e4e7', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
  if (s.includes('amulet') || s.includes('pendant'))
    return <svg className="w-7 h-7" style={{ color: '#fcd34d', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3l6 9 6-9"/><circle cx="12" cy="16" r="4"/><path d="M12 14v4M10 16h4"/></svg>
  if (s.includes('ring'))
    return <svg className="w-7 h-7" style={{ color: '#fde047', filter: 'drop-shadow(0 0 8px rgba(253,224,71,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="13" r="7"/><polygon points="12 3 14 6 10 6 12 3"/></svg>
  return <svg className="w-7 h-7" style={{ color: '#e4e4e7' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/></svg>
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App({ uid }: { uid: string }) {
  const [player, setPlayer] = useState<any>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [battleStats, setBattleStats] = useState({ levels: 0, kills: 0, rounds: 0, deaths: 0, oneHitKills: 0 })
  const [theme, setTheme] = useState('aether')
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [battleMode, setBattleMode] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState('E01')
  const [combatMonster, setCombatMonster] = useState<any>(null)
  const [combatLog, setCombatLog] = useState<{text: string; color: string}[]>([])
  const [enemyCurrentHP, setEnemyCurrentHP] = useState<number | null>(null)
  const [lastItem, setLastItem] = useState('None')
  const [lastItemColor, setLastItemColor] = useState('#8FA8C7')
  const [lastGem, setLastGem] = useState('None')
  const [lastGemColor, setLastGemColor] = useState('#8FA8C7')
  const [mapOverlay, setMapOverlay] = useState(false)
  const [chatOverlay, setChatOverlay] = useState(false)
  const [chatChannel, setChatChannel] = useState('main')
  const [chatSub, setChatSub] = useState<Record<string, string>>({ main: 'feed', sales: 'chat', clan: 'chat', groups: 'g1' })
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({ main: [], sales: [], clan: [], groups: [], g1: [], g2: [], g3: [], g4: [] })
  const [chatInput, setChatInput] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [equipPopup, setEquipPopup] = useState<string | null>(null)
  const [pendingLevelUp, setPendingLevelUp] = useState(false) // blocked from killing until free levels spent
  const [chatNameColor, setChatNameColor] = useState('#3EE0FF')
  const [inboxOpen, setInboxOpen] = useState(false)
  const [groupNames, setGroupNames] = useState<Record<string, string>>({ g1: 'Group-1', g2: 'Group-2', g3: 'Group-3', g4: 'Group-4' })
  const [filterState, setFilterState] = useState({ category: 'All', subType: 'All', tier: 'All', quality: 'All', sortBy: 'tier', order: 'desc' })
  const [menuOpen, setMenuOpen] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const smokeRef = useRef<HTMLCanvasElement>(null)
  const miniMapRef = useRef<HTMLCanvasElement>(null)
  const zoneCanvasRef = useRef<HTMLCanvasElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }, [])

  // Theme-color meta tag for Safari status bar — set immediately on mount
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta') as HTMLMetaElement
      meta.name = 'theme-color'
      document.head.prepend(meta)
    }
    meta.content = '#03080c'
  }, [])

  // ── FIREBASE PLAYER LOAD ──
  // AuthWrapper already confirmed this uid has a valid player doc with raceSelected:true
  // We just fetch it directly — no onAuthStateChanged needed here
  useEffect(() => {
    const loadPlayerDoc = async () => {
      try {
        const snap = await getDoc(doc(db, 'players', uid))
        if (!snap.exists()) {
          setLoadError('Character data not found. Please sign out and create your character.')
          return
        }
        const data = snap.data() as any
        const p: any = {
          uid,
          name: data.name || 'Pilot',
          level: data.level || 1,
          xp: data.xp || 0,
          xpToNextLevel: data.xpToNextLevel || 200,
          attributePoints: data.attributePoints ?? 40,
          gold: data.gold || 0,
          bank: data.bank || 0,
          race: data.race || 'human',
          raceName: data.raceName || 'Human',
          archetype: data.archetype || 'True Fighter',
          cci: data.cci || 'DEX',
          baseStats: data.baseStats || { STR: 15, DEX: 20, VIT: 10, NTL: 5, WIS: 5 },
          derivedStats: {},
          hp: data.hp,
          inventory: data.inventory || [],
          equipment: data.equipment || {},
          gems: data.gems || [],
          pos: data.pos || { x: 7, y: 7 },
        }
        calcDerived(p)
        if (!p.hp || p.hp > p.derivedStats.maxHp) p.hp = p.derivedStats.maxHp
        setPlayer(p)
      } catch (err: any) {
        const msg = err?.code === 'permission-denied'
          ? 'Firestore permission denied — check security rules in Firebase console.'
          : `Failed to load character: ${err?.message || 'Unknown error'}`
        setLoadError(msg)
      }
    }
    loadPlayerDoc()
    const savedTheme = localStorage.getItem('g_theme') || 'aether'
    setTheme(savedTheme)
    document.documentElement.classList.toggle('theme-onyx', savedTheme === 'onyx')
    setChatMessages(prev => ({ ...prev, main: [{ sender: 'System', text: 'Welcome to Geminus. Transmission systems online.', color: '#3EE0FF' }] }))
  }, [uid])

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('theme-onyx', theme === 'onyx')
    localStorage.setItem('g_theme', theme)
  }, [theme])

  // Smoke
  useEffect(() => {
    const canvas = smokeRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    class Smoke {
      x: number; y: number; size: number; sx: number; sy: number
      rot: number; rs: number; type: string; alpha: number; r: number; g: number; b: number
      constructor(init = false) {
        this.x = init ? Math.random() * canvas.width : (Math.random() > 0.5 ? -100 : canvas.width + 100)
        this.y = Math.random() * canvas.height; this.size = Math.random() * 240 + 80
        this.sx = (Math.random() - 0.5) * 0.45; this.sy = (Math.random() - 0.5) * 0.35
        this.rot = Math.random() * Math.PI * 2; this.rs = (Math.random() - 0.5) * 0.004
        const roll = Math.random()
        if (roll < 0.35) { this.type = 'white'; this.alpha = Math.random() * 0.05 + 0.02; this.r = 240; this.g = 245; this.b = 255 }
        else if (roll < 0.70) { this.type = 'black'; this.alpha = Math.random() * 0.22 + 0.08; this.r = 0; this.g = 0; this.b = 0 }
        else { this.type = 'onyx'; this.alpha = Math.random() * 0.18 + 0.06; this.r = 12; this.g = 12; this.b = 16 }
      }
      update() {
        this.x += this.sx; this.y += this.sy; this.rot += this.rs
        if (this.x < -this.size * 1.5 || this.x > canvas.width + this.size * 1.5 || this.y < -this.size * 1.5 || this.y > canvas.height + this.size * 1.5) Object.assign(this, new Smoke())
      }
      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot)
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size)
        if (this.type === 'black') { g.addColorStop(0, `rgba(0,0,0,${this.alpha * 1.4})`); g.addColorStop(0.5, `rgba(0,0,0,${this.alpha * 0.7})`); g.addColorStop(1, 'rgba(0,0,0,0)') }
        else if (this.type === 'white') { g.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.alpha * 1.2})`); g.addColorStop(0.4, `rgba(200,210,225,${this.alpha * 0.5})`); g.addColorStop(1, 'rgba(255,255,255,0)') }
        else { g.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.alpha * 1.3})`); g.addColorStop(0.5, `rgba(5,5,8,${this.alpha * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)') }
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }
    }
    const particles = Array.from({ length: 40 }, (_, i) => new Smoke(true))
    let id: number
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw() }); id = requestAnimationFrame(animate) }
    animate()
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize) }
  }, [])

  // Mini map
  useEffect(() => {
    if (!miniMapRef.current || !player) return
    const canvas = miniMapRef.current; const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const w = canvas.offsetWidth; const h = canvas.offsetHeight
    ctx.clearRect(0, 0, w, h)
    // Solid black background
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, w, h)
    // Player dot centered
    const dotX = w / 2; const dotY = h / 2
    ctx.fillStyle = '#3EE0FF'; ctx.shadowBlur = 8; ctx.shadowColor = '#3EE0FF'
    ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0
  }, [player, activeTab])

  // Zone canvas
  useEffect(() => {
    if (!zoneCanvasRef.current || !player || !mapOverlay) return
    const canvas = zoneCanvasRef.current; const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const w = canvas.offsetWidth; const h = canvas.offsetHeight
    ctx.clearRect(0, 0, w, h)
    const t = 28; const pos = player.pos
    const ox = w / 2 - pos.x * t - t / 2; const oy = h / 2 - pos.y * t - t / 2
    ctx.save(); ctx.translate(ox, oy)
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const cur = x === pos.x && y === pos.y
        if (cur) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x * t, y * t, t, t) }
        ctx.strokeStyle = cur ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(x * t, y * t, t, t)
      }
    }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(pos.x * t + t / 2, pos.y * t + t / 2, t * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }, [player, mapOverlay])

  // Chat scroll
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [chatMessages, chatChannel, chatSub])

  if (!player) return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '16px', padding: '24px',
      background: 'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
    }}>
      <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#3EE0FF', letterSpacing: '0.14em', margin: 0, textShadow: '0 0 30px rgba(62,224,255,0.5)' }}>GEMINUS</h1>
      {loadError ? (
        <>
          <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', maxWidth: '320px', lineHeight: 1.5, margin: 0 }}>{loadError}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: '10px', background: 'rgba(62,224,255,0.1)', border: '1px solid rgba(62,224,255,0.4)', color: '#3EE0FF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Retry
          </button>
        </>
      ) : (
        <p style={{ color: '#64748b', fontSize: '12px', letterSpacing: '0.08em', margin: 0 }}>Loading your character...</p>
      )}
      {/* Sign out — force clears everything so AuthWrapper re-routes */}
      <button onClick={async () => {
        try { await signOut(auth) } catch {}
        try { localStorage.clear() } catch {}
        try { sessionStorage.clear() } catch {}
        window.location.replace(window.location.origin)
      }}
        style={{ marginTop: '8px', background: 'rgba(255,55,95,0.1)', border: '1px solid rgba(255,55,95,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '10px 28px' }}>
        Sign Out
      </button>
      <p style={{ color: '#1e3a4a', fontSize: '10px', margin: 0, textAlign: 'center', maxWidth: '280px' }}>
        Tap Sign Out to return to login and create your character
      </p>
    </div>
  )

  // Logout — real Firebase signOut
  const handleLogout = () => {
    if (!window.confirm('Log out of Geminus?')) return
    signOut(auth).then(() => window.location.reload()).catch(() => window.location.reload())
  }

  const canAllocate = (player.attributePoints || 0) >= GDD.AP_PER_LEVEL

  const handleColorChange = (color: string) => {
    setChatNameColor(color)
    localStorage.setItem('g_name', color)
  }

  const spendPoint = (attr: string) => {
    if (!canAllocate) return
    const p = { ...player, baseStats: { ...player.baseStats }, derivedStats: {} }
    // Use current stat ratios as weights — works for ALL 24 races from Firestore
    const statKeys = ['STR', 'DEX', 'VIT', 'NTL', 'WIS']
    const total = statKeys.reduce((sum, k) => sum + (p.baseStats[k] || 1), 0)
    const baseScale = GDD.AP_PER_LEVEL / total
    for (const k of statKeys) {
      const w = p.baseStats[k] || 1
      const boost = k === attr
        ? w * baseScale * 1.5   // chosen stat: 50% extra
        : w * baseScale * 0.5   // others: reduced
      p.baseStats[k] = (p.baseStats[k] || 1) + boost
    }
    p.attributePoints -= GDD.AP_PER_LEVEL
    calcDerived(p)
    setPlayer(p); savePlayer(p)
    const remaining = getBankedLevels(p.attributePoints)
    const max = getLevelBank(p.level)
    if (remaining < max) setPendingLevelUp(false)
    showToast(attr + ' upgraded!')
  }

  const move = (dx: number, dy: number) => {
    // Game world coords: UP increases Y, DOWN decreases Y
    // DPad sends dy=-1 for UP arrow, so we invert dy here
    const newX = Math.max(0, Math.min(15, player.pos.x + dx))
    const newY = Math.max(0, Math.min(15, player.pos.y - dy))
    const p = { ...player, pos: { x: newX, y: newY } }
    setPlayer(p); savePlayer(p)
  }

  const getTargets = () => BESTIARY.Z01.monsters // PvP targets come from Firestore in Phase 5

  const toggleEngage = () => {
    if (!engaged) {
      const targets = getTargets()
      const t = targets.find((x: any) => x.id === selectedTargetId) || targets[0]
      if (!t) { showToast('Select target first.'); return }
      setCombatMonster({ ...t, currentHP: t.hp })
      setTurnCount(0)
      setEnemyCurrentHP(t.hp)
      setCombatLog([])
      setEngaged(true)
    } else {
      setEngaged(false)
      setEnemyCurrentHP(null)
      setCombatLog([])
    }
  }

  const performTurn = (isMagic: boolean) => {
    if (!engaged || !combatMonster) return
    const p = { ...player, baseStats: { ...player.baseStats }, derivedStats: { ...player.derivedStats } }
    const m = { ...combatMonster }
    const classVal = isMagic ? (p.derivedStats.SC || 12) : (p.derivedStats.WC || 15)
    const playerDmg = (GDD.DAMAGE_CONST * classVal) / Math.max(5, m.def)
    m.currentHP -= playerDmg
    const newTurn = turnCount + 1; setTurnCount(newTurn)

    if (m.currentHP <= 0) {
      m.currentHP = 0
      // Check level bank — if player has too many banked levels, block the kill
      const bankedLevels = getBankedLevels(p.attributePoints || 0)
      const maxBank = getLevelBank(p.level)
      if (bankedLevels >= maxBank) {
        setPendingLevelUp(true)
        setCombatLog([
          { text: 'Level Bank Full — spend your free levels!', color: '#FF9500' },
          { text: `Bank limit: ${maxBank} at Level ${p.level}`, color: '#94a3b8' },
        ])
        setEngaged(false)
        calcDerived(p); setPlayer(p); savePlayer(p)
        return
      }
      const newStats = { ...battleStats, kills: battleStats.kills + 1, rounds: battleStats.rounds + 1, oneHitKills: battleStats.oneHitKills + (newTurn === 1 ? 1 : 0) }
      setBattleStats(newStats)
      try { localStorage.setItem('geminus_battle_stats', JSON.stringify(newStats)) } catch {}
      p.gold += m.gold; p.xp += m.xp
      setLastItem(m.drop?.name || 'Item'); setLastItemColor(RARITY_COLORS[m.drop?.rarity] || '#8FA8C7')
      if (Math.random() < 0.35) {
        const allGems = Object.entries(GEMS)
        const [gId, gData] = allGems[Math.floor(Math.random() * allGems.length)]
        if (p.gems.length < 200) {
          p.gems = [...p.gems, { id: gId, grade: 1 }]
          setLastGem(`${(gData as any).name} G1`); setLastGemColor(RARITY_COLORS['Rare'])
        }
      }
      if (p.xp >= p.xpToNextLevel) {
        p.level++; p.xp -= p.xpToNextLevel
        p.attributePoints += GDD.AP_PER_LEVEL
        p.xpToNextLevel = Math.floor(GDD.XP_BASE * Math.pow(GDD.XP_GROWTH, p.level))
        const ls = { ...newStats, levels: newStats.levels + 1 }
        setBattleStats(ls)
        try { localStorage.setItem('geminus_battle_stats', JSON.stringify(ls)) } catch {}
        showToast(`⬆ Level Up! Level ${p.level}`)
        // Check if now over bank limit after leveling
        const newBanked = getBankedLevels(p.attributePoints)
        const newMax = getLevelBank(p.level)
        if (newBanked >= newMax) setPendingLevelUp(true)
      }
      const statGains = `WIS(1) | NTL(1) | VIT(1) | STR(1) | DEX(1)`
      const killLines: {text: string; color: string}[] = []
      if (newTurn > 1) killLines.push({ text: `You hit ${m.name} for ${Math.round(playerDmg)} dmg!`, color: '#fff' })
      killLines.push({ text: `You hit ${m.name} for ${Math.round(playerDmg)} dmg!`, color: '#fff' })
      killLines.push({ text: 'Enemy is DEAD!', color: '#30D158' })
      killLines.push({ text: statGains, color: '#FF9500' })
      setCombatLog(killLines)
      setEnemyCurrentHP(null)
      setEngaged(false)
    } else {
      const monsterDmg = Math.max(1, m.atk - (p.derivedStats.AC * GDD.AC_REDUCTION))
      p.hp -= monsterDmg
      if (p.hp <= 0) {
        p.hp = 0
        const ns = { ...battleStats, deaths: battleStats.deaths + 1, rounds: battleStats.rounds + 1 }
        setBattleStats(ns)
        try { localStorage.setItem('geminus_battle_stats', JSON.stringify(ns)) } catch {}
        setCombatLog([
          { text: `${m.name} hit you for ${Math.round(monsterDmg)} dmg!`, color: '#FF375F' },
          { text: 'Chassis Integrity Depleted!', color: '#fbbf24' },
          { text: '💀 Defeated! Press BATTLE', color: '#94a3b8' },
        ])
        setEnemyCurrentHP(null)
        p.hp = p.derivedStats.maxHp
        setEngaged(false)
      } else {
        setBattleStats(prev => ({ ...prev, rounds: prev.rounds + 1 }))
        const roundLines: {text: string; color: string}[] = []
        roundLines.push({ text: `You attack ${m.name}`, color: '#cbd5e1' })
        roundLines.push({ text: `${m.name} hit you for ${Math.round(monsterDmg)}!`, color: '#FF375F' })
        if (newTurn > 1) roundLines.push({ text: `You hit ${m.name} for ${Math.round(playerDmg)}!`, color: '#fff' })
        roundLines.push({ text: `You hit ${m.name} for ${Math.round(playerDmg)}!`, color: '#fff' })
        setCombatLog(roundLines)
        setEnemyCurrentHP(Math.max(0, Math.round(m.currentHP)))
        setCombatMonster(m)
      }
    }
    calcDerived(p); setPlayer(p); savePlayer(p)
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const ch = chatChannel; const sub = chatSub[ch]
    const key = ch === 'groups' ? sub : ch
    const msg = { sender: player.name || 'Jeff', text: chatInput.trim(), color: chatNameColor }
    setChatMessages(prev => ({ ...prev, [key]: [...(prev[key] || []).slice(-149), msg] }))
    setChatInput('')
  }

  const switchChannel = (ch: string) => {
    setChatChannel(ch)
    if (inboxOpen) setInboxOpen(false)
  }

  const toggleInbox = () => setInboxOpen(prev => !prev)

  const renderChatContent = () => {
    const sub = chatSub[chatChannel]
    if (chatChannel === 'main' && sub === 'settings') return <NameColorPicker nameColor={chatNameColor} onColorChange={handleColorChange} />
    const key = chatChannel === 'groups' ? sub : chatChannel
    const msgs = chatMessages[key] || []
    return msgs.length === 0 ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: '12px' }}></div> : (
      <>
        {msgs.map((m: any, i: number) => (
          <div key={i} style={{ margin: '4px 0', fontSize: '12px' }}>
            <span style={{ color: m.color || chatNameColor, fontWeight: 800 }}>{m.sender}:</span>{' '}
            <span style={{ color: '#fff' }}>{m.text}</span>
          </div>
        ))}
      </>
    )
  }

  const renderInventoryBags = () => {
    const equipped = Object.values(player.equipment).filter(Boolean)
    const unequipped = player.inventory.filter((i: any) => !equipped.includes(i.instanceId))
    const { category, subType, tier, quality, sortBy, order } = filterState
    const filtered = unequipped.filter((item: any) => {
      const base = BASE_ITEMS.find(b => b.id === item.baseItemId); if (!base) return false
      if (category !== 'All' && !INVENTORY_BAGS[category]?.includes(base.type)) return false
      if (subType !== 'All' && base.subType !== subType) return false
      if (tier !== 'All' && item.tier.toString() !== tier) return false
      if (quality !== 'All' && (item.type || 'Dropper') !== quality) return false
      return true
    }).sort((a: any, b: any) => {
      const ba = BASE_ITEMS.find(x => x.id === a.baseItemId); const bb = BASE_ITEMS.find(x => x.id === b.baseItemId)
      let ca: any = sortBy === 'name' ? (ba?.name || '') : sortBy === 'type' ? (ba?.type || '') : a.tier
      let cb: any = sortBy === 'name' ? (bb?.name || '') : sortBy === 'type' ? (bb?.type || '') : b.tier
      if (typeof ca === 'string') return order === 'asc' ? ca.localeCompare(cb) : cb.localeCompare(ca)
      return order === 'asc' ? ca - cb : cb - ca
    })
    return (
      <>
        {Object.entries(INVENTORY_BAGS).map(([bagName, types]) => {
          const bagItems = filtered.filter((item: any) => {
            const base = BASE_ITEMS.find(b => b.id === item.baseItemId)
            return base && types.includes(base.type)
          })
          return (
            <AccordionItem key={bagName} title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#fff' }}>📦 {bagName} <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>({bagItems.length})</span></span>}>
              <div className="inventory-grid">
                {bagItems.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px', color: '#71717a', fontSize: '11px' }}>No items found</div> :
                  bagItems.map((item: any) => {
                    const base = BASE_ITEMS.find(b => b.id === item.baseItemId)
                    const gems = item.socketedGems || []
                    return (
                      <div key={item.instanceId}>
                        <div className="inventory-slot" onClick={() => setEquipPopup(prev => prev === item.instanceId ? null : item.instanceId)}>
                          {gems.length > 0 && (
                            <div className="gem-overlays-container">
                              {gems[0] && <div className={`gem-overlay ${(GEMS[gems[0].id]?.category || 'misc').toLowerCase()}`}>{(GEMS[gems[0].id]?.name || 'Gem').slice(0, 3)}</div>}
                              {gems[1] && <div className={`gem-overlay ${(GEMS[gems[1].id]?.category || 'misc').toLowerCase()}`}>{(GEMS[gems[1].id]?.name || 'Gem').slice(0, 3)}</div>}
                            </div>
                          )}
                          <div className="item-icon-wrapper"><ItemIcon subType={base?.subType || ''} /></div>
                          <span className="item-tier-label">T{item.tier}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </AccordionItem>
          )
        })}
        <AccordionItem title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#fff' }}>💎 Gem Pouch <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>({player.gems.length}/200)</span></span>}>
          <div className="gem-pouch-grid">
            {player.gems.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px', color: '#71717a', fontSize: '11px' }}>No gems stored</div> :
              player.gems.map((g: any, i: number) => {
                const gd = GEMS[g.id] || { name: 'Gem', color: 'Green' }
                return (
                  <div key={i} className="gem-item">
                    <span style={{ fontSize: '12px' }}>{gd.color === 'Red' ? '🔴' : gd.color === 'Blue' ? '🔵' : gd.color === 'Yellow' ? '🟡' : '🟢'}</span>
                    <span className="item-label">{gd.name.slice(0, 3)}{g.grade}</span>
                  </div>
                )
              })}
          </div>
        </AccordionItem>
      </>
    )
  }

  const unequipItem = (instanceId: string) => {
    if (!instanceId) return
    const item = player.inventory.find((i: any) => i.instanceId === instanceId); if (!item) return
    const base = BASE_ITEMS.find(b => b.id === item.baseItemId); if (!base) return
    const p = { ...player, equipment: { ...player.equipment }, inventory: [...player.inventory] }
    for (const slot in p.equipment) if (p.equipment[slot] === instanceId) p.equipment[slot] = null
    calcDerived(p); setPlayer(p); savePlayer(p)
    showToast(`${base.name} unequipped.`)
  }

  const equipItem = (instanceId: string) => {
    if (!instanceId) return
    const item = player.inventory.find((i: any) => i.instanceId === instanceId); if (!item) return
    const base = BASE_ITEMS.find(b => b.id === item.baseItemId); if (!base) return
    const p = { ...player, equipment: { ...player.equipment }, inventory: [...player.inventory] }
    const slotMap: Record<string, string> = { Sword: 'Weapon 1', Armor: 'Armor', Helmet: 'Helmet', Gauntlets: 'Gloves', Leggings: 'Leggings', Boots: 'Boots', Fire: 'Spell 1', Air: 'Spell 2', Amulet: 'Amulet', Ring: 'Ring', Rune: 'Accessory' }
    const slot = slotMap[base.subType]
    if (slot) {
      p.equipment[slot] = instanceId
      calcDerived(p); setPlayer(p); savePlayer(p)
      showToast(`${base.name} equipped to ${slot}.`)
    }
    setEquipPopup(null)
  }

  const handleItemTap = (instanceId: string) => {
    // Legacy — only used by inventory now to show popup
    setEquipPopup(prev => prev === instanceId ? null : instanceId)
  }

  const resetSave = () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return
    // Clear local battle stats cache; Firestore player doc is source of truth
    localStorage.removeItem('geminus_battle_stats')
    setBattleStats({ levels: 0, kills: 0, rounds: 0, deaths: 0, oneHitKills: 0 })
    showToast('Battle stats reset.')
    setActiveTab(null)
  }

  const hpPct = Math.max(0, Math.min(100, (player.hp / player.derivedStats.maxHp) * 100))
  const freeLevels = Math.floor((player.attributePoints || 0) / GDD.AP_PER_LEVEL)
  const targets = getTargets()

  return (
    <AuthWrapper>{(uid) => <>
      <canvas ref={smokeRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none', opacity: 0.9 }} />

      <div style={{ width: '100%', minHeight: '100dvh', maxWidth: '512px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'transparent' }} onClick={(e) => { if (equipPopup && !(e.target as HTMLElement).closest('.inventory-slot')) setEquipPopup(null); if (menuOpen && !(e.target as HTMLElement).closest('.menu-container')) setMenuOpen(false) }}>
        <div style={{ position: 'relative', zIndex: 10, width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', paddingTop: 'max(10px, env(safe-area-inset-top, 10px))', gap: '10px', paddingBottom: '112px' }}>

            {/* ── HUD ── */}
            {activeTab === null && (
              <header className="glass-panel" style={{ flexShrink: 0, position: 'relative', zIndex: 30, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '8px' }}>

                    {/* Left: Stats */}
                    <section style={{ flex: 1, minWidth: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <p style={{ margin: 0, fontSize: '12px' }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{player.name}:</span>
                          <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace', marginLeft: '4px' }}>Level {player.level}</span>
                        </p>
                        <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>Race:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', marginLeft: '4px' }}>{player.raceName || player.race}</span></p>
                        <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>A-Spec:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', marginLeft: '4px' }}>{player.archetype} · {player.cci}</span></p>

                        <div style={{ paddingTop: '4px', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
                          {(['DEX', 'STR', 'WIS', 'NTL', 'VIT'] as const).map(stat => (
                            <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                              <span style={{ color: '#fff', fontWeight: 700 }}>{stat.charAt(0) + stat.slice(1).toLowerCase()}:</span>
                              <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace' }}>{fmt(player.baseStats[stat])}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: '#fff', fontWeight: 700, marginRight: '4px' }}>Lvls:</span>
                            <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace' }}>{freeLevels} ({player.attributePoints || 0} AP)</span>
                          </div>
                        </div>

                        {/* Gold / Bank stacked above Menu */}
                        <div style={{ paddingTop: '4px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div className="info-cell" style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#FFD60A', fontWeight: 700, fontSize: '11px' }}>Gold:</span>
                            <span style={{ color: '#FFD60A', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{fmt(player.gold)}</span>
                          </div>
                          <div className="info-cell" style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#FFD60A', fontWeight: 700, fontSize: '11px' }}>Bank:</span>
                            <span style={{ color: '#FFD60A', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{fmt(player.bank)}</span>
                          </div>
                        </div>

                        <div className="menu-container" style={{ paddingTop: '4px', position: 'relative' }}>
                          <button
                            className="battle-mode-btn"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => setMenuOpen(prev => !prev)}
                          >
                            <span style={{ fontSize: '13px' }}>≡</span> Menu
                          </button>
                          {menuOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: 'rgba(3,12,20,0.97)', border: '1px solid rgba(62,224,255,0.42)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.9)' }}>
                              {([['stats', 'Player Info'], ['training', 'Training Log'], ['settings', 'Settings'], ['equipment', 'Equipment'], ['inventory', 'Inventory']] as const).map(([tab, label]) => (
                                <button key={tab} onClick={() => { setActiveTab(tab); setMenuOpen(false) }}
                                  style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#e8fbff', fontSize: '12px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(62,224,255,0.1)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  {tab === 'stats' ? '👤' : tab === 'training' ? '📊' : tab === 'settings' ? '⚙️' : tab === 'equipment' ? '🛡️' : '🎒'} {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Zone Info — under Menu (Fix 6 order + Fix 10 Logout) */}
                        <div style={{ paddingTop: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3 }}><span style={{ color: '#fff', fontWeight: 700 }}>Zone:</span> <span style={{ color: '#cbd5e1' }}>Aether Silver Cavern</span></p>
                            <button
                              onClick={handleLogout}
                              style={{ flexShrink: 0, fontSize: '9px', fontWeight: 800, padding: '3px 7px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', cursor: 'pointer', letterSpacing: '0.03em', textTransform: 'uppercase' }}
                            >Logout</button>
                          </div>
                          <p style={{ margin: 0, fontSize: '9.5px', color: '#94a3b8', fontFamily: 'monospace', lineHeight: 1.3 }}>[{player.pos.x}, {player.pos.y}]</p>
                          <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3 }}><span style={{ color: '#fff', fontWeight: 700 }}>Type:</span> <span style={{ color: '#3EE0FF', fontWeight: 700 }}>XP Zone</span></p>
                          <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3 }}><span style={{ color: '#fff', fontWeight: 700 }}>Gem:</span> <span style={{ color: '#30D158' }}>G1 · 1/250</span></p>
                          <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3 }}><span style={{ color: '#fff', fontWeight: 700 }}>Shadow:</span> <span style={{ color: '#52525b' }}>Off</span></p>
                        </div>
                      </div>
                    </section>

                    {/* Right: Nav Deck — flush to right edge, 4px breathing room so border shows */}
                    {!battleMode && (
                      <section style={{ width: '162px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: '6px', paddingRight: '4px' }}>
                        {/* Square map */}
                        <div onClick={() => setMapOverlay(true)} style={{ cursor: 'pointer', width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: '10px', border: '1.5px dashed rgba(62,224,255,0.5)', boxShadow: '0 0 12px rgba(62,224,255,0.2)', flexShrink: 0 }}>
                          <canvas ref={miniMapRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                        </div>
                        {/* DPad */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                          <DPad onMove={move} onEnter={() => showToast('Interacting with sector waypoint.')} />
                        </div>
                      </section>
                    )}
                  </div>

              </header>
            )}

            {/* ── STATS PANEL (Health / XP / Last Drop) — own glass section ── */}
            {activeTab === null && (
              <section className="glass-panel" style={{ flexShrink: 0, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Health Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#fff', fontWeight: 700 }}>Health:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#30D158' }}>{fmt(player.hp)} / {fmt(player.derivedStats.maxHp)}</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(0,0,0,0.8)', borderRadius: '9999px', height: '7px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ height: '100%', borderRadius: '9999px', width: `${hpPct}%`, background: '#30D158', boxShadow: '0 0 10px rgba(48,209,88,0.6)', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* XP row — Experience left, Next Level right, bar below */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: 700 }}>Experience: <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 400 }}>{fmt(player.xp)}</span></span>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Next Level: <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{fmt(player.xpToNextLevel)}</span></span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(0,0,0,0.8)', borderRadius: '9999px', height: '7px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ height: '100%', borderRadius: '9999px', width: `${Math.max(0, Math.min(100, (player.xp / player.xpToNextLevel) * 100))}%`, background: 'linear-gradient(90deg, #FF6B00, #FF9500)', boxShadow: '0 0 10px rgba(255,149,0,0.6)', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Last Item + Level on row 1, Last Gem on row 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>Last Item: <span style={{ color: lastItemColor, fontWeight: 700 }}>{lastItem}</span> <span style={{ color: '#30D158', fontFamily: 'monospace', fontSize: '11px' }}>{player.inventory.length}/200</span></span>
                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '12px' }}>Level: <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'monospace' }}>{player.level}</span></span>
                  </div>
                  <div>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>Last Gem: <span style={{ color: lastGemColor, fontWeight: 700 }}>{lastGem}</span> <span style={{ color: '#30D158', fontFamily: 'monospace', fontSize: '11px' }}>{player.gems.length}/200</span></span>
                  </div>
                </div>
              </section>
            )}

            {/* ── INLINE PANEL (tabs) ── */}
            {activeTab !== null && (
                // Inline Panel
                <div className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['stats', 'training', 'settings'] as const).map(t => (
                          <button key={t} className={`hud-nav-pill${activeTab === t ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => setActiveTab(t)}>
                            {t === 'stats' ? 'Player Info' : t === 'training' ? 'Training Log' : 'Settings'}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['equipment', 'inventory'] as const).map(t => (
                          <button key={t} className={`hud-nav-pill${activeTab === t ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => setActiveTab(t)}>
                            {t === 'equipment' ? 'Equipment' : 'Inventory'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexShrink: 0 }}>
                      <button className="pin-btn">📌</button>
                      <button onClick={() => setActiveTab(null)} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black', border: '1px solid rgba(255,255,255,0.2)', color: '#d4d4d8', fontSize: '18px', cursor: 'pointer' }}>×</button>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px' }}>
                    {/* Equipment */}
                    {activeTab === 'equipment' && (
                      <div className="equipment-grid">
                        {EQUIP_SLOTS.map(slot => {
                          const instId = player.equipment[slot.name]
                          const item = player.inventory.find((i: any) => i.instanceId === instId)
                          const base = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null
                          const gems = item?.socketedGems || []
                          return (
                            <div key={slot.name} className="equipment-slot-wrapper">
                              <div className="equipment-slot-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{slot.name}</span>
                                {instId && (
                                  <button
                                    onClick={() => unequipItem(instId)}
                                    style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', cursor: 'pointer', letterSpacing: '0.02em', flexShrink: 0 }}
                                  >Unequip</button>
                                )}
                              </div>
                              <div className="equipment-slot-content" style={{ cursor: 'default' }}>
                                {gems.length > 0 && (
                                  <div className="gem-overlays-container">
                                    {gems[0] && <div className={`gem-overlay ${(GEMS[gems[0].id]?.category || 'misc').toLowerCase()}`}>{(GEMS[gems[0].id]?.name || 'Gem').slice(0, 3)}</div>}
                                    {gems[1] && <div className={`gem-overlay ${(GEMS[gems[1].id]?.category || 'misc').toLowerCase()}`}>{(GEMS[gems[1].id]?.name || 'Gem').slice(0, 3)}</div>}
                                  </div>
                                )}
                                {base ? (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ItemIcon subType={base.subType} /></div>
                                    <span className="item-tier-label">T{item.tier}</span>
                                  </>
                                ) : <span style={{ fontSize: '11px', color: '#71717a' }}>Empty</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Inventory */}
                    {activeTab === 'inventory' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Ledger</span>
                        </div>
                        <AccordionItem title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9M3 12h9m-9 4h6" /></svg>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Sort & Filter</span>
                          </div>
                        }>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[['Category', 'category', ['All', ...Object.keys(INVENTORY_BAGS)]], ['Tier', 'tier', ['All', ...Array.from({ length: 20 }, (_, i) => String(i + 1))]], ['Quality', 'quality', ['All', 'Dropper', 'Shadow', 'Echo']], ['Sort By', 'sortBy', [['tier', 'Tier'], ['name', 'Name'], ['type', 'Type']]]].map(([label, key, opts]: any) => (
                              <div key={String(key)}>
                                <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#d4d4d8', display: 'block', marginBottom: '2px' }}>{label}</label>
                                <select className="editor-input" style={{ width: '100%', fontSize: '12px', padding: '4px 8px' }} value={(filterState as any)[key as string]} onChange={e => setFilterState(prev => ({ ...prev, [key as string]: e.target.value }))}>
                                  {opts.map((o: any) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </AccordionItem>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {renderInventoryBags()}
                        </div>
                      </div>
                    )}

                    {/* Player Info */}
                    {activeTab === 'stats' && (
                      <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Combat Attributes</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                          {[['Armor Class (AC)', player.derivedStats.AC?.toFixed(1)], ['Weapon Class (WC)', player.derivedStats.WC?.toFixed(1)], ['Spell Class (SC)', player.derivedStats.SC?.toFixed(1)], ['Hit Probability', `${player.derivedStats.hitChance?.toFixed(1)}%`], ['Critical Chance', `${player.derivedStats.critChance?.toFixed(1)}%`], ['Max Health', Math.round(player.derivedStats.maxHp)]].map(([k, v]) => (
                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ color: '#9ca3af' }}>{k}</span>
                              <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Training */}
                    {activeTab === 'training' && (
                      <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textDecoration: 'underline', textUnderlineOffset: '4px', marginBottom: '12px' }}>Battle Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12.5px' }}>
                          <div><span style={{ fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>Levels: </span><span style={{ background: 'black', padding: '1px 4px', borderRadius: '4px', border: '1px solid #262626', color: '#fff', fontWeight: 700 }}>{fmt(battleStats.levels)}</span></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[['Kills', battleStats.kills], ['Rounds', battleStats.rounds], ['Deaths', battleStats.deaths], ['1 Hit Kill %', battleStats.kills > 0 ? `${Math.round(battleStats.oneHitKills / battleStats.kills * 100)}%` : '0%']].map(([k, v]) => (
                              <div key={String(k)}><span style={{ fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>{k}: </span><span style={{ background: 'black', padding: '1px 4px', borderRadius: '4px', border: '1px solid #262626', color: '#fff', fontWeight: 700 }}>{typeof v === 'number' ? fmt(v) : v}</span></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    {activeTab === 'settings' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Pilot Profile</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ color: '#d4d4d8' }}>Pilot Callsign</span>
                              <input className="editor-input" id="settings-name-input" defaultValue={player.name} style={{ width: '144px', padding: '4px 8px', fontSize: '12px' }} />
                            </div>
                            <button className="glass-button" style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '8px' }} onClick={() => {
                              const val = (document.getElementById('settings-name-input') as HTMLInputElement)?.value?.trim()
                              if (val) { const p = { ...player, name: val }; setPlayer(p); savePlayer(p); showToast('Profile callsign updated.') }
                            }}>Update Profile</button>
                            <button onClick={resetSave} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', background: 'transparent', cursor: 'pointer' }}>Reset Progress & Restore Chassis</button>
                          </div>
                        </div>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Display</span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <div style={{ color: '#e4e4e7' }}>Dark Mode</div>
                              <div style={{ fontSize: '10px', color: '#71717a' }}>Onyx black HUD — no cyan glass</div>
                            </div>
                            <button className="footer-tab-button" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => {
                              const next = theme === 'onyx' ? 'aether' : 'onyx'
                              setTheme(next)
                              showToast(next === 'onyx' ? 'Dark Mode on — Onyx HUD' : 'Aether glass restored')
                            }}>{theme === 'onyx' ? 'On' : 'Off'}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            )}

            {/* ── COMBAT CONSOLE ── */}
            <section className="glass-panel" style={{ flexShrink: 0, padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', zIndex: 20 }}>
              {/* Top row: target selectors + battle button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '12px', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                  Monsters
                </div>

                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  {/* Fix 9: Remove HP from monster name in dropdown — HP shown separately below */}
                  <select className="editor-input" value={selectedTargetId} onChange={e => { setSelectedTargetId(e.target.value); if (engaged) { setEngaged(false); setEnemyCurrentHP(null); setCombatLog([]) } }}
                    style={{ width: '100%', paddingTop: '6px', paddingBottom: '6px', paddingRight: '28px', fontSize: '12px', background: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.2)', appearance: 'none' }}>
                    {targets.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div style={{ pointerEvents: 'none', position: 'absolute', top: 0, right: '8px', bottom: 0, display: 'flex', alignItems: 'center' }}>
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <button className={`combat-engage-btn${engaged ? ' active' : ''}`} onClick={toggleEngage}>
                  {engaged ? 'DISENGAGE' : 'BATTLE'}
                </button>
              </div>

              {/* Attack buttons — only when engaged */}
              {engaged && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.12)', height: '40px' }}>
                  <button className="combat-tactile-btn combat-cast-slab" onClick={() => performTurn(true)}>Cast</button>
                  <button className="combat-tactile-btn" onClick={() => { performTurn(true); setTimeout(() => performTurn(false), 0) }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, borderRadius: '0.65rem', border: '1.5px solid rgba(191,90,242,0.8)', background: 'linear-gradient(180deg, #7B2FBE 0%, #4A1280 100%)', color: '#f3e8ff', boxShadow: '0 0 16px rgba(191,90,242,0.5), inset 0 1px 1px rgba(255,255,255,0.2)', cursor: 'pointer', letterSpacing: '0.02em' }}>
                    Cast+Fight
                  </button>
                  <button className="combat-tactile-btn combat-fight-slab" onClick={() => performTurn(false)}>Fight</button>
                </div>
              )}

              {/* Fix 9: Enemy HP shown only when engaged, no box */}
              {engaged && enemyCurrentHP !== null && (
                <div style={{ textAlign: 'center', paddingTop: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF375F' }}>
                    Enemies Health: {enemyCurrentHP}/{combatMonster?.hp ?? 0}
                  </span>
                </div>
              )}

              {/* Fix 9: Free-floating combat log lines — no box, just centered text */}
              {combatLog.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2px', paddingTop: '2px' }}>
                  {combatLog.map((line, i) => (
                    <div key={i} style={{ fontSize: '11px', lineHeight: 1.4, fontWeight: i === combatLog.length - 1 ? 700 : 500, color: line.color }}>
                      {line.text}
                    </div>
                  ))}
                </div>
              )}

              {/* No-battle idle hint */}
              {!engaged && combatLog.length === 0 && (
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#475569', paddingTop: '2px' }}>
                  Select target &amp; press BATTLE to fight
                </div>
              )}

              {/* Attribute Focus Selector — shows when free levels available */}
              {canAllocate && (
                <div style={{ flexShrink: 0, paddingTop: '6px', borderTop: '1px solid rgba(255,149,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#FF9500', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>⬆ Level Up — Choose Focus</span>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'center', gap: '2px' }}>
                    {getAttributeFocusOrder(player.race).map((stat, idx, arr) => (
                      <span key={stat} style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={() => spendPoint(stat)}
                          style={{
                            background: 'rgba(255,149,0,0.15)',
                            border: '1.5px solid rgba(255,149,0,0.7)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: '6px 8px',
                            color: '#FF9500',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            WebkitTapHighlightColor: 'rgba(255,149,0,0.3)',
                            touchAction: 'manipulation',
                            minWidth: '44px',
                            minHeight: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none',
                          }}
                        >{stat}({freeLevels})</button>
                        {idx < arr.length - 1 && <span style={{ color: '#FF9500', fontSize: '10px', opacity: 0.4, marginLeft: '2px', marginRight: '2px' }}>|</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── CHAT CONSOLE ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '240px' }}>
              <div className="glass-panel" style={{ width: '100%', padding: '10px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                    <button className={`chat-expand-btn inbox-btn${inboxOpen ? ' active' : ''}`} onClick={toggleInbox}>💬</button>
                    {['main', 'sales', 'clan', 'groups'].map(ch => (
                      <button key={ch} className={`footer-tab-button${chatChannel === ch ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => switchChannel(ch)}>
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button className="chat-expand-btn" style={{ marginLeft: '4px' }} onClick={() => setChatOverlay(true)}>
                    <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </div>

                {/* Subs */}
                {!inboxOpen && (
                  <div className="sub-bar" style={{ flexShrink: 0, marginBottom: '8px' }}>
                    {(CHAT_SUBS[chatChannel] || []).map(([id, label]) => {
                      const name = chatChannel === 'groups' ? groupNames[id] || id : label
                      return (
                        <button key={id} className={`sub-btn${chatSub[chatChannel] === id ? ' active' : ''}`} onClick={() => setChatSub(prev => ({ ...prev, [chatChannel]: id }))}>
                          <span>{name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {inboxOpen ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(62,224,255,0.3)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid rgba(62,224,255,0.25)' }}>💬 Private Messages:</div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>No private messages</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(62,224,255,0.3)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid rgba(62,224,255,0.25)' }}>🤖 Discord Messages:</div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>Link a Discord account to message players from in-game</div>
                    </div>
                  </div>
                ) : (
                  <div ref={chatScrollRef} style={{ fontSize: '12px', flex: 1, overflowY: 'auto', minHeight: '140px', padding: '4px' }}>
                    {renderChatContent()}
                  </div>
                )}

                {!inboxOpen && (
                  <form onSubmit={sendMessage} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button type="button" className="icon-btn" onClick={() => setEmojiOpen(prev => !prev)}>😀</button>
                    <input type="text" className="editor-input" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type To Chat…" style={{ flex: 1, padding: '8px', fontSize: '12px' }} />
                    <button type="submit" className="footer-tab-button" style={{ padding: '8px 16px', fontWeight: 600 }}>Send</button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── EMOJI PANEL ── */}
      {emojiOpen && (
        <div style={{ position: 'fixed', bottom: '80px', left: '16px', right: '16px', zIndex: 300, background: '#061018', border: '1px solid rgba(62,224,255,0.4)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.75)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', background: '#061018' }}>
            <button className="chat-expand-btn" style={{ width: 28, height: 28 }} onClick={() => setEmojiOpen(false)}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {['😀','😂','😍','🥰','😎','🤩','😏','😤','😡','💀','👻','👾','⚔️','🛡️','💎','🔥','⚡','❄️','🌟','💫','🏆','💰','🎯','🎮','👑','🐉','⚗️','🗡️','🏹','🪄','💥','🌀'].map(em => (
              <button key={em} onClick={() => { setChatInput(prev => prev + em); setEmojiOpen(false) }}
                style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >{em}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── WORLD MAP OVERLAY ── */}
      {mapOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '20px', color: '#fff', marginTop: '8px' }}>World Exploration</h3>
          <div style={{ width: '100%', maxWidth: '420px', maxHeight: '400px', aspectRatio: '1/1', position: 'relative' }}>
            <div className="glass-panel" style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.25)' }}>
              <canvas ref={zoneCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            </div>
          </div>
          <DPad onMove={move} onEnter={() => showToast('Interacting with sector waypoint.')} style={{ marginBottom: '8px' }} />
          <button onClick={() => setMapOverlay(false)} style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '24px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* ── CHAT OVERLAY ── */}
      {chatOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '512px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', padding: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexShrink: 0 }}>
              <button className={`chat-expand-btn inbox-btn${inboxOpen ? ' active' : ''}`} onClick={toggleInbox}>💬</button>
              {['main', 'sales', 'clan', 'groups'].map(ch => (
                <button key={ch} className={`footer-tab-button${chatChannel === ch ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => switchChannel(ch)}>
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </button>
              ))}
              <button className="chat-expand-btn" onClick={() => setChatOverlay(false)}>✕</button>
            </div>
            {!inboxOpen && (
              <div className="sub-bar" style={{ flexShrink: 0, marginBottom: '8px' }}>
                {(CHAT_SUBS[chatChannel] || []).map(([id, label]) => {
                  const name = chatChannel === 'groups' ? groupNames[id] || id : label
                  return (
                    <button key={id} className={`sub-btn${chatSub[chatChannel] === id ? ' active' : ''}`} onClick={() => setChatSub(prev => ({ ...prev, [chatChannel]: id }))}>
                      <span>{name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {renderChatContent()}
            </div>
            <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <button type="button" className="icon-btn" onClick={() => setEmojiOpen(prev => !prev)}>😀</button>
              <input type="text" className="editor-input" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type To Chat…" style={{ flex: 1, padding: '10px', fontSize: '12px' }} />
              <button type="submit" className="footer-tab-button" style={{ padding: '10px 20px', fontWeight: 600 }}>Send</button>
            </form>
          </div>
        </div>
      )}

      {/* ── ITEM MODAL ── */}
      {equipPopup && (() => {
        const modalItem = player.inventory.find((i: any) => i.instanceId === equipPopup)
        const modalBase = modalItem ? BASE_ITEMS.find(b => b.id === modalItem.baseItemId) : null
        if (!modalItem || !modalBase) return null
        const modalGems = modalItem.socketedGems || []
        const isEquipped = Object.values(player.equipment).includes(equipPopup)

        // Calculate item stat value
        const mod = { Weapon: { stat: 'WC' }, Spell: { stat: 'SC' }, Armor: { stat: 'AC' }, Helmet: { stat: 'AC' }, Boots: { stat: 'AC' }, Leggings: { stat: 'AC' }, Gauntlets: { stat: 'AC' } } as any
        const tierData = DROPPER_TIERS.find(t => t.tier === modalItem.tier) || DROPPER_TIERS[0]
        const slotMod = SLOT_MODS[modalBase.subType] || {}
        const statVal = (tierData.cv * (slotMod.prop || 0.8)).toFixed(2)
        const statLabel = slotMod.stat || 'AC'

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setEquipPopup(null)}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
              onClick={e => e.stopPropagation()}>

              {/* Close X */}
              <button onClick={() => setEquipPopup(null)}
                style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

              {/* Item name */}
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>{modalBase.name}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#3EE0FF', fontWeight: 700 }}>Tier {modalItem.tier} · {modalBase.subType}</p>
              </div>

              {/* Item icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                <ItemIcon subType={modalBase.subType} />
                <span style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(255,214,10,0.95)', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px', color: '#09090b' }}>T{modalItem.tier}</span>
              </div>

              {/* Stats */}
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Type</span>
                  <span style={{ fontSize: '13px', color: '#3EE0FF', fontWeight: 700 }}>{modalBase.subType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: modalGems.length > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{statLabel}</span>
                  <span style={{ fontSize: '13px', color: '#3EE0FF', fontWeight: 700 }}>{statVal}</span>
                </div>
                {modalGems.map((g: any, i: number) => {
                  const gd = GEMS[g.id]
                  if (!gd) return null
                  const gemColor = gd.category === 'Fighter' ? '#FF375F' : gd.category === 'Caster' ? '#0A84FF' : '#30D158'
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', padding: '1px 5px', borderRadius: '4px', background: gemColor, color: '#fff', fontWeight: 800 }}>{gd.name.slice(0,3)}</span>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{gd.name} G{g.grade}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: gemColor, fontWeight: 700, maxWidth: '120px', textAlign: 'right' }}>{gd.effect}</span>
                    </div>
                  )
                })}
              </div>

              {/* Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => equipItem(equipPopup)}
                  style={{ padding: '14px 0', borderRadius: '12px', background: isEquipped ? 'rgba(48,209,88,0.15)' : 'rgba(62,224,255,0.15)', border: `1.5px solid ${isEquipped ? '#30D158' : '#3EE0FF'}`, color: isEquipped ? '#30D158' : '#3EE0FF', fontSize: '14px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em' }}>
                  {isEquipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
                <button onClick={() => setEquipPopup(null)}
                  style={{ padding: '14px 0', borderRadius: '12px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.2)', color: '#64748b', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast */}
      {toast && (
        <div className="glass-panel" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: '72px', zIndex: 210, padding: '8px 20px', borderRadius: '9999px', fontWeight: 500, fontSize: '12px', background: 'black', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </>
      }</AuthWrapper>
  )
}

// ─── ACCORDION COMPONENT ──────────────────────────────────────
function AccordionItem({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`stat-accordion-item${open ? ' open' : ''}`}>
      <button className="stat-accordion-header" onClick={() => setOpen(!open)}>
        {title}
        <svg className="accordion-arrow" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
      </button>
      <div className="stat-accordion-content">{children}</div>
    </div>
  )
}

// ─── D-PAD COMPONENT ─────────────────────────────────────────
// Grid coords: x increases RIGHT, y increases DOWN (screen coords)
// UP = y-1, DOWN = y+1, LEFT = x-1, RIGHT = x+1
function DPad({ onMove, onEnter, style }: { onMove: (dx: number, dy: number) => void; onEnter: () => void; style?: React.CSSProperties }) {
  const btnSize = { width: '50px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 as const, cursor: 'pointer' }
  // Diagonal buttons now have the same cyan trim as cardinals
  const diagBtn: React.CSSProperties = {
    ...btnSize,
    background: 'linear-gradient(180deg, #12232d 0%, #060c10 100%)',
    border: '1.5px solid rgba(62,224,255,0.6)',
    borderRadius: '0.75rem',
    color: '#e8fbff',
    fontSize: '13px',
    boxShadow: '0 0 10px rgba(62,224,255,0.28), inset 0 1px 1px rgba(62,224,255,0.28), 0 3px 8px rgba(0,0,0,0.8)',
  }
  const cardinalBtn: React.CSSProperties = {
    ...btnSize,
    background: 'linear-gradient(180deg, #12232d 0%, #060c10 100%)',
    border: '1.5px solid rgba(62,224,255,0.85)',
    borderRadius: '0.75rem',
    color: '#e8fbff',
    boxShadow: '0 0 14px rgba(62,224,255,0.45), inset 0 1px 1px rgba(62,224,255,0.4), 0 3px 8px rgba(0,0,0,0.8)',
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gridTemplateRows: 'repeat(3, 46px)', gap: '6px', justifyContent: 'center', marginTop: '8px', ...style }}>
      {/* Row 1: ↖  UP  ↗ */}
      <div style={diagBtn} onClick={() => onMove(-1, -1)}>↖</div>
      <div style={cardinalBtn} onClick={() => onMove(0, -1)}>
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
      </div>
      <div style={diagBtn} onClick={() => onMove(1, -1)}>↗</div>
      {/* Row 2: LEFT  ENTER  RIGHT */}
      <div style={cardinalBtn} onClick={() => onMove(-1, 0)}>
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg>
      </div>
      <div style={{ ...diagBtn, border: '1.5px solid rgba(62,224,255,0.6)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.01em', color: '#d9f8ff' }} onClick={onEnter}>Enter</div>
      <div style={cardinalBtn} onClick={() => onMove(1, 0)}>
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
      </div>
      {/* Row 3: ↙  DOWN  ↘ */}
      <div style={diagBtn} onClick={() => onMove(-1, 1)}>↙</div>
      <div style={cardinalBtn} onClick={() => onMove(0, 1)}>
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
      </div>
      <div style={diagBtn} onClick={() => onMove(1, 1)}>↘</div>
    </div>
  )
}

// ─── NAME COLOR PICKER ────────────────────────────────────────
function NameColorPicker({ nameColor, onColorChange }: { nameColor: string; onColorChange: (color: string) => void }) {
  const [tab, setTab] = useState<'grid' | 'spectrum' | 'sliders'>('grid')
  const [rgb, setRgb] = useState({ r: 62, g: 224, b: 255 })
  const [opacity, setOpacity] = useState(100)
  const wheelRef = useRef<HTMLCanvasElement>(null)

  const hsvToHex = (h: number, s: number, v: number) => {
    const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
    return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`
  }

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')

  const applyColor = (hex: string) => {
    onColorChange(hex)
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    setRgb({ r, g, b })
  }

  // Build color grid
  const hues = [205, 225, 255, 280, 320, 0, 22, 35, 48, 72, 118, 150]
  const gridColors: string[] = []
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 12; col++) {
      if (row === 0) {
        const steps = [255, 235, 209, 199, 174, 142, 99, 72, 58, 44, 28, 0]
        gridColors.push(rgbToHex(steps[col], steps[col], steps[col]))
      } else {
        const v = [0.28, 0.38, 0.48, 0.58, 0.70, 0.82, 0.92, 0.97, 1][row - 1]
        const s = [1, 1, 1, 1, 1, 0.95, 0.72, 0.45, 0.28][row - 1]
        gridColors.push(hsvToHex(hues[col], s, v))
      }
    }
  }

  // Draw spectrum wheel
  useEffect(() => {
    if (tab !== 'spectrum' || !wheelRef.current) return
    const canvas = wheelRef.current
    const ctx = canvas.getContext('2d')!
    const size = canvas.width; const cx = size / 2; const cy = size / 2; const radius = size / 2 - 4
    const img = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx; const dy = y - cy; const dist = Math.sqrt(dx * dx + dy * dy)
        const i = (y * size + x) * 4
        if (dist > radius) { img.data[i + 3] = 0; continue }
        let hue = Math.atan2(dy, dx) * 180 / Math.PI; if (hue < 0) hue += 360
        const hex = hsvToHex(hue, dist / radius, 1)
        img.data[i] = parseInt(hex.slice(1, 3), 16)
        img.data[i + 1] = parseInt(hex.slice(3, 5), 16)
        img.data[i + 2] = parseInt(hex.slice(5, 7), 16)
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [tab])

  const handleWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = wheelRef.current!; const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    const x = (e.clientX - rect.left) * scale; const y = (e.clientY - rect.top) * scale
    const cx = canvas.width / 2; const cy = canvas.height / 2; const radius = canvas.width / 2 - 4
    const dx = x - cx; const dy = y - cy; const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > radius) return
    let hue = Math.atan2(dy, dx) * 180 / Math.PI; if (hue < 0) hue += 360
    applyColor(hsvToHex(hue, dist / radius, 1))
  }

  const presets = ['#000000', '#0A84FF', '#30D158', '#FFD60A', '#FF3B30', '#BF5AF2', '#FF9F0A', '#FFFFFF', '#FF375F', '#A2845E']

  return (
    <div style={{ background: '#1c1c1e', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', padding: '14px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button style={{ width: 32, height: 32, borderRadius: '50%', background: '#2c2c2e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2"><path d="M2 22l5.5-5.5"/><path d="M18.4 3.6a2.8 2.8 0 014 4L8 22H4v-4L18.4 3.6z"/></svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 600, color: '#fff' }}>Colors</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Segmented control */}
      <div style={{ background: '#2c2c2e', borderRadius: '9px', padding: '2px', display: 'flex', marginBottom: '12px' }}>
        {(['grid', 'spectrum', 'sliders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: 'none', background: tab === t ? '#636366' : 'transparent', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '6px 0', borderRadius: '7px', cursor: 'pointer' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {tab === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0, borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
          {gridColors.map((c, i) => (
            <button key={i} onClick={() => applyColor(c)} style={{ aspectRatio: '1', background: c, border: 'none', cursor: 'pointer', padding: 0, display: 'block' }} />
          ))}
        </div>
      )}

      {/* Spectrum */}
      {tab === 'spectrum' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
          <canvas ref={wheelRef} width={240} height={240} style={{ width: '240px', height: '240px', borderRadius: '50%', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
            onClick={handleWheelClick} onMouseMove={e => { if (e.buttons) handleWheelClick(e) }} />
        </div>
      )}

      {/* Sliders */}
      {tab === 'sliders' && (
        <div style={{ marginBottom: '12px' }}>
          {(['r', 'g', 'b'] as const).map(ch => (
            <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '13px', color: '#fff' }}>
              <span style={{ width: '12px' }}>{ch.toUpperCase()}</span>
              <input type="range" min="0" max="255" value={rgb[ch]} onChange={e => {
                const v = parseInt(e.target.value)
                const nr = { ...rgb, [ch]: v }
                setRgb(nr)
                applyColor(rgbToHex(nr.r, nr.g, nr.b))
              }} style={{ flex: 1 }} />
              <input type="number" min="0" max="255" value={rgb[ch]} onChange={e => {
                const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                const nr = { ...rgb, [ch]: v }
                setRgb(nr)
                applyColor(rgbToHex(nr.r, nr.g, nr.b))
              }} style={{ width: '52px', background: '#2c2c2e', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px', textAlign: 'center', fontSize: '13px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Opacity */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.05em', color: '#8e8e93', marginBottom: '4px' }}>OPACITY</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: '12px', background: '#2c2c2e', borderRadius: '8px', padding: '4px 8px', color: '#fff', minWidth: '48px', textAlign: 'center' }}>{opacity}%</span>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

      {/* Preview + presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '8px', background: nameColor, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {presets.map(c => (
            <button key={c} onClick={() => applyColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
