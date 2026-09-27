import { useState, useEffect, useRef, useCallback } from 'react'
import { auth } from './firebase/index'
import { signOut } from 'firebase/auth'

// ── Layer 1: Data ─────────────────────────────────────────────────────────────
import { RACES } from './game/data/races'
import { GDD, RARITY_COLORS, CHAT_SUBS, EQUIP_SLOTS, INVENTORY_BAGS, GEM_POUCH_MAX } from './game/data/constants'

// ── Layer 2: Types ────────────────────────────────────────────────────────────
import type { Player, Monster, MonsterInstance, CombatAction, GemInstance } from './game/types'

// ── Layer 3: Rules ────────────────────────────────────────────────────────────
import { calcDerived, clampHp } from './game/rules/derived'
import { performTurn, getLevelBankLimit, getBankedLevels } from './game/rules/combat'
import { spendPoint, getAttributeFocusOrder, canAllocate, freeLevels } from './game/rules/attributes'
import { applyKillRewards, xpProgressPct, hpProgressPct, fmt } from './game/rules/xp'

// ── Layer 4: Persist ──────────────────────────────────────────────────────────
import { loadPlayer, savePlayer } from './game/persist/api'

// ── Layer 5: Components ───────────────────────────────────────────────────────
import { CombatConsole } from './game/components/CombatConsole'
import { InventoryPanel } from './game/components/InventoryPanel'
import { EquipmentGrid } from './game/components/EquipmentGrid'
import { ChatConsole } from './game/components/ChatConsole'
import { ItemModal } from './game/components/ItemModal'
import { DPad } from './game/components/DPad'
import { AccordionItem } from './game/components/AccordionItem'
import { ItemIcon } from './game/components/ItemIcon'

// ── Static game data (to be moved to data files later) ───────────────────────
const GEMS: Record<string, { name: string; category: string; color: string; effect: string }> = {
  warStone:     { name: 'WarStone',      category: 'Fighter', color: 'Red',    effect: 'Increase Base Weapon Class' },
  mightrite:    { name: 'Mightrite',     category: 'Fighter', color: 'Red',    effect: 'Increase Dexterity' },
  mightStone:   { name: 'MightStone',    category: 'Fighter', color: 'Red',    effect: 'Increase Strength' },
  loreStone:    { name: 'LoreStone',     category: 'Caster',  color: 'Blue',   effect: 'Increase Base Spell Class' },
  mindrite:     { name: 'Mindrite',      category: 'Caster',  color: 'Blue',   effect: 'Increase Wisdom' },
  mindStone:    { name: 'MindStone',     category: 'Caster',  color: 'Blue',   effect: 'Increase Intelligence' },
  obsidianHeart:{ name: 'Obsidian Heart',category: 'Misc',    color: 'Green',  effect: 'Increase Base Armor Class' },
  spikeCore:    { name: 'Spike-Core',    category: 'Misc',    color: 'Yellow', effect: 'Increase Critical Hit Chance' },
  trueCore:     { name: 'True-Core',     category: 'Misc',    color: 'Green',  effect: 'Increase Hit Chance' },
  vitalCore:    { name: 'Vital-Core',    category: 'Misc',    color: 'Green',  effect: 'Increase Vitality' },
  treasureCore: { name: 'Treasure-Core', category: 'Misc',    color: 'Yellow', effect: 'Increase Drop Chance' },
}

const BASE_ITEMS = [
  { id: 'base_helm_1',      name: 'Silver Crest Helm',         type: 'Armor',    subType: 'Helmet',    sockets: 2 },
  { id: 'base_armor_1',     name: 'Chroma Glass Cuirass',      type: 'Armor',    subType: 'Armor',     sockets: 2 },
  { id: 'base_gauntlets_1', name: 'Platinum Gauntlets',        type: 'Armor',    subType: 'Gauntlets', sockets: 2 },
  { id: 'base_leggings_1',  name: 'Obsidian Weave Leggings',   type: 'Armor',    subType: 'Leggings',  sockets: 2 },
  { id: 'base_boots_1',     name: 'Liquid Glass Boots',        type: 'Armor',    subType: 'Boots',     sockets: 2 },
  { id: 'base_sword_1',     name: 'Quicksilver Blade',         type: 'Weapons',  subType: 'Sword',     sockets: 2 },
  { id: 'base_axe_1',       name: 'Brutal War Axe',            type: 'Weapons',  subType: 'Axe',       sockets: 2 },
  { id: 'base_staff_1',     name: 'Monochrome Siphon',         type: 'Weapons',  subType: 'Staff',     sockets: 2 },
  { id: 'base_firespell_1', name: 'Pyroclastic Surge',         type: 'Spells',   subType: 'Fire',      sockets: 2 },
  { id: 'base_airspell_1',  name: 'Zephyr Vortex',             type: 'Spells',   subType: 'Air',       sockets: 2 },
  { id: 'base_deathspell_1',name: 'Void Reaping',              type: 'Spells',   subType: 'Death',     sockets: 2 },
  { id: 'base_accessory_1', name: 'Aether Rune Matrix',        type: 'Accessory',subType: 'Rune',      sockets: 2 },
  { id: 'base_amulet_1',    name: 'Platinum Pendant',          type: 'Amulet',   subType: 'Amulet',    sockets: 2 },
  { id: 'base_ring_1',      name: 'Polished Silver Ring',      type: 'Ring',     subType: 'Ring',      sockets: 2 },
]

