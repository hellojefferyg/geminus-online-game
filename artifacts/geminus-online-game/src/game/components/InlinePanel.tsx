// src/game/components/InlinePanel.tsx
// Menu popup: Player Info, Training Log, Settings, Equipment, Inventory tabs
import ItemIcon, { itemQuality } from './ItemIcon'
import GemIcon from './GemIcon'
import AccordionItem from './AccordionItem'
import { gemInfo, gemEffectText, itemDisplayName, enchantmentLines } from '../../systems/services'

function fmt(n: number): string {
  if (!n || isNaN(n)) return '0'
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}

const INVENTORY_BAGS: Record<string, string[]> = {
  'Weapon Chest': ['Weapons'],
  'Bag of Gear':  ['Armor'],
  'Jewelry Box':  ['Amulet', 'Ring', 'Accessory'],
  'Spell Satchel':['Spells'],
}


const EQUIP_SLOTS = [
  { name: 'Helmet' }, { name: 'Weapon 1' }, { name: 'Gloves' }, { name: 'Weapon 2' },
  { name: 'Armor' },  { name: 'Spell 1' },  { name: 'Leggings' },{ name: 'Spell 2' },
  { name: 'Boots' },  { name: 'Accessory' },{ name: 'Amulet' },  { name: 'Ring' },
]

interface InlinePanelProps {
  activeTab: string
  player: any
  battleStats: { levels: number; kills: number; rounds: number; deaths: number; oneHitKills: number }
  filterState: { category: string; subType: string; tier: string; quality: string; sortBy: string; order: string }
  equipPopup: string | null
  theme: string
  BASE_ITEMS: any[]
  DROPPER_TIERS: any[]
  SLOT_MODS: Record<string, any>
  onSetActiveTab: (tab: string | null) => void
  onSetFilterState: (updater: (prev: any) => any) => void
  onSetEquipPopup: (id: string | null) => void
  onEquipItem: (id: string) => void
  onUnequipItem: (id: string) => void
  onResetSave: () => void
  onUpdateName: (name: string) => void
  onToggleTheme: () => void
  avatarGender: 'male' | 'female'
  onSetAvatarGender: (g: 'male' | 'female') => void
}

