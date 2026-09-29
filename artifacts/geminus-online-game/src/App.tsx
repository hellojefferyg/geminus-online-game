
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import { spendAttributeBank, calcDerived as gddCalcDerived, races, GDD, DROPPER_TIERS, xpToLevel, getAttributeFocusOrder } from './gdd'
import ZONES_DATA from './data/zones.json'
import STAMPS_DATA from './data/stamps.json'
import BESTIARY_DATA from './data/bestiary.json'
import { runTurn, applyTurnResult, getDefaultAction } from './managers/CombatManager'
import { savePlayerNow } from './lib/saveQueue'
import { fetchMyRole, loadLiveBalance, type Role } from './systems/balance'
import { LIVE_CHANNELS, isLiveChannel, loadRecent, subscribeChat, sendChat, deleteChat, type ChatLine } from './lib/chat'
import PlayerHUD from './game/components/PlayerHUD'
import CombatPanel from './game/components/CombatPanel'
import CombatConsole from './game/components/CombatConsole'
import ChatConsole from './game/components/ChatConsole'
import InlinePanel from './game/components/InlinePanel'
import ServicePanel from './game/components/ServicePanel'
import DevPanel, { type DevFlags } from './game/components/DevPanel'
import { LATTICE_VERSION, getStampById, loadZoneBackground, resolvePos, stepOn, tileAt } from './game/map/lattice'
import { type ServiceResult, rollGemId, gemInfo, generateShadowItem, itemDisplayName, zoneTargets, romanToInt, GEM_POUCH_CAP, INVENTORY_CAP } from './systems/services'

// ─── ZONE HELPERS ─────────────────────────────────────────────
const MAINTENANCE_MODE = false;
const ZONES: Record<string, any> = ZONES_DATA
const STAMPS: Record<string, any> = STAMPS_DATA
function getZone(zoneId: string) { return ZONES[zoneId] || ZONES['Z01'] }
function getStamp(zoneId: string) { return getStampById(getZone(zoneId).stamp) }
function getTileService(tile: string): any { return STAMPS._services[tile] || null }
/** The building on this cell of the zone, if any (same answer in Text and Graphic mode). */
function tileHere(zoneId: string, x: number, y: number): { tile: string; service: any; x: number; y: number } | null {
  const tile = tileAt(getStamp(zoneId), x, y) ?? '.'
  const service = getTileService(tile)
  return service ? { tile, service, x, y } : null
}

// Races, GDD constants and gear tiers come from gdd.js so God Editor changes reach them.
function getBankedLevelsLocal(ap: number): number { return Math.floor((ap || 0) / GDD.AP_PER_LEVEL) }

