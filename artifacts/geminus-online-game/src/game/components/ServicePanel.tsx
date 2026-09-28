// src/game/components/ServicePanel.tsx
// Town services opened from map tiles: Sanctuary, Gilded Vault, Armory, Arcanium, Gemcutter
// Logic lives in systems/services.ts -- this component only renders and forwards results.
import { useState } from 'react'
import ItemIcon, { itemQuality } from './ItemIcon'
import GemIcon from './GemIcon'
import AccordionItem from './AccordionItem'
import {
  type ServiceResult,
  sanctuaryRest, depositGold, withdrawGold,
  shopStock, tierInfo, buyItem, sellItem, sellPrice,
  socketCapacity, socketGem, unsocketGem, upgradeGems, fuseGems,
  groupPouch, countGems, gemInfo, gemEffectText, gemMinLevel,
  FUSION_RECIPES, MAX_GEM_GRADE, UNSOCKET_COST, fuseCost,
  itemDisplayName, enchantmentLines,
  zoneIds, zoneInfo, exitDestinations, canEnterZone, travelTo, TELEPORT_COST, homeZone,
  shatterItem, shatterYield, infuseItem, infusionCost, rerollItemEnchant, rerollCost, SOULFORGE,
  salvageGems, salvageRange, MASS_SALVAGE_LEVEL, crucibleFuse, crucibleCost,
} from '../../systems/services'

function fmt(n: number): string {
  if (!n || isNaN(n)) return '0'
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}


const card: React.CSSProperties = { padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }
const label: React.CSSProperties = { fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '12px' }
const muted: React.CSSProperties = { color: '#71717a', fontSize: '11px', textAlign: 'center', padding: '12px' }
const actBtn = (color: string, disabled = false): React.CSSProperties => ({
  flexShrink: 0, fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? 'rgba(255,255,255,0.04)' : `${color}20`, border: `1px solid ${disabled ? 'rgba(255,255,255,0.12)' : color + '80'}`,
  color: disabled ? '#52525b' : color,
})

interface ServicePanelProps {
  service: { label: string; color: string; action: string }
  player: any
  BASE_ITEMS: any[]
  onResult: (result: ServiceResult, reason: string) => void
  onClose: () => void
}

export default function ServicePanel({ service, player, BASE_ITEMS, onResult, onClose }: ServicePanelProps) {
  const act = service.action
  const run = (result: ServiceResult) => onResult(result, act)

  return (
    <div className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: service.color, letterSpacing: '0.04em' }}>{service.label}</div>
          <div style={{ fontSize: '10.5px', color: '#FFD60A', fontFamily: 'monospace' }}>Gold {fmt(player.gold)} · Bank {fmt(player.bank)}
            {act === 'gemcutter' && <span style={{ color: '#5AC8FA' }}> · Dust {fmt(player.gemDust)}</span>}
            {act === 'soulforge' && <span style={{ color: '#BF5AF2' }}> · Essence {fmt(player.essence)}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black', border: '1px solid rgba(255,255,255,0.2)', color: '#d4d4d8', fontSize: '18px', cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {act === 'sanctuary' && <Sanctuary player={player} run={run} />}
        {act === 'vault' && <Vault player={player} run={run} />}
        {(act === 'armory' || act === 'arcanium') && <Merchant shop={act} player={player} BASE_ITEMS={BASE_ITEMS} run={run} />}
        {act === 'gemcutter' && <Gemcutter player={player} BASE_ITEMS={BASE_ITEMS} run={run} />}
        {(act === 'portal' || act === 'teleport') && <Travel mode={act} player={player} run={run} />}
        {act === 'soulforge' && <Soulforge player={player} BASE_ITEMS={BASE_ITEMS} run={run} />}
        {!['sanctuary', 'vault', 'armory', 'arcanium', 'gemcutter', 'portal', 'teleport', 'soulforge'].includes(act) && <div style={muted}>{service.label} -- coming soon!</div>}
      </div>
    </div>
  )
}

type Run = (r: ServiceResult) => void