export default function InlinePanel({
  activeTab, player, battleStats, filterState, equipPopup, theme,
  BASE_ITEMS, DROPPER_TIERS, SLOT_MODS,
  onSetActiveTab, onSetFilterState, onSetEquipPopup,
  onEquipItem, onUnequipItem, onResetSave, onUpdateName, onToggleTheme,
  avatarGender, onSetAvatarGender,
}: InlinePanelProps) {

  const renderInventoryBags = () => {
    const equipped = Object.values(player.equipment).filter(Boolean)
    const unequipped = player.inventory.filter((i: any) => !equipped.includes(i.instanceId))
    const { category, tier, quality, sortBy, order } = filterState
    const filtered = unequipped.filter((item: any) => {
      const base = BASE_ITEMS.find((b: any) => b.id === item.baseItemId); if (!base) return false
      if (category !== 'All' && !INVENTORY_BAGS[category]?.includes(base.type)) return false
      if (tier !== 'All' && item.tier.toString() !== tier) return false
      if (quality !== 'All' && (item.type || 'Dropper') !== quality) return false
      return true
    }).sort((a: any, b: any) => {
      const ba = BASE_ITEMS.find((x: any) => x.id === a.baseItemId)
      const bb = BASE_ITEMS.find((x: any) => x.id === b.baseItemId)
      let ca: any = sortBy === 'name' ? (ba?.name || '') : sortBy === 'type' ? (ba?.type || '') : a.tier
      let cb: any = sortBy === 'name' ? (bb?.name || '') : sortBy === 'type' ? (bb?.type || '') : b.tier
      if (typeof ca === 'string') return order === 'asc' ? ca.localeCompare(cb) : cb.localeCompare(ca)
      return order === 'asc' ? ca - cb : cb - ca
    })

    return (
      <>
        {Object.entries(INVENTORY_BAGS).map(([bagName, types]) => {
          const bagItems = filtered.filter((item: any) => {
            const base = BASE_ITEMS.find((b: any) => b.id === item.baseItemId)
            return base && types.includes(base.type)
          })
          return (
            <AccordionItem key={bagName} title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#fff' }}>📦 {bagName} <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>({bagItems.length})</span></span>}>
              <div className="inventory-grid">
                {bagItems.length === 0
                  ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px', color: '#71717a', fontSize: '11px' }}>No items found</div>
                  : bagItems.map((item: any) => {
                    const base = BASE_ITEMS.find((b: any) => b.id === item.baseItemId)
                    const gems = item.socketedGems || []
                    return (
                      <div key={item.instanceId}>
                        <div className="inventory-slot" onClick={() => onSetEquipPopup(equipPopup === item.instanceId ? null : item.instanceId)}>
                          {gems.length > 0 && <div className="gem-overlays-container">
                            {gems[0] && <div className={`gem-overlay ${(gemInfo(gems[0].id).category || 'misc').toLowerCase()}`}>{(gemInfo(gems[0].id).name || 'Gem').slice(0, 3)}</div>}
                            {gems[1] && <div className={`gem-overlay ${(gemInfo(gems[1].id).category || 'misc').toLowerCase()}`}>{(gemInfo(gems[1].id).name || 'Gem').slice(0, 3)}</div>}
                          </div>}
                          <div className="item-icon-wrapper"><ItemIcon subType={base?.subType || ''} quality={itemQuality(item)} size={40} /></div>
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
            {player.gems.length === 0
              ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px', color: '#71717a', fontSize: '11px' }}>No gems stored</div>
              : player.gems.map((g: any, i: number) => {
                const gd = gemInfo(g.id)
                return <div key={i} className="gem-item" title={`${gd.name} G${g.grade}: ${gemEffectText(g.id, g.grade)}`}><GemIcon id={g.id} size={30} /><span className="item-label">{gd.name.slice(0, 3)}{g.grade}</span></div>
              })}
          </div>
        </AccordionItem>
      </>
    )
  }

  return (
    <div className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['stats', 'training', 'settings'] as const).map(t => (
              <button key={t} className={`hud-nav-pill${activeTab === t ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => onSetActiveTab(t)}>
                {t === 'stats' ? 'Player Info' : t === 'training' ? 'Training Log' : 'Settings'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['equipment', 'inventory'] as const).map(t => (
              <button key={t} className={`hud-nav-pill${activeTab === t ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => onSetActiveTab(t)}>
                {t === 'equipment' ? 'Equipment' : 'Inventory'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexShrink: 0 }}>
          <button className="pin-btn">📌</button>
          <button onClick={() => onSetActiveTab(null)} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black', border: '1px solid rgba(255,255,255,0.2)', color: '#d4d4d8', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px' }}>

        {/* Equipment */}
        {activeTab === 'equipment' && (
          <div className="equipment-grid">
            {EQUIP_SLOTS.map(slot => {
              const instId = player.equipment[slot.name]
              const item = player.inventory.find((i: any) => i.instanceId === instId)
              const base = item ? BASE_ITEMS.find((b: any) => b.id === item.baseItemId) : null
              const gems = item?.socketedGems || []
              return (
                <div key={slot.name} className="equipment-slot-wrapper">
                  <div className="equipment-slot-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{slot.name}</span>
                    {instId && <button onClick={() => onUnequipItem(instId)} style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', cursor: 'pointer', flexShrink: 0 }}>Unequip</button>}
                  </div>
                  <div className="equipment-slot-content" style={{ cursor: 'default' }}>
                    {gems.length > 0 && <div className="gem-overlays-container">
                      {gems[0] && <div className={`gem-overlay ${(gemInfo(gems[0].id).category || 'misc').toLowerCase()}`}>{(gemInfo(gems[0].id).name || 'Gem').slice(0, 3)}</div>}
                      {gems[1] && <div className={`gem-overlay ${(gemInfo(gems[1].id).category || 'misc').toLowerCase()}`}>{(gemInfo(gems[1].id).name || 'Gem').slice(0, 3)}</div>}
                    </div>}
                    {base
                      ? <><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ItemIcon subType={base.subType} quality={itemQuality(item)} size={40} /></div><span className="item-tier-label">T{item.tier}</span></>
                      : <span style={{ fontSize: '11px', color: '#71717a' }}>Empty</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><span style={{ fontSize: '11px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Ledger</span></div>
            <AccordionItem title={<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9M3 12h9m-9 4h6" /></svg><span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Sort & Filter</span></div>}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[['Category', 'category', ['All', ...Object.keys(INVENTORY_BAGS)]], ['Tier', 'tier', ['All', ...Array.from({ length: 20 }, (_, i) => String(i + 1))]], ['Quality', 'quality', ['All', 'Dropper', 'Shadow', 'Echo']], ['Sort By', 'sortBy', [['tier', 'Tier'], ['name', 'Name'], ['type', 'Type']]]].map(([label, key, opts]: any) => (
                  <div key={String(key)}>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#d4d4d8', display: 'block', marginBottom: '2px' }}>{label}</label>
                    <select className="editor-input" style={{ width: '100%', fontSize: '12px', padding: '4px 8px' }} value={(filterState as any)[key]} onChange={e => onSetFilterState((prev: any) => ({ ...prev, [key]: e.target.value }))}>
                      {opts.map((o: any) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </AccordionItem>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{renderInventoryBags()}</div>
          </div>
        )}

        {/* Player Info */}
        {activeTab === 'stats' && (
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Combat Attributes</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
              {[['Armor Class (AC)', player.derivedStats.AC?.toFixed(1)], ['Weapon Class (WC)', player.derivedStats.WC?.toFixed(1)], ['Spell Class (SC)', player.derivedStats.SC?.toFixed(1)], ['Hit Probability', `${player.derivedStats.hitChance?.toFixed(1)}%`], ['Critical Chance', `${player.derivedStats.critChance?.toFixed(1)}%`], ['Max Health', Math.round(player.derivedStats.maxHp)]].map(([k, v]) => (
                <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: '#9ca3af' }}>{k}</span><span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Log */}
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
                  if (val) onUpdateName(val)
                }}>Update Profile</button>
                <button onClick={onResetSave} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', background: 'transparent', cursor: 'pointer' }}>Reset Progress & Restore Chassis</button>
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Display</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div><div style={{ color: '#e4e4e7' }}>Dark Mode</div><div style={{ fontSize: '10px', color: '#71717a' }}>Onyx black HUD -- no cyan glass</div></div>
                <button className="footer-tab-button" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={onToggleTheme}>{theme === 'onyx' ? 'On' : 'Off'}</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '10px' }}>
                <div><div style={{ color: '#e4e4e7' }}>Map Character</div><div style={{ fontSize: '10px', color: '#71717a' }}>Your race on the Graphics map</div></div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['male', 'female'] as const).map(g => (
                    <button key={g} className={`footer-tab-button${avatarGender === g ? ' active' : ''}`} style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => onSetAvatarGender(g)}>{g === 'male' ? 'Male' : 'Female'}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Item Modal */}
        {equipPopup && (() => {
          const modalItem = player.inventory.find((i: any) => i.instanceId === equipPopup)
          const modalBase = modalItem ? BASE_ITEMS.find((b: any) => b.id === modalItem.baseItemId) : null
          if (!modalItem || !modalBase) return null
          const modalGems = modalItem.socketedGems || []
          const isEquipped = Object.values(player.equipment).includes(equipPopup)
          const tierData = DROPPER_TIERS.find((t: any) => t.tier === modalItem.tier) || DROPPER_TIERS[0]
          const slotMod = SLOT_MODS[modalBase.subType] || {}
          const statVal = (tierData.cv * (modalItem.qualityMultiplier ?? 1) * (modalItem.infusionMult ?? 1) * (slotMod.prop || 0.8)).toFixed(2)
          const statLabel = slotMod.stat || 'AC'
          const RARITY_COLORS: Record<string, string> = { Common: '#D1D5DB', Uncommon: '#30D158', Rare: '#0A84FF', Epic: '#BF5AF2', Legendary: '#FF9F0A', Mythic: '#FF375F' }
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => onSetEquipPopup(null)}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => onSetEquipPopup(null)} style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                <div><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: modalItem.type === 'Shadow' ? '#BF5AF2' : modalItem.type === 'Echo' ? '#94a3b8' : '#fff' }}>{itemDisplayName(modalItem, modalBase)}</h3><p style={{ margin: '2px 0 0', fontSize: '12px', color: '#3EE0FF', fontWeight: 700 }}>Tier {modalItem.tier} · {modalBase.subType}{modalItem.qualityMultiplier != null ? ` · ${Math.round(modalItem.qualityMultiplier * 100)}% quality` : ''}</p></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                  <ItemIcon subType={modalBase.subType} quality={itemQuality(modalItem)} size={96} />
                  <span style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(255,214,10,0.95)', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px', color: '#09090b' }}>T{modalItem.tier}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}><span style={{ fontSize: '13px', color: '#94a3b8' }}>Type</span><span style={{ fontSize: '13px', color: '#3EE0FF', fontWeight: 700 }}>{modalBase.subType}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: modalGems.length > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}><span style={{ fontSize: '13px', color: '#94a3b8' }}>{statLabel}</span><span style={{ fontSize: '13px', color: '#3EE0FF', fontWeight: 700 }}>{statVal}</span></div>
                  {enchantmentLines(modalItem).map((l, i) => (
                    <div key={`e${i}`} style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#BF5AF2' }}>✦ {l}</div>
                  ))}
                  {modalGems.map((g: any, i: number) => {
                    const gd = gemInfo(g.id)
                    return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GemIcon id={g.id} size={22} /><span style={{ fontSize: '13px', color: '#94a3b8' }}>{gd.name} G{g.grade}</span></div><span style={{ fontSize: '11px', color: '#3EE0FF' }}>{gemEffectText(g.id, g.grade)}</span></div>
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => onEquipItem(equipPopup)} style={{ padding: '14px 0', borderRadius: '12px', background: isEquipped ? 'rgba(48,209,88,0.15)' : 'rgba(62,224,255,0.15)', border: `1.5px solid ${isEquipped ? '#30D158' : '#3EE0FF'}`, color: isEquipped ? '#30D158' : '#3EE0FF', fontSize: '14px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em' }}>{isEquipped ? '✓ EQUIPPED' : 'EQUIP'}</button>
                  <button onClick={() => onSetEquipPopup(null)} style={{ padding: '14px 0', borderRadius: '12px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.2)', color: '#64748b', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>CANCEL</button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
