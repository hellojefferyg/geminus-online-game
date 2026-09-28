// src/game/components/DevPanel.tsx
// Dev-only testing tools. Shown only when the signed-in account has the Dev role.
import { useState } from 'react'
import { xpToLevel } from '../../gdd'
import { STANDARD_GEM_IDS, FUSION_RECIPES, gemInfo, rollEnchantments, zoneIds, zoneInfo, travelTo, type ServiceResult } from '../../systems/services'
import { writeDraft } from '../../systems/balance'

export interface DevFlags { oneHit: boolean; noDamage: boolean; forceDrop: '' | 'gem' | 'shadow' }

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }
const lbl: React.CSSProperties = { fontSize: '12px', color: '#fff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', width: '100%', marginBottom: '2px' }
const b = (color = '#FF375F'): React.CSSProperties => ({ fontSize: '14px', fontWeight: 800, padding: '11px 16px', borderRadius: '11px', cursor: 'pointer', background: `${color}1f`, border: `1px solid ${color}88`, color, minHeight: '44px' })
const sel: React.CSSProperties = { padding: '10px 12px', fontSize: '16px', minHeight: '44px' }  // 16px stops iOS zooming in

interface Props {
  player: any
  BASE_ITEMS: any[]
  flags: DevFlags
  balanceInfo: { version: number | null; draft: boolean }
  onFlags: (f: DevFlags) => void
  onApply: (r: ServiceResult, reason: string) => void
  onClose: () => void
}