const DROPPER_CVS: Record<number, number> = {
  1: 13.00, 2: 15.86, 3: 19.35, 4: 23.61, 5: 28.80,
  6: 35.14, 7: 42.87, 8: 52.30, 9: 63.81, 10: 77.85,
}

const SLOT_MODS: Record<string, { stat: 'AC' | 'WC' | 'SC'; prop: number }> = {
  Armor: { stat: 'AC', prop: 1.00 }, Helmet: { stat: 'AC', prop: 0.75 },
  Boots: { stat: 'AC', prop: 0.75 }, Leggings: { stat: 'AC', prop: 0.50 },
  Gauntlets: { stat: 'AC', prop: 0.50 }, Gloves: { stat: 'AC', prop: 0.50 },
  Sword: { stat: 'WC', prop: 1.00 }, Axe: { stat: 'WC', prop: 1.00 },
  Fire: { stat: 'SC', prop: 1.00 }, Air: { stat: 'SC', prop: 1.00 },
  Death: { stat: 'SC', prop: 1.00 }, Staff: { stat: 'SC', prop: 1.00 },
}

// Z01 monster pack — starter zone
const BESTIARY_Z01: Monster[] = [
  { id: 'E01', name: 'Glass Construct', hp: 25,  atk: 10, def: 13, xp: 18,  gold: 8,  drop: { name: 'Glass Construct Core',  rarity: 'Common'   } },
  { id: 'E02', name: 'Mercury Sprite',  hp: 32,  atk: 12, def: 15, xp: 24,  gold: 12, drop: { name: 'Mercury Essence',       rarity: 'Uncommon' } },
  { id: 'E03', name: 'Mirror Gargoyle', hp: 45,  atk: 15, def: 18, xp: 36,  gold: 20, drop: { name: 'Polished Mirror Shard', rarity: 'Rare'     } },
  { id: 'E04', name: 'Prism Titan',     hp: 75,  atk: 22, def: 25, xp: 120, gold: 75, drop: { name: "Titan's Prism Heart",   rarity: 'Epic'     } },
]

// ── Item lookup helpers (passed as props — no logic in components) ─────────────
function makeItemLookups(inventory: Player['inventory']) {
  const getItemCV = (instanceId: string) => {
    const item = inventory.find(i => i.instanceId === instanceId)
    if (!item) return null
    const base = BASE_ITEMS.find(b => b.id === item.baseItemId)
    if (!base) return null
    return { cv: DROPPER_CVS[item.tier] ?? 13.00, subType: base.subType }
  }
  const getItemName    = (id: string) => { const item = inventory.find(i => i.instanceId === id); const base = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null; return base?.name ?? 'Unknown Item' }
  const getItemSubType = (id: string) => { const item = inventory.find(i => i.instanceId === id); const base = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null; return base?.subType ?? '' }
  const getItemTier    = (id: string) => inventory.find(i => i.instanceId === id)?.tier ?? 1
  const getItemGems    = (id: string) => inventory.find(i => i.instanceId === id)?.socketedGems ?? []
  const getItemStatLabel = (id: string) => { const item = inventory.find(i => i.instanceId === id); const base = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null; return SLOT_MODS[base?.subType ?? '']?.stat ?? 'AC' }
  const getItemStatValue = (id: string) => { const item = inventory.find(i => i.instanceId === id); const base = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null; if (!item || !base) return '0'; const mod = SLOT_MODS[base.subType]; if (!mod) return '0'; return (( DROPPER_CVS[item.tier] ?? 13) * mod.prop).toFixed(2) }
  return { getItemCV, getItemName, getItemSubType, getItemTier, getItemGems, getItemStatLabel, getItemStatValue }
}

// ── Gem lookup helpers ────────────────────────────────────────────────────────
const getGemName     = (id: string) => GEMS[id]?.name ?? 'Unknown Gem'
const getGemColor    = (id: string) => { const c = GEMS[id]?.color; return c === 'Red' ? '#FF375F' : c === 'Blue' ? '#0A84FF' : c === 'Yellow' ? '#FFD60A' : '#30D158' }
const getGemCategory = (id: string): 'fighter' | 'caster' | 'misc' => { const cat = GEMS[id]?.category?.toLowerCase(); return cat === 'fighter' ? 'fighter' : cat === 'caster' ? 'caster' : 'misc' }
const getGemEffect   = (id: string) => GEMS[id]?.effect ?? ''