// ─── ITEMS ────────────────────────────────────────────────────
const BASE_ITEMS = [
  { id: 'base_helm_1',      name: 'Novice Helm',        type: 'Armor',      subType: 'Helmet',    sockets: 2 },
  { id: 'base_armor_1',     name: 'Novice Cuirass',     type: 'Armor',      subType: 'Armor',     sockets: 2 },
  { id: 'base_gauntlets_1', name: 'Novice Gauntlets',   type: 'Armor',      subType: 'Gauntlets', sockets: 2 },
  { id: 'base_leggings_1',  name: 'Novice Leggings',    type: 'Armor',      subType: 'Leggings',  sockets: 2 },
  { id: 'base_boots_1',     name: 'Novice Boots',       type: 'Armor',      subType: 'Boots',     sockets: 2 },
  { id: 'base_amulet_1',    name: 'Novice Pendant',     type: 'Amulet',     subType: 'Amulet',    sockets: 0 },
  { id: 'base_ring_1',      name: 'Novice Ring',        type: 'Ring',       subType: 'Ring',      sockets: 0 },
  { id: 'base_sword_1',     name: 'Novice Sword',       type: 'Weapons',    subType: 'Sword',     sockets: 2 },
  { id: 'base_mace_1',      name: 'Novice Mace',        type: 'Weapons',    subType: 'Mace',      sockets: 2 },
  { id: 'base_claw_1',      name: 'Novice Claw',        type: 'Weapons',    subType: 'Claw',      sockets: 2 },
  { id: 'base_axe_1',       name: 'Novice Axe',         type: 'Weapons',    subType: 'Axe',       sockets: 2 },
  { id: 'base_staff_1',     name: 'Novice Staff',       type: 'Weapons',    subType: 'Staff',     sockets: 2 },
  { id: 'base_dagger_1',    name: 'Novice Dagger',      type: 'Weapons',    subType: 'Dagger',    sockets: 2 },
  { id: 'base_bow_1',       name: 'Novice Bow',         type: 'Weapons',    subType: 'Bow',       sockets: 2 },
  { id: 'base_arrow_1',     name: 'Novice Arrow',       type: 'Weapons',    subType: 'Arrow',     sockets: 0 },
  { id: 'base_buffspell_1', name: 'Novice Warcry',      type: 'BuffSpells', subType: 'BuffSpell', sockets: 1 },
  { id: 'base_fire_1',      name: 'Novice Fire Surge',  type: 'Spells',     subType: 'Fire',      sockets: 2 },
  { id: 'base_cold_1',      name: 'Novice Frost Bolt',  type: 'Spells',     subType: 'Cold',      sockets: 2 },
  { id: 'base_earth_1',     name: 'Novice Stone Spike', type: 'Spells',     subType: 'Earth',     sockets: 2 },
  { id: 'base_air_1',       name: 'Novice Zephyr',      type: 'Spells',     subType: 'Air',       sockets: 2 },
  { id: 'base_drain_1',     name: 'Novice Drain Touch', type: 'Spells',     subType: 'Drain',     sockets: 2 },
  { id: 'base_arcane_1',    name: 'Novice Arcane Bolt', type: 'Spells',     subType: 'Arcane',    sockets: 2 },
  { id: 'base_death_1',     name: 'Novice Death Coil',  type: 'Spells',     subType: 'Death',     sockets: 2 },
  { id: 'base_offhand_1',   name: 'Novice Focus Orb',   type: 'OffHands',   subType: 'OffHand',   sockets: 1 },
]
const SLOT_MODS: Record<string, any> = {
  Armor: { prop: 1.00, stat: 'AC' }, Helmet: { prop: 0.75, stat: 'AC' }, Boots: { prop: 0.75, stat: 'AC' },
  Leggings: { prop: 0.50, stat: 'AC', hitBonus: 0.10 }, Gauntlets: { prop: 0.50, stat: 'AC', classBonus: 0.15 },
  Weapon: { prop: 1.0, stat: 'WC' }, Sword: { prop: 1.0, stat: 'WC' }, Mace: { prop: 1.0, stat: 'WC' },
  Claw: { prop: 1.0, stat: 'WC' }, Axe: { prop: 1.0, stat: 'WC' }, Staff: { prop: 1.0, stat: 'WC' },
  Dagger: { prop: 1.0, stat: 'WC' }, Bow: { prop: 1.0, stat: 'WC' }, Arrow: { prop: 0.0, stat: 'WC' },
  BuffSpell: { prop: 0.25, stat: 'WC' }, Spell: { prop: 1.0, stat: 'SC' }, Fire: { prop: 1.0, stat: 'SC' },
  Cold: { prop: 1.0, stat: 'SC' }, Earth: { prop: 1.0, stat: 'SC' }, Air: { prop: 1.0, stat: 'SC' },
  Drain: { prop: 1.0, stat: 'SC' }, Arcane: { prop: 1.0, stat: 'SC' }, Death: { prop: 1.0, stat: 'SC' },
  OffHand: { prop: 0.25, stat: 'SC' }, Amulet: { prop: 0, stat: null }, Ring: { prop: 0, stat: null },
  Rune: { prop: 0, stat: null }, Accessory: { prop: 0, stat: null },
}
const RACE_WEAPONS: Record<string, { w1: string; w2: string }> = {
  human: { w1: 'base_sword_1', w2: 'base_sword_1' }, dragonborn: { w1: 'base_sword_1', w2: 'base_sword_1' },
  orc: { w1: 'base_mace_1', w2: 'base_mace_1' }, werewolf: { w1: 'base_claw_1', w2: 'base_claw_1' },
  minotaur: { w1: 'base_axe_1', w2: 'base_axe_1' }, troll: { w1: 'base_staff_1', w2: 'base_staff_1' },
  hobbit: { w1: 'base_dagger_1', w2: 'base_dagger_1' }, centaur: { w1: 'base_bow_1', w2: 'base_arrow_1' },
  phoenix: { w1: 'base_fire_1', w2: 'base_fire_1' }, tiefling: { w1: 'base_fire_1', w2: 'base_fire_1' },
  mermaid: { w1: 'base_cold_1', w2: 'base_cold_1' }, gnome: { w1: 'base_earth_1', w2: 'base_earth_1' },
  griffin: { w1: 'base_air_1', w2: 'base_air_1' }, vampire: { w1: 'base_drain_1', w2: 'base_drain_1' },
  elf: { w1: 'base_arcane_1', w2: 'base_arcane_1' }, babayaga: { w1: 'base_death_1', w2: 'base_death_1' },
  angel: { w1: 'base_sword_1', w2: 'base_arcane_1' }, aasimar: { w1: 'base_mace_1', w2: 'base_arcane_1' },
  banshee: { w1: 'base_dagger_1', w2: 'base_arcane_1' }, halfling: { w1: 'base_staff_1', w2: 'base_arcane_1' },
  dwarf: { w1: 'base_axe_1', w2: 'base_fire_1' }, demon: { w1: 'base_staff_1', w2: 'base_fire_1' },
  draugr: { w1: 'base_staff_1', w2: 'base_death_1' }, unicorn: { w1: 'base_sword_1', w2: 'base_death_1' },
}
const RARITY_COLORS: Record<string, string> = {
  Common: '#D1D5DB', Uncommon: '#30D158', Rare: '#0A84FF', Epic: '#BF5AF2', Shadow: '#BF5AF2', Echo: '#94a3b8', None: '#8FA8C7',
}