export default function DevPanel({ player, BASE_ITEMS, flags, balanceInfo, onFlags, onApply, onClose }: Props) {
  const [level, setLevel] = useState(String(player.level || 1))
  const [gem, setGem] = useState('warstone')
  const [grade, setGrade] = useState(1)
  const [itemId, setItemId] = useState(BASE_ITEMS[0]?.id || '')
  const [tier, setTier] = useState(1)
  const [quality, setQuality] = useState<'Dropper' | 'Shadow' | 'Echo'>('Shadow')
  const [zone, setZone] = useState(player.pos?.zoneId || 'Z01')

  const give = (patch: (p: any) => any, msg: string) => onApply({ ok: true, player: patch({ ...player, inventory: [...(player.inventory || [])], gems: [...(player.gems || [])] }), msg: `DEV: ${msg}` }, 'dev')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      background: 'radial-gradient(circle at 50% 0%, #2a0a12 0%, #0a0508 45%, #030104 100%)' }}>
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 16px max(28px, env(safe-area-inset-bottom))' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        padding: 'max(14px, env(safe-area-inset-top)) 0 12px', background: 'rgba(8,3,6,0.94)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,55,95,0.35)' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FF375F', letterSpacing: '0.1em' }}>DEV TOOLS</div>
          <div style={{ fontSize: '13px', color: balanceInfo.draft ? '#BF5AF2' : '#94a3b8' }}>
            {balanceInfo.draft ? 'Previewing a DRAFT balance (only you)' : balanceInfo.version ? `Live balance v${balanceInfo.version}` : 'Balance: code defaults'}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close dev tools" style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '50%', background: 'black', border: '1px solid rgba(255,255,255,0.25)', color: '#e4e4e7', fontSize: '26px', lineHeight: 1, cursor: 'pointer' }}>×</button>
      </div>

      <div style={row}>
        <span style={lbl}>God Editor</span>
        <a href="/admin" style={{ ...b('#3EE0FF'), textDecoration: 'none' }}>Open God Editor</a>
        {balanceInfo.draft && <button style={b('#BF5AF2')} onClick={() => { writeDraft(null); window.location.reload() }}>Stop draft preview</button>}
      </div>

      <div style={row}>
        <span style={lbl}>Currency</span>
        <button style={b('#FFD60A')} onClick={() => give(p => ({ ...p, gold: (p.gold || 0) + 1e6 }), '+1M gold')}>+1M gold</button>
        <button style={b('#FFD60A')} onClick={() => give(p => ({ ...p, gold: (p.gold || 0) + 1e9 }), '+1B gold')}>+1B gold</button>
        <button style={b('#5AC8FA')} onClick={() => give(p => ({ ...p, gemDust: (p.gemDust || 0) + 1000 }), '+1000 dust')}>+1K dust</button>
        <button style={b('#BF5AF2')} onClick={() => give(p => ({ ...p, essence: (p.essence || 0) + 100000 }), '+100K essence')}>+100K essence</button>
      </div>

      <div style={row}>
        <span style={lbl}>Character</span>
        <input className="editor-input" inputMode="numeric" value={level} onChange={e => setLevel(e.target.value)} style={{ width: '120px', ...sel }} />
        <button style={b()} onClick={() => { const lv = Math.max(1, Math.floor(Number(level) || 1)); give(p => ({ ...p, level: lv, xp: 0, xpToNextLevel: xpToLevel(lv) }), `level ${lv}`) }}>Set level</button>
        <button style={b()} onClick={() => give(p => ({ ...p, attributePoints: (p.attributePoints || 0) + 400 }), '+10 banked levels')}>+10 banked lvls</button>
        <button style={b('#30D158')} onClick={() => give(p => ({ ...p, hp: p.derivedStats?.maxHp ?? p.hp }), 'healed')}>Heal</button>
      </div>

      <div style={row}>
        <span style={lbl}>Add gem</span>
        <select className="editor-input" value={gem} onChange={e => setGem(e.target.value)} style={sel}>
          {[...STANDARD_GEM_IDS, ...FUSION_RECIPES.map(r => r.id)].map(id => <option key={id} value={id}>{gemInfo(id).name}</option>)}
        </select>
        <select className="editor-input" value={grade} onChange={e => setGrade(Number(e.target.value))} style={sel}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => <option key={g} value={g}>G{g}</option>)}
        </select>
        <button style={b('#5AC8FA')} onClick={() => give(p => ({ ...p, gems: [...p.gems, { id: gem, grade }] }), `${gemInfo(gem).name} G${grade}`)}>Add</button>
        <button style={b('#5AC8FA')} onClick={() => give(p => ({ ...p, gems: [...p.gems, { id: gem, grade }, { id: gem, grade }, { id: gem, grade }] }), `3× ${gemInfo(gem).name} G${grade}`)}>Add 3</button>
      </div>

      <div style={row}>
        <span style={lbl}>Add item</span>
        <select className="editor-input" value={itemId} onChange={e => setItemId(e.target.value)} style={sel}>
          {BASE_ITEMS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select className="editor-input" value={tier} onChange={e => setTier(Number(e.target.value))} style={sel}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map(t => <option key={t} value={t}>T{t}</option>)}
        </select>
        <select className="editor-input" value={quality} onChange={e => setQuality(e.target.value as any)} style={sel}>
          {['Dropper', 'Shadow', 'Echo'].map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        <button style={b('#3EE0FF')} onClick={() => {
          const qm = quality === 'Shadow' ? 1.5 : quality === 'Echo' ? 0.5 : undefined
          const item = { instanceId: crypto.randomUUID(), baseItemId: itemId, tier, type: quality, socketedGems: [],
            ...(qm ? { qualityMultiplier: qm, enchantments: quality === 'Shadow' ? rollEnchantments(tier, qm) : [] } : {}) }
          give(p => ({ ...p, inventory: [...p.inventory, item] }), `${quality} T${tier} item`)
        }}>Add</button>
      </div>

      <div style={row}>
        <span style={lbl}>Free teleport (ignores level)</span>
        <select className="editor-input" value={zone} onChange={e => setZone(e.target.value)} style={{ ...sel, flex: '1 1 220px', minWidth: 0 }}>
          {zoneIds().map(z => <option key={z} value={z}>{z}: {zoneInfo(z)?.name} (Lv {zoneInfo(z)?.level})</option>)}
        </select>
        <button style={b('#FF375F')} onClick={() => {
          // Travel as if max level, then keep the real level
          const r = travelTo({ ...player, level: Number.MAX_SAFE_INTEGER }, zone, 0)
          onApply(r.ok ? { ok: true, player: { ...r.player, level: player.level }, msg: `DEV: warped to ${zone}` } : r, 'dev-warp')
        }}>Warp</button>
      </div>

      <div style={row}>
        <span style={lbl}>Combat cheats (this session only)</span>
        {([['oneHit', 'One-hit kills'], ['noDamage', 'Take no damage']] as const).map(([k, t]) => (
          <button key={k} style={b(flags[k] ? '#30D158' : '#94a3b8')} onClick={() => onFlags({ ...flags, [k]: !flags[k] })}>{flags[k] ? '✓ ' : ''}{t}</button>
        ))}
        <select className="editor-input" value={flags.forceDrop} onChange={e => onFlags({ ...flags, forceDrop: e.target.value as any })} style={sel}>
          <option value="">Normal drops</option><option value="gem">Every kill drops a gem</option><option value="shadow">Every kill drops a Shadow</option>
        </select>
      </div>
    </div>
    </div>
  )
}