// ─── Sanctuary ────────────────────────────────────────────────────
function Sanctuary({ player, run }: { player: any; run: Run }) {
  const max = player.derivedStats?.maxHp ?? 100
  const hp = Math.round(player.hp ?? max)
  return (
    <div style={card}>
      <span style={label}>Chassis Integrity</span>
      <div style={row}><span style={{ color: '#9ca3af' }}>Health</span><span style={{ color: '#30D158', fontWeight: 700, fontFamily: 'monospace' }}>{hp} / {Math.round(max)}</span></div>
      <button className="glass-button" style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '8px', marginTop: '8px' }} onClick={() => run(sanctuaryRest(player))}>Rest & Restore Health</button>
    </div>
  )
}

// ─── Gilded Vault ─────────────────────────────────────────────────
function Vault({ player, run }: { player: any; run: Run }) {
  const [amount, setAmount] = useState('')
  const amt = Number(amount.replace(/[^\d]/g, '')) || 0
  return (
    <div style={card}>
      <span style={label}>Gilded Vault</span>
      <div style={row}><span style={{ color: '#9ca3af' }}>On hand</span><span style={{ color: '#FFD60A', fontWeight: 700, fontFamily: 'monospace' }}>{Math.floor(player.gold || 0).toLocaleString()}</span></div>
      <div style={row}><span style={{ color: '#9ca3af' }}>In vault</span><span style={{ color: '#FFD60A', fontWeight: 700, fontFamily: 'monospace' }}>{Math.floor(player.bank || 0).toLocaleString()}</span></div>
      <input className="editor-input" inputMode="numeric" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', marginTop: '8px', padding: '6px 8px', fontSize: '12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
        <button className="glass-button" style={{ padding: '6px', fontSize: '12px', borderRadius: '8px' }} onClick={() => { run(depositGold(player, amt)); setAmount('') }}>Deposit</button>
        <button className="glass-button" style={{ padding: '6px', fontSize: '12px', borderRadius: '8px' }} onClick={() => { run(withdrawGold(player, amt)); setAmount('') }}>Withdraw</button>
        <button className="footer-tab-button" style={{ padding: '6px', fontSize: '11px' }} onClick={() => run(depositGold(player, player.gold || 0))}>Deposit All</button>
        <button className="footer-tab-button" style={{ padding: '6px', fontSize: '11px' }} onClick={() => run(withdrawGold(player, player.bank || 0))}>Withdraw All</button>
      </div>
    </div>
  )
}