// ─── HELPERS ──────────────────────────────────────────────────
function makeItem(baseItemId: string, tier = 1) {
  return { instanceId: crypto.randomUUID(), baseItemId, tier, type: 'Dropper', socketedGems: [] }
}
function buildStartingKit(raceKey: string): { inventory: any[]; equipment: Record<string, string> } {
  const rd = races[raceKey] || races.human; const weapons = RACE_WEAPONS[raceKey] || RACE_WEAPONS.human
  const inv: any[] = []; const eq: Record<string, string> = {}
  const add = (baseId: string, slot: string) => { const item = { ...makeItem(baseId), starter: true }; inv.push(item); eq[slot] = item.instanceId }
  add('base_helm_1','Helmet'); add('base_armor_1','Armor'); add('base_gauntlets_1','Gloves')
  add('base_leggings_1','Leggings'); add('base_boots_1','Boots'); add('base_amulet_1','Amulet'); add('base_ring_1','Ring')
  if (rd.archetype==='True Fighter') { add(weapons.w1,'Weapon 1'); add(weapons.w2,'Weapon 2'); add('base_buffspell_1','Spell 1'); add('base_buffspell_1','Spell 2') }
  else if (rd.archetype==='True Caster') { add(weapons.w1,'Weapon 1'); add(weapons.w2,'Weapon 2'); add('base_offhand_1','Spell 1'); add('base_offhand_1','Spell 2') }
  else { add(weapons.w1,'Weapon 1'); add(weapons.w1,'Weapon 2'); add(weapons.w2,'Spell 1'); add(weapons.w2,'Spell 2') }
  return { inventory: inv, equipment: eq }
}
function rollItemDrop(raceKey: string, tier = 1): any | null {
  if (Math.random() > 0.40) return null
  const rd = races[raceKey] || races.human; const weapons = RACE_WEAPONS[raceKey] || RACE_WEAPONS.human
  let pool = ['base_helm_1','base_armor_1','base_gauntlets_1','base_leggings_1','base_boots_1']
  if (rd.archetype==='True Fighter') pool.push(weapons.w1,weapons.w2,'base_buffspell_1')
  else if (rd.archetype==='True Caster') pool.push(weapons.w1,'base_offhand_1')
  else pool.push(weapons.w1,weapons.w2,'base_offhand_1')
  return makeItem(pool[Math.floor(Math.random()*pool.length)], tier)
}
// Derived stats come from gdd.js (source of truth): gear, socketed gems, shadow enchantments.
function calcDerived(p: any) { return gddCalcDerived(p, BASE_ITEMS) }

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App({ uid }: { uid: 
string }) {
if (MAINTENANCE_MODE) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#02040a',
        color: '#fff',
        fontFamily: 'sans-serif',
        padding: 24,
        textAlign: 'center',
      }}>
        <h2>We’ll be back soon</h2>
        <p style={{ color: '#888' }}>Check back later today.</p>
      </div>
    );
  }
  const [player, setPlayer] = useState<any>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [battleStats, setBattleStats] = useState({ levels:0, kills:0, rounds:0, deaths:0, oneHitKills:0 })
  const [theme, setTheme] = useState('aether')
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [engaged, setEngaged] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState('E01')
  const [combatMonster, setCombatMonster] = useState<any>(null)
  const [combatLog, setCombatLog] = useState<{ text:string; color:string }[]>([])
  const [enemyCurrentHP, setEnemyCurrentHP] = useState<number | null>(null)
  const [lastItem, setLastItem] = useState('None')
  const [lastItemColor, setLastItemColor] = useState('#8FA8C7')
  const [lastGem, setLastGem] = useState('None')
  const [lastGemColor, setLastGemColor] = useState('#8FA8C7')
  const [mapOverlay, setMapOverlay] = useState(false)
  const [chatOverlay, setChatOverlay] = useState(false)
  const [chatChannel, setChatChannel] = useState('main')
  const [chatUnread, setChatUnread] = useState<Record<string, number>>({})
  const chatChannelRef = useRef('main')
  useEffect(() => { chatChannelRef.current = chatChannel; setChatUnread(u => ({ ...u, [chatChannel]: 0 })) }, [chatChannel])
  const [chatSub, setChatSub] = useState<Record<string,string>>({ main:'feed', sales:'chat', clan:'chat', groups:'g1' })
  const [chatMessages, setChatMessages] = useState<Record<string,any[]>>({ main:[], sales:[], clan:[], groups:[], g1:[], g2:[], g3:[], g4:[] })
  const [chatInput, setChatInput] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [equipPopup, setEquipPopup] = useState<string | null>(null)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [groupNames] = useState<Record<string,string>>({ g1:'Group-1', g2:'Group-2', g3:'Group-3', g4:'Group-4' })
  const [filterState, setFilterState] = useState({ category:'All', subType:'All', tier:'All', quality:'All', sortBy:'tier', order:'desc' })
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTile, setActiveTile] = useState<{ tile:string; service:any; x:number; y:number } | null>(null)
  const [activeService, setActiveService] = useState<any>(null)
  const [mapMode, setMapMode] = useState<'graphic'|'text'>(() => { try { return localStorage.getItem('g_mapmode')==='text' ? 'text' : 'graphic' } catch { return 'graphic' } })
  const [avatarGender, setAvatarGender] = useState<'male'|'female'>(() => { try { return localStorage.getItem('g_avatar')==='female' ? 'female' : 'male' } catch { return 'male' } })
  const [zoneBg, setZoneBg] = useState<HTMLImageElement|null>(null)
  const [role, setRole] = useState<Role>('player')
  const [devOpen, setDevOpen] = useState(false)
  const [devFlags, setDevFlags] = useState<DevFlags>({ oneHit: false, noDamage: false, forceDrop: '' })
  const [balanceInfo, setBalanceInfo] = useState<{ version: number | null; draft: boolean }>({ version: null, draft: false })
  const smokeRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<any>(null)

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800) }, [])
  useEffect(() => { playerRef.current = player }, [player])

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!meta) { meta = document.createElement('meta') as HTMLMetaElement; meta.name = 'theme-color'; document.head.prepend(meta) }
    meta.content = '#03080c'
  }, [])

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        // Role first (devs may be previewing a draft balance), then the published balance
        const myRole = await fetchMyRole()
        setRole(myRole)
        const bal = await loadLiveBalance({ isDev: myRole === 'dev' })
        setBalanceInfo(bal)
        const res = await fetch(`/api/player?uid=${uid}`)
        const supa = await res.json()
        if (!supa || supa.error || !supa.uid) { setLoadError('Character not found. Sign out and create your character.'); return }
        const p: any = {
          uid, name:supa.name||'Pilot', race:supa.race||'human', raceName:supa.race_name||'Human',
          archetype:supa.archetype||'True Fighter', cci:supa.cci||'DEX', bank:supa.bank||0,
          gemDust:Number(supa.gem_dust)||0, essence:Number(supa.essence)||0,
          xp:supa.xp??0, gold:supa.gold??0, level:supa.level??1, hp:supa.hp??null,
          attributePoints:supa.attribute_points??0, kills:supa.kills??0,
          baseStats:(supa.base_stats&&Object.keys(supa.base_stats).length>0)?supa.base_stats:{STR:15,DEX:20,VIT:10,NTL:5,WIS:5},
          gems:Array.isArray(supa.gems)?supa.gems:[],
          inventory:Array.isArray(supa.inventory)?supa.inventory:[],
          equipment:(supa.equipment&&typeof supa.equipment==='object')?supa.equipment:{},
          pos:(supa.pos&&typeof supa.pos==='object')?{zoneId:'Z01',...supa.pos}:{zoneId:'Z01'},
          derivedStats:{},
        }
        p.xpToNextLevel = xpToLevel(p.level)
        // Positions saved before the shared lattice (or off the stamp) go back to the zone's Sanctuary
        const [sx, sy] = resolvePos(getStamp(p.pos.zoneId), p.pos)
        p.pos = { zoneId: p.pos.zoneId, x: sx, y: sy, v: LATTICE_VERSION }
        setActiveTile(tileHere(p.pos.zoneId, sx, sy))
        if (p.inventory.length===0) {
          const kit = buildStartingKit(p.race); p.inventory=kit.inventory; p.equipment=kit.equipment
          calcDerived(p); if (!p.hp||p.hp>p.derivedStats.maxHp) p.hp=p.derivedStats.maxHp
          playerRef.current=p; setPlayer(p); savePlayerNow(p,'starting-kit'); return
        }
        calcDerived(p); if (!p.hp||p.hp>p.derivedStats.maxHp) p.hp=p.derivedStats.maxHp
        playerRef.current=p; setPlayer(p)
      } catch (err:any) { setLoadError(`Failed to load character: ${err?.message||'Unknown error'}`) }
    }
    loadPlayer()
    const savedTheme = localStorage.getItem('g_theme')||'aether'
    setTheme(savedTheme); document.documentElement.classList.toggle('theme-onyx',savedTheme==='onyx')
    setChatMessages(prev => ({ ...prev, main:[{ sender:'System', system:true, text:'Welcome to Geminus. Transmission systems online.', color:'#3EE0FF' }] }))
  }, [uid])

  // Graphic mode: the zone painting sits behind the hexes. Position and buildings come from the stamp either way.
  const currentZoneId = player?.pos?.zoneId || 'Z01'
  useEffect(() => {
    try { localStorage.setItem('g_mapmode', mapMode) } catch {}
    if (mapMode !== 'graphic') { setZoneBg(null); return }
    let cancelled = false
    loadZoneBackground(currentZoneId).then(img => { if (!cancelled) setZoneBg(img) })
    return () => { cancelled = true }
  }, [currentZoneId, mapMode])

  // Live chat: load recent Main/Sales history, then append new messages as they arrive
  useEffect(() => {
    let cancelled = false
    const addLines = (channel: string, lines: ChatLine[]) => setChatMessages(prev => {
      const cur = prev[channel] || []
      const seen = new Set(cur.map((m: any) => m.id).filter(Boolean))
      return { ...prev, [channel]: [...cur, ...lines.filter(l => !l.id || !seen.has(l.id))].slice(-150) }
    })
    for (const ch of LIVE_CHANNELS) loadRecent(ch).then(lines => { if (!cancelled) addLines(ch, lines) })
    const unsubscribe = subscribeChat(
      (channel, line) => {
        addLines(channel, [line])
        if (channel !== chatChannelRef.current) setChatUnread(u => ({ ...u, [channel]: Math.min(99, (u[channel] || 0) + 1) }))
      },
      id => setChatMessages(prev => Object.fromEntries(Object.entries(prev).map(([k, list]) => [k, list.filter((m: any) => m.id !== id)]))),
    )
    return () => { cancelled = true; unsubscribe() }
  }, [uid])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState==='hidden'&&playerRef.current) savePlayerNow(playerRef.current,'tab-hidden') }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => { document.documentElement.classList.toggle('theme-onyx',theme==='onyx'); localStorage.setItem('g_theme',theme) }, [theme])

  useEffect(() => {
    const canvas = smokeRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width=window.innerWidth; canvas.height=window.innerHeight
    class Smoke {
      x:number; y:number; size:number; sx:number; sy:number; rot:number; rs:number; type:string; alpha:number; r:number; g:number; b:number
      constructor(init=false) {
        this.x=init?Math.random()*canvas.width:(Math.random()>0.5?-100:canvas.width+100)
        this.y=Math.random()*canvas.height; this.size=Math.random()*240+80
        this.sx=(Math.random()-0.5)*0.45; this.sy=(Math.random()-0.5)*0.35
        this.rot=Math.random()*Math.PI*2; this.rs=(Math.random()-0.5)*0.004
        const roll=Math.random()
        if (roll<0.35) { this.type='white'; this.alpha=Math.random()*0.05+0.02; this.r=240; this.g=245; this.b=255 }
        else if (roll<0.70) { this.type='black'; this.alpha=Math.random()*0.22+0.08; this.r=0; this.g=0; this.b=0 }
        else { this.type='onyx'; this.alpha=Math.random()*0.18+0.06; this.r=12; this.g=12; this.b=16 }
      }
      update() {
        this.x+=this.sx; this.y+=this.sy; this.rot+=this.rs
        if (this.x<-this.size*1.5||this.x>canvas.width+this.size*1.5||this.y<-this.size*1.5||this.y>canvas.height+this.size*1.5) Object.assign(this,new Smoke())
      }
      draw() {
        ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.rot)
        const g=ctx.createRadialGradient(0,0,0,0,0,this.size)
        if (this.type==='black') { g.addColorStop(0,`rgba(0,0,0,${this.alpha*1.4})`); g.addColorStop(0.5,`rgba(0,0,0,${this.alpha*0.7})`); g.addColorStop(1,'rgba(0,0,0,0)') }
        else if (this.type==='white') { g.addColorStop(0,`rgba(${this.r},${this.g},${this.b},${this.alpha*1.2})`); g.addColorStop(0.4,`rgba(200,210,225,${this.alpha*0.5})`); g.addColorStop(1,'rgba(255,255,255,0)') }
        else { g.addColorStop(0,`rgba(${this.r},${this.g},${this.b},${this.alpha*1.3})`); g.addColorStop(0.5,`rgba(5,5,8,${this.alpha*0.6})`); g.addColorStop(1,'rgba(0,0,0,0)') }
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,this.size,0,Math.PI*2); ctx.fill(); ctx.restore()
      }
    }
    const particles=Array.from({length:40},()=>new Smoke(true)); let id:number
    const animate=()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p=>{p.update();p.draw()}); id=requestAnimationFrame(animate) }
    animate()
    const onResize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight }
    window.addEventListener('resize',onResize)
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener('resize',onResize) }
  }, [])

  // ── HANDLERS ──────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!window.confirm('Log out of Geminus?')) return
    await savePlayerNow(playerRef.current,'logout')
    await supabase.auth.signOut(); window.location.reload()
  }

  const spendPoint = (attr: string) => {
    if ((player.attributePoints||0) < GDD.AP_PER_LEVEL || player.level<=1) return
    const current = playerRef.current||player
    const p = { ...current, baseStats:{...current.baseStats} }
    p.baseStats = spendAttributeBank(p.baseStats, p.race, attr)
    p.attributePoints = (p.attributePoints||0) - GDD.AP_PER_LEVEL
    calcDerived(p); playerRef.current=p; setPlayer(p)
    savePlayerNow(p,'stat-spend'); showToast(attr+' upgraded!')
  }

  const move = (dx: number, dy: number) => {
    const zoneId = player.pos?.zoneId||'Z01'
    const stamp = getStamp(zoneId)
    const [x, y] = resolvePos(stamp, player.pos)
    // D-pad up is screen-up = north, and y grows north on the lattice
    const next = stepOn(stamp, x, y, dx, -dy)
    if (!next) return
    const p = { ...player, pos: { zoneId, x: next[0], y: next[1], v: LATTICE_VERSION } }
    playerRef.current=p; setPlayer(p)
    setActiveTile(tileHere(zoneId, next[0], next[1]))
    savePlayerNow(p,'move')
  }

  const toggleEngage = () => {
    if (!engaged) {
      const targets = zoneTargets(player.pos?.zoneId||'Z01', BESTIARY_DATA.starter)
      const t = targets.find((x:any) => x.id===selectedTargetId)||targets[0]
      if (!t) { showToast('Select target first.'); return }
      setCombatMonster({...t,currentHP:t.hp}); setEnemyCurrentHP(t.hp); setCombatLog([]); setEngaged(true)
    } else { setEngaged(false); setEnemyCurrentHP(null); setCombatLog([]) }
  }

  const performTurn = (isMagic: boolean) => {
    if (!engaged||!combatMonster) return
    const current = playerRef.current||player
    const action = isMagic ? 'cast' : getDefaultAction(current.race)
    const zoneId = current.pos?.zoneId||'Z01'; const zd = getZone(zoneId)
    // Dev combat cheats (Dev role only; flags can't be set otherwise)
    const isDev = role === 'dev'
    const turnPlayer = isDev && devFlags.oneHit ? { ...current, derivedStats: { ...current.derivedStats, hitChance: 100, WC: 1e12, SC: 1e12 } } : current
    const result = runTurn(turnPlayer, combatMonster, action, {id:zoneId,type:zd.type,gemMin:zd.gemMin,gemMax:zd.gemMax})
    if (isDev && devFlags.noDamage) { result.monsterDmg = 0; result.playerHp = current.hp; if (result.status === 'DEFEAT') result.status = 'ONGOING' }
    if (isDev && devFlags.forceDrop && result.status === 'VICTORY') {
      result.specialDrop = devFlags.forceDrop === 'gem' ? { kind: 'gem', grade: zd.gemMax || 1 } : { kind: 'shadow' }
    }
    setCombatMonster((prev:any) => ({...prev,currentHP:result.monsterHp}))
    setEnemyCurrentHP(result.monsterHp>0 ? Math.round(result.monsterHp) : null)
    let newPlayer = applyTurnResult({...current,inventory:[...(current.inventory||[])],equipment:{...(current.equipment||{})},gems:[...(current.gems||[])]},result)
    if (result.itemDrop) {
      const dropped = rollItemDrop(newPlayer.race, romanToInt(zd.gear))
      if (dropped&&newPlayer.inventory.length<INVENTORY_CAP) {
        newPlayer = {...newPlayer,inventory:[...newPlayer.inventory,dropped]}
        const droppedBase = BASE_ITEMS.find(b=>b.id===dropped.baseItemId)
        setLastItem(`${droppedBase?.name||'Item'} T${dropped.tier}`); setLastItemColor(RARITY_COLORS['Uncommon'])
      }
    }
    if (result.specialDrop?.kind==='gem') {
      const gId=rollGemId()
      if (newPlayer.gems.length<GEM_POUCH_CAP) {
        newPlayer={...newPlayer,gems:[...newPlayer.gems,{id:gId,grade:result.specialDrop.grade||1}]}
        setLastGem(`${gemInfo(gId).name} G${result.specialDrop.grade||1}`); setLastGemColor(RARITY_COLORS['Rare'])
      }
    }
    if (result.specialDrop?.kind==='shadow') {
      const shadow=generateShadowItem(newPlayer,BASE_ITEMS)
      if (shadow&&newPlayer.inventory.length<INVENTORY_CAP) {
        newPlayer={...newPlayer,inventory:[...newPlayer.inventory,shadow]}
        const sb=BASE_ITEMS.find(b=>b.id===shadow.baseItemId)
        setLastItem(`${itemDisplayName(shadow,sb)} T${shadow.tier}`); setLastItemColor(RARITY_COLORS[shadow.type])
        showToast(`✦ ${itemDisplayName(shadow,sb)} dropped!`)
      }
    }
    if (result.status==='VICTORY') {
      setCombatLog([{text:`You hit ${combatMonster.name} for ${Math.round(result.playerDmg)}!`,color:result.crit?'#FFD60A':'#fff'},{text:'Enemy is DEAD!',color:'#30D158'},{text:`+${result.xpGained} XP  +${result.goldGained} Gold`,color:'#FFD60A'}])
      setEngaged(false); setEnemyCurrentHP(null)
      if (result.leveledUp) { showToast(`⬆ Level Up! Level ${result.newLevel}`); setBattleStats(prev=>({...prev,levels:prev.levels+1})) }
      setBattleStats(prev=>({...prev,kills:prev.kills+1}))
    } else if (result.status==='DEFEAT') {
      setCombatLog([{text:`${combatMonster.name} hit you for ${Math.round(result.monsterDmg)}!`,color:'#FF375F'},{text:'Chassis Integrity Depleted!',color:'#fbbf24'},{text:'💀 Defeated! Press BATTLE to retry',color:'#94a3b8'}])
      setEngaged(false); setEnemyCurrentHP(null); setBattleStats(prev=>({...prev,deaths:prev.deaths+1}))
    } else {
      setCombatLog([{text:`You hit ${combatMonster.name} for ${Math.round(result.playerDmg)}!`,color:'#fff'},{text:`${combatMonster.name} hits you for ${Math.round(result.monsterDmg)}!`,color:'#FF375F'}])
      setBattleStats(prev=>({...prev,rounds:prev.rounds+1}))
    }
    calcDerived(newPlayer); playerRef.current=newPlayer; setPlayer(newPlayer)
    savePlayerNow(newPlayer,result.status==='VICTORY'?(result.leveledUp?'level-up':'kill'):result.status==='DEFEAT'?'death':'combat')
  }

  const equipItem = (instanceId: string) => {
    if (!instanceId) return
    const item=player.inventory.find((i:any)=>i.instanceId===instanceId); if (!item) return
    const base=BASE_ITEMS.find(b=>b.id===item.baseItemId); if (!base) return
    const p={...player,equipment:{...player.equipment},inventory:[...player.inventory]}
    const subType=base.subType; let slot=''
    if (['Sword','Mace','Claw','Axe','Staff','Dagger','Bow'].includes(subType)) slot=!p.equipment['Weapon 1']?'Weapon 1':'Weapon 2'
    else if (['Fire','Cold','Earth','Air','Drain','Arcane','Death','OffHand','BuffSpell'].includes(subType)) slot=!p.equipment['Spell 1']?'Spell 1':'Spell 2'
    else if (subType==='Arrow') slot='Weapon 2'
    else slot=({Armor:'Armor',Helmet:'Helmet',Gauntlets:'Gloves',Leggings:'Leggings',Boots:'Boots',Amulet:'Amulet',Ring:'Ring',Rune:'Accessory'} as any)[subType]||''
    if (slot) { p.equipment[slot]=instanceId; calcDerived(p); playerRef.current=p; setPlayer(p); savePlayerNow(p,'equip'); showToast(`${base.name} → ${slot}`) }
    else showToast('No slot found for this item type.')
    setEquipPopup(null)
  }

  const unequipItem = (instanceId: string) => {
    if (!instanceId) return
    const item=player.inventory.find((i:any)=>i.instanceId===instanceId); if (!item) return
    const base=BASE_ITEMS.find(b=>b.id===item.baseItemId); if (!base) return
    const p={...player,equipment:{...player.equipment},inventory:[...player.inventory]}
    for (const slot in p.equipment) if (p.equipment[slot]===instanceId) p.equipment[slot]=null
    calcDerived(p); playerRef.current=p; setPlayer(p); savePlayerNow(p,'unequip'); showToast(`${base.name} unequipped.`)
  }

  const resetSave = () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return
    localStorage.removeItem('geminus_battle_stats')
    setBattleStats({levels:0,kills:0,rounds:0,deaths:0,oneHitKills:0})
    showToast('Battle stats reset.'); setActiveTab(null)
  }

  const updateName = (name: string) => {
    const p={...player,name}; playerRef.current=p; setPlayer(p)
    savePlayerNow(p,'name-update'); showToast('Profile callsign updated.')
  }

  const applyService = (result: ServiceResult, reason: string) => {
    if (!result.ok) { showToast(result.msg); return }
    const p = result.player
    const prevZone = (playerRef.current||player)?.pos?.zoneId
    calcDerived(p); playerRef.current=p; setPlayer(p)
    savePlayerNow(p, `service-${reason}`); showToast(result.msg)
    if (p.pos?.zoneId !== prevZone) {
      // Arrived in a new zone: close the building, drop combat, pick the zone's first monster
      const targets = zoneTargets(p.pos.zoneId, BESTIARY_DATA.starter)
      setSelectedTargetId(targets[0]?.id||'E01'); setEngaged(false); setEnemyCurrentHP(null); setCombatLog([])
      setActiveService(null); setActiveTile(tileHere(p.pos.zoneId, p.pos.x, p.pos.y))
    }
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault(); if (!chatInput.trim()) return
    if (isLiveChannel(chatChannel)) {
      const text = chatInput; setChatInput('')
      sendChat(chatChannel, text).then(err => { if (err) { showToast(/slow down/i.test(err) ? 'Slow down: one message per second.' : 'Message failed to send.'); setChatInput(text) } })
      return
    }
    const key=chatChannel==='groups'?chatSub[chatChannel]:chatChannel
    setChatMessages(prev=>({...prev,[key]:[...(prev[key]||[]).slice(-149),{sender:player.name||'Pilot',role:role==='player'?null:role,text:chatInput.trim(),color:'#fff'}]}))
    setChatInput('')
  }

  // ── LOADING SCREEN ────────────────────────────────────────────
  if (!player) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', padding:'24px', background:'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif' }}>
      <h1 style={{ fontSize:'28px', fontWeight:900, color:'#3EE0FF', letterSpacing:'0.14em', margin:0, textShadow:'0 0 30px rgba(62,224,255,0.5)' }}>GEMINUS</h1>
      {loadError
        ? (<><p style={{ color:'#f87171', fontSize:'13px', textAlign:'center', maxWidth:'320px', lineHeight:1.5, margin:0 }}>{loadError}</p><button onClick={()=>window.location.reload()} style={{ padding:'10px 24px', borderRadius:'10px', background:'rgba(62,224,255,0.1)', border:'1px solid rgba(62,224,255,0.4)', color:'#3EE0FF', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>Retry</button></>)
        : <p style={{ color:'#64748b', fontSize:'12px', letterSpacing:'0.08em', margin:0 }}>Loading your character...</p>}
      <button onClick={async()=>{ try{await supabase.auth.signOut()}catch{} try{localStorage.clear()}catch{} window.location.replace(window.location.origin) }}
        style={{ marginTop:'8px', background:'rgba(255,55,95,0.1)', border:'1px solid rgba(255,55,95,0.3)', borderRadius:'8px', color:'#f87171', fontSize:'13px', fontWeight:700, cursor:'pointer', padding:'10px 28px' }}>Sign Out</button>
    </div>
  )

  const canAllocate = (player.attributePoints||0) >= GDD.AP_PER_LEVEL && player.level > 1
  const freeLevels = getBankedLevelsLocal(player.attributePoints||0)
  const zoneId = player.pos?.zoneId||'Z01'
  const zone = getZone(zoneId)
  const stamp = getStamp(zoneId)

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <>
      <canvas ref={smokeRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:-1, pointerEvents:'none', opacity:0.9 }} />
      <div style={{ width:'100%', minHeight:'100dvh', maxWidth:'512px', margin:'0 auto', display:'flex', flexDirection:'column', background:'transparent' }}
        onClick={(e)=>{ if (equipPopup&&!(e.target as HTMLElement).closest('.inventory-slot')) setEquipPopup(null); if (menuOpen&&!(e.target as HTMLElement).closest('.menu-container')) setMenuOpen(false) }}>
        <div style={{ position:'relative', zIndex:10, width:'100%', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ width:'100%', flex:1, display:'flex', flexDirection:'column', padding:'10px', paddingTop:'max(10px, env(safe-area-inset-top, 10px))', gap:'10px', paddingBottom:'112px' }}>

            {/* 1 -- PlayerHUD */}
            {/* 0 -- Dev tools (Dev role only) */}
            {role === 'dev' && devOpen && activeTab === null && activeService === null && (
              <DevPanel player={player} BASE_ITEMS={BASE_ITEMS} flags={devFlags} balanceInfo={balanceInfo}
                onFlags={setDevFlags} onApply={applyService} onClose={() => setDevOpen(false)} />
            )}

            {activeTab === null && activeService === null && !devOpen && (
              <PlayerHUD
                player={player} zone={zone} zoneId={zoneId} stamp={stamp}
                activeTile={activeTile} menuOpen={menuOpen} mapOverlay={mapOverlay}
                freeLevels={freeLevels} races={races}
                mapMode={mapMode} zoneBg={zoneBg} avatarGender={avatarGender} onSetMapMode={setMapMode}
                onMove={move} onEnter={()=>{ if (activeTile) { setMapOverlay(false); setActiveService(activeTile.service) } else showToast('Nothing to interact with here.') }}
                onLogout={handleLogout} onSetMenuOpen={setMenuOpen} onSetActiveTab={setActiveTab}
                onSetMapOverlay={setMapOverlay} onTileEnter={()=>{ if (activeTile) { setMapOverlay(false); setActiveService(activeTile.service) } }}
                onEstate={()=>showToast('Estate -- coming soon!')}
              />
            )}

            {/* 2 -- InlinePanel */}
            {activeTab !== null && (
              <InlinePanel
                activeTab={activeTab} player={player} battleStats={battleStats}
                filterState={filterState} equipPopup={equipPopup} theme={theme}
                BASE_ITEMS={BASE_ITEMS} DROPPER_TIERS={DROPPER_TIERS} SLOT_MODS={SLOT_MODS}
                onSetActiveTab={setActiveTab} onSetFilterState={setFilterState}
                onSetEquipPopup={setEquipPopup} onEquipItem={equipItem} onUnequipItem={unequipItem}
                onResetSave={resetSave} onUpdateName={updateName}
                avatarGender={avatarGender} onSetAvatarGender={g=>{ setAvatarGender(g); try { localStorage.setItem('g_avatar', g) } catch {} }}
                onToggleTheme={()=>{ const next=theme==='onyx'?'aether':'onyx'; setTheme(next); showToast(next==='onyx'?'Dark Mode on -- Onyx HUD':'Aether glass restored') }}
              />
            )}

            {/* 2b -- ServicePanel (town buildings) */}
            {activeTab === null && activeService !== null && (
              <ServicePanel
                service={activeService} player={player} BASE_ITEMS={BASE_ITEMS}
                onResult={applyService} onClose={()=>setActiveService(null)}
              />
            )}

            {/* 3 -- CombatPanel */}
            {activeTab === null && (
              <CombatPanel
                hp={player.hp} maxHp={player.derivedStats.maxHp}
                xp={player.xp} xpToNextLevel={player.xpToNextLevel} level={player.level}
                lastItem={lastItem} lastItemColor={lastItemColor}
                lastGem={lastGem} lastGemColor={lastGemColor}
                inventoryCount={player.inventory.length} gemCount={player.gems.length}
              />
            )}

            {/* 4 -- CombatConsole */}
            <CombatConsole
              targets={zoneTargets(zoneId, BESTIARY_DATA.starter)} selectedTargetId={selectedTargetId}
              engaged={engaged} combatMonster={combatMonster} combatLog={combatLog}
              enemyCurrentHP={enemyCurrentHP} canAllocate={canAllocate}
              freeLevels={freeLevels} raceKey={player.race}
              onSelectTarget={id=>{ setSelectedTargetId(id); if (engaged){setEngaged(false);setEnemyCurrentHP(null);setCombatLog([])} }}
              onToggleEngage={toggleEngage} onPerformTurn={performTurn}
              onSpendPoint={spendPoint} getAttributeFocusOrder={getAttributeFocusOrder}
            />

            {/* 5 -- ChatConsole */}
            <ChatConsole
              chatChannel={chatChannel} chatSub={chatSub} chatMessages={chatMessages}
              chatInput={chatInput} emojiOpen={emojiOpen}
              inboxOpen={inboxOpen} chatOverlay={chatOverlay} groupNames={groupNames}
              playerName={player.name} unread={chatUnread}
              canModerate={role !== 'player'}
              onDeleteMessage={id => { if (window.confirm('Delete this message for everyone?')) deleteChat(id).then(err => showToast(err ? `Could not delete: ${err}` : 'Message deleted.')) }}
              onMention={name => setChatInput(prev => (prev && !prev.endsWith(' ') ? prev + ' ' : prev) + `@${name} `)}
              onSwitchChannel={ch=>{ setChatChannel(ch); if (inboxOpen) setInboxOpen(false) }}
              onSetChatSub={setChatSub} onChatInput={setChatInput} onSendMessage={sendMessage}
              onToggleEmoji={()=>setEmojiOpen(prev=>!prev)}
              onToggleInbox={()=>setInboxOpen(prev=>!prev)}
              onSetChatOverlay={setChatOverlay}
              onAddEmoji={em=>{ setChatInput(prev=>prev+em); setEmojiOpen(false) }}
            />

          </div>
        </div>
      </div>

      {role === 'dev' && !devOpen && (
        <button onClick={() => { setDevOpen(true); setActiveTab(null); setActiveService(null) }}
          style={{ position: 'absolute', top: 'max(1px, env(safe-area-inset-top, 1px))', left: '50%', transform: 'translateX(-50%)', zIndex: 60, fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', padding: '4px 9px', borderRadius: '9999px', background: 'rgba(255,55,95,0.18)', border: '1px solid rgba(255,55,95,0.7)', color: '#FF375F', cursor: 'pointer' }}>
          DEV{balanceInfo.draft ? ' · DRAFT' : ''}
        </button>
      )}

      {/* Toast */}
      {toast && <div className="glass-panel" style={{ position:'fixed', left:'50%', transform:'translateX(-50%)', bottom:'72px', zIndex:600, padding:'8px 20px', borderRadius:'9999px', fontWeight:500, fontSize:'12px', background:'black', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', boxShadow:'0 4px 24px rgba(0,0,0,0.8)', whiteSpace:'nowrap' }}>{toast}</div>}
    </>
  )
}