// ── SAVE CADENCE ──────────────────────────────────────────────────────────────
// Save on: level-up, stat spend, equip/unequip, every 5 kills, tab-hide, logout
const KILL_SAVE_INTERVAL = 5

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App({ uid }: { uid: string }) {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [player, setPlayer]       = useState<Player | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const playerRef = useRef<Player | null>(null)
  useEffect(() => { playerRef.current = player }, [player])

  // ── UI state ────────────────────────────────────────────────────────────────
  const [theme, setTheme]         = useState('aether')
  const [toast, setToast]         = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mapOverlay, setMapOverlay]   = useState(false)
  const [chatOverlay, setChatOverlay] = useState(false)

  // ── Combat state ────────────────────────────────────────────────────────────
  const [engaged, setEngaged]               = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState('E01')
  const [combatMonster, setCombatMonster]   = useState<MonsterInstance | null>(null)
  const [combatLog, setCombatLog]           = useState<{ text: string; color: string }[]>([])
  const [enemyCurrentHP, setEnemyCurrentHP] = useState<number | null>(null)
  const [lastItem, setLastItem]             = useState('None')
  const [lastItemColor, setLastItemColor]   = useState('#8FA8C7')
  const [lastGem, setLastGem]               = useState('None')
  const [lastGemColor, setLastGemColor]     = useState('#8FA8C7')
  const sessionKillsRef = useRef(0)

  // ── Inventory/equipment state ────────────────────────────────────────────────
  const [equipPopup, setEquipPopup]   = useState<string | null>(null)
  const [filterState, setFilterState] = useState({ category: 'All', subType: 'All', tier: 'All', quality: 'All', sortBy: 'tier', order: 'desc' })

  // ── Chat state ───────────────────────────────────────────────────────────────
  const [chatChannel, setChatChannel] = useState('main')
  const [chatSub, setChatSub]         = useState<Record<string, string>>({ main: 'feed', sales: 'chat', clan: 'chat', groups: 'g1' })
  const [chatMessages, setChatMessages] = useState<Record<string, { sender: string; text: string; color: string }[]>>({
    main: [{ sender: 'System', text: 'Welcome to Geminus. Transmission systems online.', color: '#3EE0FF' }],
    sales: [], clan: [], groups: [], g1: [], g2: [], g3: [], g4: [],
  })
  const [chatInput, setChatInput]     = useState('')
  const [emojiOpen, setEmojiOpen]     = useState(false)
  const [inboxOpen, setInboxOpen]     = useState(false)
  const [chatNameColor, setChatNameColor] = useState('#3EE0FF')
  const [groupNames]                  = useState<Record<string, string>>({ g1: 'Group-1', g2: 'Group-2', g3: 'Group-3', g4: 'Group-4' })

  // ── Canvas refs ──────────────────────────────────────────────────────────────
  const smokeRef   = useRef<HTMLCanvasElement>(null)
  const miniMapRef = useRef<HTMLCanvasElement>(null)
  const zoneCanvasRef = useRef<HTMLCanvasElement>(null)

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }, [])

  // ── Theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('g_theme') || 'aether'
    setTheme(saved)
    document.documentElement.classList.toggle('theme-onyx', saved === 'onyx')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-onyx', theme === 'onyx')
    localStorage.setItem('g_theme', theme)
  }, [theme])

  // ── Meta theme color ─────────────────────────────────────────────────────────
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!meta) { meta = document.createElement('meta') as HTMLMetaElement; meta.name = 'theme-color'; document.head.prepend(meta) }
    meta.content = '#03080c'
  }, [])

  // ── Load player ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadPlayer(uid)
      .then(p => setPlayer(p))
      .catch(err => setLoadError(err?.message ?? 'Failed to load character.'))
  }, [uid])

  // ── Tab-hide save ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'hidden' && playerRef.current) savePlayer(playerRef.current, 'tab-hidden') }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // ── Smoke canvas ─────────────────────────────────────────────────────────────
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
        if (this.x < -this.size*1.5 || this.x > canvas.width+this.size*1.5 || this.y < -this.size*1.5 || this.y > canvas.height+this.size*1.5) Object.assign(this, new Smoke())
      }
      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot)
        const g = ctx.createRadialGradient(0,0,0,0,0,this.size)
        if (this.type === 'black') { g.addColorStop(0,`rgba(0,0,0,${this.alpha*1.4})`); g.addColorStop(0.5,`rgba(0,0,0,${this.alpha*0.7})`); g.addColorStop(1,'rgba(0,0,0,0)') }
        else if (this.type === 'white') { g.addColorStop(0,`rgba(${this.r},${this.g},${this.b},${this.alpha*1.2})`); g.addColorStop(0.4,`rgba(200,210,225,${this.alpha*0.5})`); g.addColorStop(1,'rgba(255,255,255,0)') }
        else { g.addColorStop(0,`rgba(${this.r},${this.g},${this.b},${this.alpha*1.3})`); g.addColorStop(0.5,`rgba(5,5,8,${this.alpha*0.6})`); g.addColorStop(1,'rgba(0,0,0,0)') }
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,this.size,0,Math.PI*2); ctx.fill(); ctx.restore()
      }
    }
    const particles = Array.from({ length: 40 }, (_, i) => new Smoke(true))
    let id: number
    const animate = () => { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.update(); p.draw() }); id = requestAnimationFrame(animate) }
    animate()
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize) }
  }, [])

  // ── Mini map canvas ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!miniMapRef.current || !player) return
    const canvas = miniMapRef.current; const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const w = canvas.offsetWidth; const h = canvas.offsetHeight
    ctx.clearRect(0,0,w,h); ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h)
    ctx.fillStyle = '#3EE0FF'; ctx.shadowBlur = 8; ctx.shadowColor = '#3EE0FF'
    ctx.beginPath(); ctx.arc(w/2, h/2, 5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0
  }, [player, activeTab])

  // ── Zone canvas ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!zoneCanvasRef.current || !player || !mapOverlay) return
    const canvas = zoneCanvasRef.current; const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const w = canvas.offsetWidth; const h = canvas.offsetHeight
    ctx.clearRect(0,0,w,h)
    const t = 28; const pos = player.pos
    const ox = w/2 - pos.x*t - t/2; const oy = h/2 - pos.y*t - t/2
    ctx.save(); ctx.translate(ox, oy)
    for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
      const cur = x === pos.x && y === pos.y
      if (cur) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x*t,y*t,t,t) }
      ctx.strokeStyle = cur ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(x*t,y*t,t,t)
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pos.x*t+t/2, pos.y*t+t/2, t*0.32, 0, Math.PI*2); ctx.fill(); ctx.restore()
  }, [player, mapOverlay])

  // ── Loading / error screen ────────────────────────────────────────────────────
  if (!player) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', padding:'24px', background:'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif' }}>
      <h1 style={{ fontSize:'28px', fontWeight:900, color:'#3EE0FF', letterSpacing:'0.14em', margin:0, textShadow:'0 0 30px rgba(62,224,255,0.5)' }}>GEMINUS</h1>
      {loadError
        ? <><p style={{ color:'#f87171', fontSize:'13px', textAlign:'center', maxWidth:'320px', lineHeight:1.5, margin:0 }}>{loadError}</p>
            <button onClick={() => window.location.reload()} style={{ padding:'10px 24px', borderRadius:'10px', background:'rgba(62,224,255,0.1)', border:'1px solid rgba(62,224,255,0.4)', color:'#3EE0FF', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>Retry</button></>
        : <p style={{ color:'#64748b', fontSize:'12px', letterSpacing:'0.08em', margin:0 }}>Loading your character...</p>
      }
      <button onClick={async () => { try { await signOut(auth) } catch {} window.location.replace(window.location.origin) }}
        style={{ marginTop:'8px', background:'rgba(255,55,95,0.1)', border:'1px solid rgba(255,55,95,0.3)', borderRadius:'8px', color:'#f87171', fontSize:'13px', fontWeight:700, cursor:'pointer', padding:'10px 28px' }}>Sign Out</button>
    </div>
  )

  // ── Item lookups ──────────────────────────────────────────────────────────────
  const { getItemCV, getItemName, getItemSubType, getItemTier, getItemGems, getItemStatLabel, getItemStatValue } = makeItemLookups(player.inventory)

  // ── calcDerived helper ────────────────────────────────────────────────────────
  const recalc = (p: Player): Player => {
    const derived = calcDerived(p, getItemCV)
    return { ...p, derivedStats: derived, hp: clampHp(p.hp, derived.maxHp) }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!window.confirm('Log out of Geminus?')) return
    await savePlayer(player, 'logout')
    signOut(auth).then(() => window.location.reload()).catch(() => window.location.reload())
  }

  const handleThemeToggle = () => {
    const next = theme === 'onyx' ? 'aether' : 'onyx'
    setTheme(next)
    showToast(next === 'onyx' ? 'Dark Mode on — Onyx HUD' : 'Aether glass restored')
  }

  const handleMove = (dx: number, dy: number) => {
    setPlayer(p => p ? { ...p, pos: { x: Math.max(0,Math.min(15,p.pos.x+dx)), y: Math.max(0,Math.min(15,p.pos.y-dy)) } } : p)
  }

  const handleSpendPoint = (stat: string) => {
    const raceData = RACES[player.race] || RACES.human
    const updated = recalc(spendPoint(player, stat, raceData))
    setPlayer(updated)
    savePlayer(updated, 'stat-spend')
    showToast(`${stat} upgraded!`)
  }

  const handleEngage = () => {
    if (engaged) {
      setEngaged(false); setEnemyCurrentHP(null); setCombatLog([])
      setCombatMonster(null); return
    }
    const target = BESTIARY_Z01.find(m => m.id === selectedTargetId) || BESTIARY_Z01[0]
    if (!target) { showToast('Select a target first.'); return }
    setCombatMonster({ ...target, currentHP: target.hp })
    setEnemyCurrentHP(target.hp)
    setCombatLog([])
    setEngaged(true)
  }

  const handleTargetChange = (id: string) => {
    setSelectedTargetId(id)
    if (engaged) { setEngaged(false); setEnemyCurrentHP(null); setCombatLog([]); setCombatMonster(null) }
  }

  const handleCombatAction = (action: CombatAction) => {
    if (!engaged || !combatMonster) return

    const result = performTurn(player, combatMonster, action, {
      resolveItemDrop: (m) => m.drop,
      resolveGemDrop: () => {
        if (Math.random() < 0.35) {
          const allGems = Object.keys(GEMS)
          const id = allGems[Math.floor(Math.random() * allGems.length)]
          if (player.gems.length < GEM_POUCH_MAX) return { id, grade: 1 }
        }
        return null
      },
    })

    setCombatLog(result.logLines)

    if (result.bankFull) {
      setEngaged(false); setEnemyCurrentHP(null); setCombatMonster(null)
      const updated = recalc({ ...player, hp: result.playerHpAfter })
      setPlayer(updated); savePlayer(updated, 'bank-full'); return
    }

    if (result.monsterDied) {
      setEngaged(false); setEnemyCurrentHP(null); setCombatMonster(null)

      // Apply rewards
      let updated = applyKillRewards(player, result.xpGained, result.goldGained)

      // Add gem drop
      if (result.gemDrop && updated.gems.length < GEM_POUCH_MAX) {
        updated = { ...updated, gems: [...updated.gems, result.gemDrop] }
        setLastGem(`${getGemName(result.gemDrop.id)} G${result.gemDrop.grade}`)
        setLastGemColor(RARITY_COLORS['Rare'])
      }

      // Track last item drop
      if (result.drop) {
        setLastItem(result.drop.name)
        setLastItemColor(RARITY_COLORS[result.drop.rarity] || '#8FA8C7')
      }

      updated = recalc(updated)
      setPlayer(updated)

      sessionKillsRef.current += 1
      if (result.leveledUp || sessionKillsRef.current % KILL_SAVE_INTERVAL === 0) {
        savePlayer(updated, result.leveledUp ? 'level-up' : 'kill-checkpoint')
      }
    } else if (result.playerDied) {
      setEngaged(false); setEnemyCurrentHP(null); setCombatMonster(null)
      const updated = recalc({ ...player, hp: result.playerHpAfter })
      setPlayer(updated); savePlayer(updated, 'death')
    } else {
      // Combat continues — update HP values
      setCombatMonster(prev => prev ? { ...prev, currentHP: result.monsterHpAfter } : null)
      setEnemyCurrentHP(Math.max(0, Math.round(result.monsterHpAfter)))
      const updated = recalc({ ...player, hp: result.playerHpAfter })
      setPlayer(updated)
    }
  }

  const handleEquip = (instanceId: string) => {
    const item = player.inventory.find(i => i.instanceId === instanceId)
    const base = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null
    if (!item || !base) return
    const slotMap: Record<string, string> = {
      Sword: 'Weapon 1', Axe: 'Weapon 1', Staff: 'Weapon 1',
      Armor: 'Armor', Helmet: 'Helmet', Gauntlets: 'Gloves',
      Leggings: 'Leggings', Boots: 'Boots',
      Fire: 'Spell 1', Air: 'Spell 2', Death: 'Spell 1',
      Amulet: 'Amulet', Ring: 'Ring', Rune: 'Accessory',
    }
    const slot = slotMap[base.subType]
    if (!slot) return
    const updated = recalc({ ...player, equipment: { ...player.equipment, [slot]: instanceId } })
    setPlayer(updated); setEquipPopup(null)
    savePlayer(updated, 'equip'); showToast(`${base.name} equipped to ${slot}.`)
  }

  const handleUnequip = (instanceId: string) => {
    const eq = { ...player.equipment }
    for (const slot in eq) if (eq[slot] === instanceId) eq[slot] = null
    const updated = recalc({ ...player, equipment: eq })
    setPlayer(updated); savePlayer(updated, 'unequip')
    showToast('Item unequipped.')
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault(); if (!chatInput.trim()) return
    const key = chatChannel === 'groups' ? chatSub[chatChannel] : chatChannel
    setChatMessages(prev => ({ ...prev, [key]: [...(prev[key] || []).slice(-149), { sender: player.name, text: chatInput.trim(), color: chatNameColor }] }))
    setChatInput('')
  }

  const handleEmojiSelect = (emoji: string) => {
    setChatInput(prev => prev + emoji)
    setEmojiOpen(false)
  }

  // ── Derived display values ────────────────────────────────────────────────────
  const hpPct    = hpProgressPct(player)
  const xpPct    = xpProgressPct(player)
  const fLevels  = freeLevels(player)
  const canAlloc = canAllocate(player)
  const focusOrder = getAttributeFocusOrder(player.archetype, player.race)
  const isEquipped = (id: string) => Object.values(player.equipment).includes(id)

  // ── NameColorPicker (inline — small enough to keep here) ──────────────────────
  const nameColorPicker = (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px', padding:'8px' }}>
      <span style={{ fontSize:'11px', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Chat Name Color</span>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
        {['#3EE0FF','#FF375F','#30D158','#FFD60A','#0A84FF','#BF5AF2','#FF9500','#ffffff'].map(c => (
          <button key={c} onClick={() => { setChatNameColor(c); localStorage.setItem('g_name', c) }}
            style={{ width:28, height:28, borderRadius:'50%', background:c, border: chatNameColor === c ? '2px solid white' : '2px solid transparent', cursor:'pointer' }} />
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
        <span style={{ fontSize:'12px', color:chatNameColor, fontWeight:800 }}>{player.name}</span>
        <span style={{ fontSize:'11px', color:'#64748b' }}>preview</span>
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <canvas ref={smokeRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:-1, pointerEvents:'none', opacity:0.9 }} />

      <div style={{ width:'100%', minHeight:'100dvh', maxWidth:'512px', margin:'0 auto', display:'flex', flexDirection:'column', background:'transparent' }}
        onClick={e => {
          if (equipPopup && !(e.target as HTMLElement).closest('.inventory-slot')) setEquipPopup(null)
          if (menuOpen && !(e.target as HTMLElement).closest('.menu-container')) setMenuOpen(false)
        }}>

        <div style={{ position:'relative', zIndex:10, width:'100%', flex:1, display:'flex', flexDirection:'column', padding:'10px', paddingTop:'max(10px, env(safe-area-inset-top, 10px))', gap:'10px', paddingBottom:'20px' }}>

          {/* ── HUD Header ── */}
          {activeTab === null && (
            <header className="glass-panel" style={{ flexShrink:0, position:'relative', zIndex:30, padding:'10px', display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ display:'flex', alignItems:'stretch', justifyContent:'space-between', gap:'8px' }}>

                {/* Left: player info */}
                <section style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:'4px' }}>
                  <p style={{ margin:0, fontSize:'12px' }}><span style={{ color:'#fff', fontWeight:700 }}>{player.name}:</span><span style={{ color:'#cbd5e1', fontSize:'10.5px', marginLeft:'4px' }}>Level {player.level}</span></p>
                  <p style={{ margin:0, fontSize:'12px' }}><span style={{ color:'#fff', fontWeight:700 }}>Race:</span><span style={{ color:'#cbd5e1', fontSize:'10.5px', marginLeft:'4px' }}>{player.raceName}</span></p>
                  <p style={{ margin:0, fontSize:'12px' }}><span style={{ color:'#fff', fontWeight:700 }}>A-Spec:</span><span style={{ color:'#cbd5e1', fontSize:'10.5px', marginLeft:'4px' }}>{player.archetype} · {player.cci}</span></p>

                  {/* Base stats grid */}
                  <div style={{ paddingTop:'4px', marginTop:'2px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 10px' }}>
                    {(['DEX','STR','WIS','NTL','VIT'] as const).map(stat => (
                      <div key={stat} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px' }}>
                        <span style={{ color:'#fff', fontWeight:700 }}>{stat}:</span>
                        <span style={{ color:'#cbd5e1', fontSize:'10.5px', fontFamily:'monospace' }}>{fmt(player.baseStats[stat])}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', alignItems:'center', fontSize:'12px' }}>
                      <span style={{ color:'#fff', fontWeight:700, marginRight:'4px' }}>Lvls:</span>
                      <span style={{ color:'#cbd5e1', fontSize:'10.5px', fontFamily:'monospace' }}>{fLevels} ({player.attributePoints} AP)</span>
                    </div>
                  </div>

                  {/* Gold / Bank */}
                  <div style={{ paddingTop:'4px', marginTop:'4px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', gap:'4px' }}>
                    <div className="info-cell" style={{ padding:'4px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}><span style={{ color:'#FFD60A', fontWeight:700, fontSize:'11px' }}>Gold:</span><span style={{ color:'#FFD60A', fontFamily:'monospace', fontWeight:700, fontSize:'11px' }}>{fmt(player.gold)}</span></div>
                    <div className="info-cell" style={{ padding:'4px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}><span style={{ color:'#FFD60A', fontWeight:700, fontSize:'11px' }}>Bank:</span><span style={{ color:'#FFD60A', fontFamily:'monospace', fontWeight:700, fontSize:'11px' }}>{fmt(player.bank)}</span></div>
                  </div>

                  {/* Menu */}
                  <div className="menu-container" style={{ paddingTop:'4px', position:'relative' }}>
                    <button className="battle-mode-btn" style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={() => setMenuOpen(p => !p)}>
                      <span style={{ fontSize:'13px' }}>≡</span> Menu
                    </button>
                    {menuOpen && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:100, background:'rgba(3,12,20,0.97)', border:'1px solid rgba(62,224,255,0.42)', borderRadius:'12px', overflow:'hidden', boxShadow:'0 8px 28px rgba(0,0,0,0.9)' }}>
                        {([['stats','👤','Player Info'],['training','📊','Training Log'],['settings','⚙️','Settings'],['equipment','🛡️','Equipment'],['inventory','🎒','Inventory']] as const).map(([tab, icon, label]) => (
                          <button key={tab} onClick={() => { setActiveTab(tab); setMenuOpen(false) }}
                            style={{ width:'100%', padding:'10px 14px', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.08)', color:'#e8fbff', fontSize:'12px', fontWeight:600, textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(62,224,255,0.1)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            {icon} {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Zone info */}
                  <div style={{ paddingTop:'6px', marginTop:'4px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', gap:'3px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <p style={{ margin:0, fontSize:'10.5px' }}><span style={{ color:'#fff', fontWeight:700 }}>Zone:</span> <span style={{ color:'#cbd5e1' }}>Aether Silver Cavern</span></p>
                      <button onClick={handleLogout} style={{ fontSize:'9px', fontWeight:800, padding:'3px 7px', borderRadius:'6px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.5)', color:'#fca5a5', cursor:'pointer', letterSpacing:'0.03em' }}>Logout</button>
                    </div>
                    <p style={{ margin:0, fontSize:'9.5px', color:'#94a3b8', fontFamily:'monospace' }}>[{player.pos.x}, {player.pos.y}]</p>
                  </div>
                </section>

                {/* Right: mini map + D-pad */}
                <section style={{ width:'162px', flexShrink:0, display:'flex', flexDirection:'column', borderLeft:'1px solid rgba(255,255,255,0.1)', marginLeft:'6px', paddingLeft:'8px' }}>
                  <div onClick={() => setMapOverlay(true)} style={{ cursor:'pointer', width:'100%', aspectRatio:'1/1', position:'relative', overflow:'hidden', borderRadius:'10px', border:'1.5px dashed rgba(62,224,255,0.5)', boxShadow:'0 0 12px rgba(62,224,255,0.2)', flexShrink:0 }}>
                    <canvas ref={miniMapRef} style={{ width:'100%', height:'100%', display:'block' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', marginTop:'6px' }}>
                    <DPad onMove={handleMove} onEnter={() => showToast('Interacting with sector waypoint.')} />
                  </div>
                </section>
              </div>
            </header>
          )}

          {/* ── Stats panel ── */}
          {activeTab === null && (
            <section className="glass-panel" style={{ flexShrink:0, padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {/* HP bar */}
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'13px' }}>
                  <span style={{ color:'#fff', fontWeight:700 }}>Health:</span>
                  <span style={{ fontFamily:'monospace', fontWeight:700, color:'#30D158' }}>{fmt(player.hp)} / {fmt(player.derivedStats.maxHp)}</span>
                </div>
                <div style={{ width:'100%', background:'rgba(0,0,0,0.8)', borderRadius:'9999px', height:'7px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ height:'100%', borderRadius:'9999px', width:`${hpPct}%`, background:'#30D158', boxShadow:'0 0 10px rgba(48,209,88,0.6)', transition:'width 0.3s' }} />
                </div>
              </div>
              {/* XP bar */}
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'12px' }}>
                  <span style={{ color:'#fff', fontWeight:700 }}>XP: <span style={{ color:'#cbd5e1', fontFamily:'monospace', fontWeight:400 }}>{fmt(player.xp)}</span></span>
                  <span style={{ color:'#94a3b8' }}>Next: <span style={{ color:'#cbd5e1', fontFamily:'monospace' }}>{fmt(player.xpToNextLevel)}</span></span>
                </div>
                <div style={{ width:'100%', background:'rgba(0,0,0,0.8)', borderRadius:'9999px', height:'7px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ height:'100%', borderRadius:'9999px', width:`${xpPct}%`, background:'linear-gradient(90deg, #FF6B00, #FF9500)', boxShadow:'0 0 10px rgba(255,149,0,0.6)', transition:'width 0.3s' }} />
                </div>
              </div>
              {/* Last drops */}
              <div style={{ display:'flex', flexDirection:'column', gap:'3px', paddingTop:'6px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                  <span style={{ color:'#fff', fontWeight:600 }}>Last Item: <span style={{ color:lastItemColor, fontWeight:700 }}>{lastItem}</span></span>
                  <span style={{ color:'#94a3b8' }}>Level: <span style={{ color:'#fff', fontWeight:800, fontFamily:'monospace' }}>{player.level}</span></span>
                </div>
                <span style={{ color:'#fff', fontWeight:600, fontSize:'12px' }}>Last Gem: <span style={{ color:lastGemColor, fontWeight:700 }}>{lastGem}</span> <span style={{ color:'#30D158', fontFamily:'monospace', fontSize:'11px' }}>{player.gems.length}/{GEM_POUCH_MAX}</span></span>
              </div>
            </section>
          )}

          {/* ── Tab panels ── */}
          {activeTab !== null && (
            <div className="glass-panel" style={{ padding:'10px', display:'flex', flexDirection:'column' }}>
              {/* Tab nav */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexShrink:0 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px', flex:1 }}>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {(['stats','training','settings'] as const).map(t => (
                      <button key={t} className={`hud-nav-pill${activeTab===t?' tab-active':''}`} style={{ flex:1, textAlign:'center', fontSize:'10px', padding:'2px 8px' }} onClick={() => setActiveTab(t)}>
                        {t==='stats'?'Player Info':t==='training'?'Training Log':'Settings'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {(['equipment','inventory'] as const).map(t => (
                      <button key={t} className={`hud-nav-pill${activeTab===t?' tab-active':''}`} style={{ flex:1, textAlign:'center', fontSize:'10px', padding:'2px 8px' }} onClick={() => setActiveTab(t)}>
                        {t==='equipment'?'Equipment':'Inventory'}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setActiveTab(null)} style={{ marginLeft:'8px', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'black', border:'1px solid rgba(255,255,255,0.2)', color:'#d4d4d8', fontSize:'18px', cursor:'pointer' }}>×</button>
              </div>

              {/* Tab content */}
              <div style={{ flex:1, overflowY:'auto', maxHeight:'480px' }}>
                {activeTab === 'equipment' && (
                  <EquipmentGrid
                    slots={EQUIP_SLOTS}
                    equipment={player.equipment}
                    getItemName={getItemName}
                    getItemSubType={getItemSubType}
                    getItemTier={getItemTier}
                    getItemGems={getItemGems}
                    getGemName={getGemName}
                    getGemCategory={getGemCategory}
                    onUnequip={handleUnequip}
                  />
                )}
                {activeTab === 'inventory' && (
                  <InventoryPanel
                    inventory={player.inventory}
                    gems={player.gems}
                    equipment={player.equipment}
                    filterState={filterState}
                    onFilterChange={(key, val) => setFilterState(prev => ({ ...prev, [key]: val }))}
                    onItemClick={id => setEquipPopup(prev => prev === id ? null : id)}
                    selectedItemId={equipPopup}
                    getItemName={getItemName}
                    getItemSubType={getItemSubType}
                    getItemTier={getItemTier}
                    getItemGems={getItemGems}
                    getGemName={getGemName}
                    getGemColor={getGemColor}
                    getGemCategory={getGemCategory}
                    bagDefs={INVENTORY_BAGS}
                  />
                )}
                {activeTab === 'stats' && (
                  <div style={{ padding:'10px', borderRadius:'12px', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.12)' }}>
                    <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:'6px' }}>Combat Attributes</span>
                    {[['Armor Class (AC)', player.derivedStats.AC?.toFixed(1)],['Weapon Class (WC)', player.derivedStats.WC?.toFixed(1)],['Spell Class (SC)', player.derivedStats.SC?.toFixed(1)],['Hit Chance', `${player.derivedStats.hitChance?.toFixed(1)}%`],['Crit Chance', `${player.derivedStats.critChance?.toFixed(1)}%`],['Max HP', Math.round(player.derivedStats.maxHp)]].map(([k,v]) => (
                      <div key={String(k)} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', fontSize:'12px' }}>
                        <span style={{ color:'#9ca3af' }}>{k}</span><span style={{ color:'#fff', fontWeight:700, fontFamily:'monospace' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'training' && (
                  <div style={{ padding:'12px', borderRadius:'12px', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.12)', fontSize:'12px' }}>
                    <h3 style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'12px' }}>Battle Statistics</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', fontFamily:'monospace' }}>
                      {[['Total Kills', fmt(player.kills)],['Level', player.level],['Gold', fmt(player.gold)]].map(([k,v]) => (
                        <div key={String(k)}><span style={{ fontWeight:700, color:'#fff', fontFamily:'sans-serif' }}>{k}: </span><span style={{ background:'black', padding:'1px 4px', borderRadius:'4px', border:'1px solid #262626', color:'#fff', fontWeight:700 }}>{v}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <div style={{ padding:'10px', borderRadius:'12px', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.12)' }}>
                      <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:'8px' }}>Display</span>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                        <div><div style={{ color:'#e4e4e7', fontSize:'12px' }}>Dark Mode</div><div style={{ fontSize:'10px', color:'#71717a' }}>Onyx black HUD</div></div>
                        <button className="footer-tab-button" style={{ padding:'6px 12px', fontSize:'11px' }} onClick={handleThemeToggle}>{theme==='onyx'?'On':'Off'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Combat Console ── */}
          <CombatConsole
            monsters={BESTIARY_Z01}
            selectedTargetId={selectedTargetId}
            onTargetChange={handleTargetChange}
            engaged={engaged}
            onEngage={handleEngage}
            onCast={() => handleCombatAction('cast')}
            onFight={() => handleCombatAction('fight')}
            onSpellstrike={() => handleCombatAction('spellstrike')}
            combatLog={combatLog}
            enemyCurrentHP={enemyCurrentHP}
            enemyMaxHP={combatMonster?.hp ?? null}
            canAllocate={canAlloc}
            freeLevels={fLevels}
            attributePoints={player.attributePoints}
            focusOrder={focusOrder}
            onSpendPoint={handleSpendPoint}
            archetype={player.archetype}
          />

          {/* ── Chat Console ── */}
          <ChatConsole
            channel={chatChannel}
            onChannelChange={ch => { setChatChannel(ch); setInboxOpen(false) }}
            chatSub={chatSub}
            onSubChange={(ch, sub) => setChatSub(prev => ({ ...prev, [ch]: sub }))}
            chatSubs={CHAT_SUBS}
            messages={chatMessages}
            groupNames={groupNames}
            chatInput={chatInput}
            onInputChange={setChatInput}
            onSend={handleSendMessage}
            onExpand={() => setChatOverlay(true)}
            inboxOpen={inboxOpen}
            onToggleInbox={() => setInboxOpen(p => !p)}
            emojiOpen={emojiOpen}
            onToggleEmoji={() => setEmojiOpen(p => !p)}
            onEmojiSelect={handleEmojiSelect}
            nameColor={chatNameColor}
            nameColorPicker={nameColorPicker}
          />

        </div>
      </div>

      {/* ── Item Modal ── */}
      {equipPopup && (
        <ItemModal
          instanceId={equipPopup}
          onClose={() => setEquipPopup(null)}
          getItemName={getItemName}
          getItemSubType={getItemSubType}
          getItemTier={getItemTier}
          getItemStatLabel={getItemStatLabel}
          getItemStatValue={getItemStatValue}
          getItemGems={getItemGems}
          getGemName={getGemName}
          getGemEffect={getGemEffect}
          getGemCategory={getGemCategory}
          isEquipped={isEquipped(equipPopup)}
          onEquip={handleEquip}
        />
      )}

      {/* ── Map Overlay ── */}
      {mapOverlay && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(12px)', zIndex:50, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'16px' }}>
          <h3 style={{ fontSize:'20px', color:'#fff', marginTop:'8px' }}>World Exploration</h3>
          <div style={{ width:'100%', maxWidth:'420px', maxHeight:'400px', aspectRatio:'1/1', position:'relative' }}>
            <div className="glass-panel" style={{ width:'100%', height:'100%', borderRadius:'16px', overflow:'hidden', border:'2px solid rgba(255,255,255,0.25)' }}>
              <canvas ref={zoneCanvasRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} />
            </div>
          </div>
          <DPad onMove={handleMove} onEnter={() => showToast('Interacting with sector waypoint.')} style={{ marginBottom:'8px' }} />
          <button onClick={() => setMapOverlay(false)} style={{ position:'absolute', top:'16px', right:'20px', fontSize:'24px', color:'#9ca3af', background:'none', border:'none', cursor:'pointer' }}>×</button>
        </div>
      )}

      {/* ── Chat Overlay ── */}
      {chatOverlay && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(12px)', zIndex:150, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'14px' }}>
          <div style={{ width:'100%', maxWidth:'512px', margin:'0 auto', height:'100%' }}>
            <ChatConsole
              channel={chatChannel}
              onChannelChange={ch => { setChatChannel(ch); setInboxOpen(false) }}
              chatSub={chatSub}
              onSubChange={(ch, sub) => setChatSub(prev => ({ ...prev, [ch]: sub }))}
              chatSubs={CHAT_SUBS}
              messages={chatMessages}
              groupNames={groupNames}
              chatInput={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendMessage}
              onExpand={() => setChatOverlay(false)}
              inboxOpen={inboxOpen}
              onToggleInbox={() => setInboxOpen(p => !p)}
              emojiOpen={emojiOpen}
              onToggleEmoji={() => setEmojiOpen(p => !p)}
              onEmojiSelect={handleEmojiSelect}
              nameColor={chatNameColor}
              nameColorPicker={nameColorPicker}
            />
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="glass-panel" style={{ position:'fixed', left:'50%', transform:'translateX(-50%)', bottom:'72px', zIndex:210, padding:'8px 20px', borderRadius:'9999px', fontWeight:500, fontSize:'12px', background:'black', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', boxShadow:'0 4px 24px rgba(0,0,0,0.8)', whiteSpace:'nowrap' }}>{toast}</div>
      )}
    </>
  )
}