// ─── Armory / Arcanium ────────────────────────────────────────────
function Merchant({ shop, player, BASE_ITEMS, run }: { shop: string; player: any; BASE_ITEMS: any[]; run: Run }) {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [tier, setTier] = useState(1)
  const t = tierInfo(tier)
  const locked = (player.level || 1) < t.levelReq
  const equipped = Object.values(player.equipment || {})
  const sellable = (player.inventory || []).filter((i: any) => !equipped.includes(i.instanceId))

  return (
    <>
      <div style={{ display: 'flex', gap: '4px' }}>
        {(['buy', 'sell'] as const).map(k => (
          <button key={k} className={`hud-nav-pill${tab === k ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => setTab(k)}>{k === 'buy' ? 'Buy' : 'Sell'}</button>
        ))}
      </div>
      {tab === 'buy' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <span style={{ ...label, marginBottom: 0 }}>Stock</span>
            <select className="editor-input" value={tier} onChange={e => setTier(Number(e.target.value))} style={{ fontSize: '12px', padding: '4px 8px' }}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Tier {n}</option>)}
            </select>
          </div>
          <div style={{ fontSize: '10.5px', color: locked ? '#f87171' : '#94a3b8', marginBottom: '4px' }}>
            {fmt(t.gold)} gold each · requires level {t.levelReq.toLocaleString()}
          </div>
          {shopStock(shop, BASE_ITEMS).map(b => {
            const disabled = locked || (player.gold || 0) < t.gold
            return (
              <div key={b.id} style={row}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}><ItemIcon subType={b.subType} size={32} /><span style={{ color: '#e4e4e7' }}>{b.name}</span></span>
                <button style={actBtn('#3EE0FF', disabled)} onClick={() => run(buyItem(player, b.id, tier, BASE_ITEMS))}>Buy</button>
              </div>
            )
          })}
        </div>
      )}
      {tab === 'sell' && (
        <div style={card}>
          <span style={label}>Unequipped items · sell for 25%</span>
          {sellable.length === 0 && <div style={muted}>Nothing to sell</div>}
          {sellable.map((item: any) => {
            const base = BASE_ITEMS.find(b => b.id === item.baseItemId)
            return (
              <div key={item.instanceId} style={row}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <ItemIcon subType={base?.subType || ''} quality={itemQuality(item)} size={32} />
                  <span style={{ color: '#e4e4e7' }}>{itemDisplayName(item, base)} <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>T{item.tier}</span></span>
                </span>
                <button style={actBtn('#FFD60A')} onClick={() => run(sellItem(player, item.instanceId))}>{fmt(sellPrice(item))}</button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Exits + Teleporter ───────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  starter: '#3EE0FF', xp: '#30D158', gold: '#FFD60A', shadow: '#BF5AF2', gem: '#5AC8FA', prestige: '#FF9500',
}

function Travel({ mode, player, run }: { mode: string; player: any; run: Run }) {
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const here = player.pos?.zoneId || 'Z01'
  const home = homeZone(player.race)
  const isTeleport = mode === 'teleport'
  const ids = isTeleport
    ? zoneIds().filter(id => id !== here && (filter === 'all' || canEnterZone(player, id)))
    : exitDestinations(here, player.race)

  return (
    <div style={card}>
      <span style={label}>{isTeleport ? 'Teleportation Hub · warp anywhere you have unlocked' : 'Exit · walk to a neighbouring zone (free)'}</span>
      {isTeleport && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          {(['open', 'all'] as const).map(k => (
            <button key={k} className={`hud-nav-pill${filter === k ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => setFilter(k)}>{k === 'open' ? 'Unlocked' : 'All Zones'}</button>
          ))}
        </div>
      )}
      {ids.length === 0 && <div style={muted}>No destinations</div>}
      {ids.map(id => {
        const z = zoneInfo(id)
        const open = canEnterZone(player, id)
        const cost = isTeleport ? TELEPORT_COST(id) : 0
        const disabled = !open || (player.gold || 0) < cost
        return (
          <div key={id} style={row}>
            <span style={{ minWidth: 0 }}>
              <span style={{ color: '#e4e4e7', fontWeight: 700 }}>{id}: {z.name}{id === home ? ' 🏠' : ''}</span>
              <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>
                Lv {z.level.toLocaleString()} · Tier {z.gear} · <span style={{ color: TYPE_COLORS[z.type] || '#fff', textTransform: 'capitalize' }}>{z.type}</span>
              </span>
            </span>
            <button style={actBtn(isTeleport ? '#FF375F' : '#94a3b8', disabled)} onClick={() => run(travelTo(player, id, cost))}>
              {!open ? `Lv ${fmt(z.level)}` : isTeleport ? fmt(cost) : 'Go'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Soulforge ────────────────────────────────────────────────────
function Soulforge({ player, BASE_ITEMS, run }: { player: any; BASE_ITEMS: any[]; run: Run }) {
  const [tab, setTab] = useState<'infuse' | 'reroll' | 'shatter'>('infuse')
  const [itemId, setItemId] = useState<string | null>(null)
  const equipped = Object.values(player.equipment || {})
  const inv: any[] = player.inventory || []
  const eligible = inv.filter(i =>
    tab === 'infuse' ? i.type !== 'Echo' : tab === 'reroll' ? i.type === 'Shadow' : (i.type === 'Shadow' || i.type === 'Echo') && !equipped.includes(i.instanceId))
  const item = eligible.find(i => i.instanceId === itemId) || null
  const base = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null
  const nameOf = (i: any) => `${equipped.includes(i.instanceId) ? '★ ' : ''}${itemDisplayName(i, BASE_ITEMS.find(b => b.id === i.baseItemId))} T${i.tier}`
  const afford = (c: { gold: number; essence: number }) => (player.gold || 0) >= c.gold && (player.essence || 0) >= c.essence

  return (
    <>
      <div style={{ display: 'flex', gap: '4px' }}>
        {(['infuse', 'reroll', 'shatter'] as const).map(k => (
          <button key={k} className={`hud-nav-pill${tab === k ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => { setTab(k); setItemId(null) }}>{k.charAt(0).toUpperCase() + k.slice(1)}</button>
        ))}
      </div>
      <div style={card}>
        <span style={label}>{tab === 'infuse' ? `Raise base stat +${SOULFORGE.INFUSION_GAIN * 100}% (max +${SOULFORGE.MAX_INFUSION})` : tab === 'reroll' ? 'Replace one enchantment on a Shadow item' : 'Destroy Shadow/Echo items for Essence'}</span>
        {tab !== 'shatter' && (
          <select className="editor-input" value={itemId || ''} onChange={e => setItemId(e.target.value || null)} style={{ width: '100%', fontSize: '12px', padding: '4px 8px' }}>
            <option value="">-- Select --</option>
            {eligible.map(i => <option key={i.instanceId} value={i.instanceId}>{nameOf(i)}</option>)}
          </select>
        )}
        {tab === 'infuse' && item && (() => {
          const c = infusionCost(item); const maxed = (item.infusionLevel || 0) >= SOULFORGE.MAX_INFUSION
          return (
            <div style={{ marginTop: '8px' }}>
              <div style={row}><span style={{ color: '#9ca3af' }}>{base?.name}</span><span style={{ color: '#fff', fontFamily: 'monospace' }}>+{item.infusionLevel || 0} · ×{(item.infusionMult ?? 1).toFixed(2)}</span></div>
              <div style={row}><span style={{ color: '#9ca3af' }}>Cost</span><span style={{ color: '#FFD60A', fontFamily: 'monospace' }}>{fmt(c.gold)} gold · <span style={{ color: '#BF5AF2' }}>{fmt(c.essence)} essence</span></span></div>
              <button className="glass-button" disabled={maxed || !afford(c)} style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '8px', marginTop: '8px', opacity: maxed || !afford(c) ? 0.5 : 1 }} onClick={() => run(infuseItem(player, item.instanceId))}>{maxed ? 'Max infusion' : 'Infuse'}</button>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>{SOULFORGE.CRIT_CHANCE * 100}% critical chance for double gain.</div>
            </div>
          )
        })()}
        {tab === 'reroll' && item && (() => {
          const c = rerollCost(item)
          return (
            <div style={{ marginTop: '8px' }}>
              <div style={row}><span style={{ color: '#9ca3af' }}>Cost per reroll</span><span style={{ color: '#FFD60A', fontFamily: 'monospace' }}>{fmt(c.gold)} gold · <span style={{ color: '#BF5AF2' }}>{fmt(c.essence)} essence</span></span></div>
              {(item.enchantments || []).length === 0 && <div style={muted}>This item has no enchantments.</div>}
              {enchantmentLines(item).map((l, i) => (
                <div key={i} style={row}>
                  <span style={{ color: '#BF5AF2', fontSize: '11px', minWidth: 0 }}>✦ {l}</span>
                  <button style={actBtn('#BF5AF2', !afford(c))} onClick={() => run(rerollItemEnchant(player, item.instanceId, i))}>Reroll</button>
                </div>
              ))}
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>{SOULFORGE.CRIT_CHANCE * 100}% critical chance to refund the cost.</div>
            </div>
          )
        })()}
        {tab === 'shatter' && (
          <>
            {eligible.length === 0 && <div style={muted}>No unequipped Shadow or Echo items</div>}
            {eligible.map(i => (
              <div key={i.instanceId} style={row}>
                <span style={{ color: i.type === 'Shadow' ? '#BF5AF2' : '#94a3b8', minWidth: 0 }}>{nameOf(i)}</span>
                <button style={actBtn('#FF375F')} onClick={() => window.confirm(`Shatter ${nameOf(i)}? This destroys the item.`) && run(shatterItem(player, i.instanceId))}>+{fmt(shatterYield(i))}</button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}

// ─── Gemcutter ────────────────────────────────────────────────────
function Gemcutter({ player, BASE_ITEMS, run }: { player: any; BASE_ITEMS: any[]; run: Run }) {
  const [tab, setTab] = useState<'socket' | 'upgrade' | 'fuse' | 'salvage' | 'crucible'>('socket')
  const [crucible, setCrucible] = useState<number[]>([])
  const [itemId, setItemId] = useState<string | null>(null)
  const gems: any[] = player.gems || []
  const socketable = (player.inventory || []).filter((i: any) => socketCapacity(i, BASE_ITEMS) > 0)
  const item = socketable.find((i: any) => i.instanceId === itemId) || null
  const itemBase = item ? BASE_ITEMS.find(b => b.id === item.baseItemId) : null
  const equipped = Object.values(player.equipment || {})
  const grouped = groupPouch(gems)

  return (
    <>
      <div style={{ display: 'flex', gap: '4px' }}>
        {(['socket', 'upgrade', 'fuse', 'salvage', 'crucible'] as const).map(k => (
          <button key={k} className={`hud-nav-pill${tab === k ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 4px' }} onClick={() => { setTab(k); setCrucible([]) }}>{k.charAt(0).toUpperCase() + k.slice(1)}</button>
        ))}
      </div>

      {tab === 'socket' && (
        <>
          <div style={card}>
            <span style={label}>Choose an item</span>
            <select className="editor-input" value={itemId || ''} onChange={e => setItemId(e.target.value || null)} style={{ width: '100%', fontSize: '12px', padding: '4px 8px' }}>
              <option value="">-- Select --</option>
              {socketable.map((i: any) => {
                const b = BASE_ITEMS.find(x => x.id === i.baseItemId)
                return <option key={i.instanceId} value={i.instanceId}>{equipped.includes(i.instanceId) ? '★ ' : ''}{itemDisplayName(i, b)} T{i.tier} ({(i.socketedGems || []).length}/{socketCapacity(i, BASE_ITEMS)})</option>
              })}
            </select>
            {item && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {Array.from({ length: socketCapacity(item, BASE_ITEMS) }, (_, s) => {
                    const g = (item.socketedGems || [])[s]
                    const gi = g ? gemInfo(g.id) : null
                    return (
                      <div key={s} className="gem-item" style={{ width: '72px', cursor: g ? 'pointer' : 'default' }}
                        title={g ? `Unsocket (${UNSOCKET_COST} gold)` : 'Empty socket'}
                        onClick={() => g && run(unsocketGem(player, item.instanceId, s))}>
                        {g && gi ? <><GemIcon id={g.id} size={30} /><span className="item-label">{gi.name.slice(0, 3)}{g.grade}</span></> : <span className="item-label" style={{ color: '#52525b' }}>Empty</span>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>Tap a socketed gem to remove it ({UNSOCKET_COST} gold). {itemBase?.name}</div>
                {enchantmentLines(item).map((l, i) => <div key={i} style={{ fontSize: '10.5px', color: '#BF5AF2', marginTop: '2px' }}>✦ {l}</div>)}
              </>
            )}
          </div>
          <AccordionItem title={<span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>💎 Gem Pouch <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>({gems.length}/200)</span></span>}>
            <div className="gem-pouch-grid">
              {gems.length === 0 && <div style={{ ...muted, gridColumn: '1/-1' }}>No gems stored</div>}
              {gems.map((g: any, i: number) => {
                const gi = gemInfo(g.id)
                const gated = (player.level || 1) < gemMinLevel(g.id, g.grade || 1)
                return (
                  <div key={i} className="gem-item" style={{ opacity: !item || gated ? 0.5 : 1 }}
                    title={`${gi.name} G${g.grade}: ${gemEffectText(g.id, g.grade || 1)}${gated ? ` (level ${gemMinLevel(g.id, g.grade || 1).toLocaleString()})` : ''}`}
                    onClick={() => item && run(socketGem(player, item.instanceId, i, BASE_ITEMS))}>
                    <GemIcon id={g.id} size={30} /><span className="item-label">{gi.name.slice(0, 3)}{g.grade}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>{item ? 'Tap a gem to socket it.' : 'Select an item first.'}</div>
          </AccordionItem>
        </>
      )}

      {tab === 'upgrade' && (
        <div style={card}>
          <span style={label}>Combine 3 identical gems → next grade</span>
          {grouped.length === 0 && <div style={muted}>No gems stored</div>}
          {grouped.map(g => {
            const gi = gemInfo(g.id)
            const cost = fuseCost(g.grade)
            const disabled = g.count < 3 || g.grade >= MAX_GEM_GRADE || (player.gold || 0) < cost
            return (
              <div key={`${g.id}|${g.grade}`} style={row}>
                <span style={{ color: '#e4e4e7', minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}><GemIcon id={g.id} size={20} /> {gi.name} G{g.grade} <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>×{g.count}</span></span>
                <button style={actBtn('#5AC8FA', disabled)} onClick={() => run(upgradeGems(player, g.id, g.grade))}>{g.grade >= MAX_GEM_GRADE ? 'MAX' : `G${g.grade + 1} · ${fmt(cost)}`}</button>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'fuse' && (
        <div style={card}>
          <span style={label}>Fuse two gems of the same grade</span>
          {FUSION_RECIPES.map(r => {
            const grades = Array.from({ length: MAX_GEM_GRADE }, (_, i) => i + 1).filter(gr =>
              r.from[0] === r.from[1] ? countGems(gems, r.from[0], gr) >= 2 : countGems(gems, r.from[0], gr) > 0 && countGems(gems, r.from[1], gr) > 0)
            const ri = gemInfo(r.id)
            return (
              <div key={r.id} style={{ ...row, alignItems: 'flex-start' }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ color: '#e4e4e7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><GemIcon id={r.id} size={20} /> {r.name}</span>
                  <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>{gemInfo(r.from[0]).name} + {gemInfo(r.from[1]).name} · {ri.description}</span>
                </span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
                  {grades.length === 0
                    ? <span style={{ fontSize: '10px', color: '#52525b' }}>Missing gems</span>
                    : grades.map(gr => <button key={gr} style={actBtn('#BF5AF2', (player.gold || 0) < fuseCost(gr))} onClick={() => run(fuseGems(player, r.id, gr))}>G{gr} · {fmt(fuseCost(gr))}</button>)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'salvage' && (
        <div style={card}>
          <span style={label}>Break gems down into Gem Dust</span>
          {grouped.length === 0 && <div style={muted}>No gems stored</div>}
          {grouped.map(g => {
            const gi = gemInfo(g.id)
            const [lo, hi] = salvageRange(g.grade)
            return (
              <div key={`${g.id}|${g.grade}`} style={row}>
                <span style={{ color: '#e4e4e7', minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}><GemIcon id={g.id} size={20} /> {gi.name} G{g.grade} <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>×{g.count}</span>
                  <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>{lo}–{hi} dust each</span></span>
                <button style={actBtn('#5AC8FA')} onClick={() => run(salvageGems(player, g.id, g.grade))}>Salvage 1</button>
              </div>
            )
          })}
          {grouped.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ ...label, marginBottom: '4px' }}>Mass salvage by grade</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[...new Set(grouped.map(g => g.grade))].sort((a, b) => a - b).map(gr => {
                  const locked = (player.level || 1) < (MASS_SALVAGE_LEVEL[gr] ?? 1)
                  return <button key={gr} style={actBtn('#FF375F', locked)} onClick={() => window.confirm(`Salvage ALL grade ${gr} gems?`) && run(salvageGems(player, '', gr, true))}>{locked ? `G${gr} · Lv ${fmt(MASS_SALVAGE_LEVEL[gr])}` : `All G${gr}`}</button>
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'crucible' && (
        <div style={card}>
          <span style={label}>Two gems of the same grade + dust → a random gem</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {[0, 1].map(n => {
              const g = gems[crucible[n]]
              const gi = g ? gemInfo(g.id) : null
              return (
                <div key={n} className="gem-item" style={{ width: '64px' }} onClick={() => g && setCrucible(crucible.filter((_, i) => i !== n))}>
                  {g && gi ? <><GemIcon id={g.id} size={30} /><span className="item-label">{gi.name.slice(0, 3)}{g.grade}</span></> : <span className="item-label" style={{ color: '#52525b' }}>?</span>}
                </div>
              )
            })}
            <span style={{ color: '#94a3b8', fontSize: '18px' }}>→</span>
            <button style={actBtn('#5AC8FA', crucible.length < 2)} onClick={() => { run(crucibleFuse(player, crucible[0], crucible[1])); setCrucible([]) }}>
              Fuse · {crucible.length ? crucibleCost(gems[crucible[0]]?.grade || 1) : 25} dust
            </button>
          </div>
          <div className="gem-pouch-grid">
            {gems.length === 0 && <div style={{ ...muted, gridColumn: '1/-1' }}>No gems stored</div>}
            {gems.map((g: any, i: number) => {
              const gi = gemInfo(g.id)
              const picked = crucible.includes(i)
              const wrongGrade = crucible.length === 1 && gems[crucible[0]]?.grade !== g.grade
              return (
                <div key={i} className="gem-item" style={{ opacity: picked || wrongGrade ? 0.35 : 1 }}
                  onClick={() => !picked && !wrongGrade && crucible.length < 2 && setCrucible([...crucible, i])}>
                  <GemIcon id={g.id} size={30} /><span className="item-label">{gi.name.slice(0, 3)}{g.grade}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
