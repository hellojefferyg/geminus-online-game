// src/admin/sections.tsx
// One editor per balance section. Each gets the working value, the code default and onChange.
import { useMemo, useState } from 'react'
import STAMPS from '../data/stamps.json'
import { C, card, label, Table, NumberGrid, NumInput, Search, btn, type Column } from './fields'

type EditorProps = { value: any; def: any; onChange: (v: any) => void }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

const GDD_HELP: Record<string, string> = {
  XP_BASE: 'XP to level = base × growth^level', XP_GROWTH: 'XP curve steepness', AP_PER_LEVEL: 'Attribute points per level',
  DAMAGE_CONST: 'Damage = const × WC ÷ enemy DEF', AC_REDUCTION: 'Monster damage divides by AC × this',
  MAX_HP_BASE: 'HP before VIT', MAX_HP_PER_VIT: 'HP per point of VIT', AC_VIT_SCALE: 'AC bonus per VIT',
  CLASS_STAT_SCALE: 'WC/SC bonus per focus stat', HIT_BASE: 'Base hit %', HIT_PER_FOCUS: 'Hit % per focus stat',
  CRIT_BASE: 'Base crit %', CRIT_PER_FOCUS: 'Crit % per focus stat', SPELLSTRIKE_MOD: 'Hybrid damage multiplier',
  DEFAULT_CRIT_MULT: 'Crit damage multiplier', REGEN_BASE: 'Base HP regen', REGEN_PER_LEVEL: 'Regen per level',
  CLASSVALUE_BASE: 'Gear value at tier 1', CLASSVALUE_GROWTH: 'Gear value growth per tier (also monster forge scaling)',
  GEM_POUCH_CAP: 'Gem pouch size', GEM_STEP_UP: 'Chance a gem drop rolls one grade higher',
}
const FORGE_HELP: Record<string, string> = {
  FLOOR_WC: 'Minion tuning: player WC one tier behind', FLOOR_AC: 'Minion tuning: player AC one tier behind',
  CEIL_WC: 'Boss tuning: player WC at zone tier', CEIL_AC: 'Boss tuning: player AC at zone tier',
  MINION_DEF: 'Minion DEF at tier 1', BOSS_DEF: 'Boss DEF at tier 1', MINION_HITS: 'Hits to kill a minion', BOSS_HITS: 'Hits to kill a boss',
  MINION_HP_MIN: 'Minion HP floor', BOSS_HP_MIN: 'Boss HP floor', MINION_DMG_SHARE: 'Minion hit = player HP ÷ this',
  BOSS_DMG_SHARE: 'Boss hit = player HP ÷ this', PLAYER_VIT_PER_LEVEL: 'Assumed VIT per level',
  XP_PER_LEVEL: 'XP reward = zone level × this', GOLD_PER_LEVEL: 'Gold reward = zone level × this',
}

function Intro({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 10px' }}>{children}</p>
}

// ─── Core ─────────────────────────────────────────────────────────

export function GddEditor({ value, def, onChange }: EditorProps) {
  return <div style={card}>
    <Intro>Core combat, XP and stat formulas. Orange = changed from the code default.</Intro>
    <NumberGrid value={value} defaults={def} help={GDD_HELP} onEdit={(k, v) => onChange({ ...value, [k]: v })} />
  </div>
}

export function TiersEditor({ value, def, onChange }: EditorProps) {
  const cols: Column[] = [
    { key: 'tier', label: 'Tier', kind: 'readonly' }, { key: 'levelReq', label: 'Level req', kind: 'num', width: 90 },
    { key: 'gold', label: 'Shop price', kind: 'num', width: 120 }, { key: 'cv', label: 'Class value', kind: 'num', width: 80 },
  ]
  return <div style={card}>
    <Intro>Gear tiers: level to use/buy, Armory price (sell = 25%), and class value (base WC/SC/AC).</Intro>
    <Table rows={value} defaults={def} columns={cols} rowKey={r => String(r.tier)}
      onEdit={(i, k, v) => { const n = clone(value); n[i][k] = v; onChange(n) }} />
  </div>
}

export function ZoneTypesEditor({ value, def, onChange }: EditorProps) {
  const rows = Object.entries<any>(value).map(([k, r]) => ({ _key: k, ...r, shadow: r.shadow === 'ladder' ? -1 : r.shadow }))
  const defRows = Object.entries<any>(def).map(([k, r]) => ({ _key: k, ...r, shadow: r.shadow === 'ladder' ? -1 : r.shadow }))
  const cols: Column[] = [
    { key: '_key', label: 'Type', kind: 'readonly' }, { key: 'xp', label: 'XP ×', kind: 'num', width: 70 },
    { key: 'gold', label: 'Gold ×', kind: 'num', width: 70 }, { key: 'shadow', label: 'Shadow rate', kind: 'num', width: 100 },
    { key: 'gem', label: 'Gem rate', kind: 'num', width: 100 }, { key: 'hpDef', label: 'Monster HP/DEF ×', kind: 'num', width: 80 },
  ]
  return <div style={card}>
    <Intro>Per zone type. Rates are chances per kill (0.004 = 1 in 250). Shadow rate −1 = use the Shadow Ladder.</Intro>
    <Table rows={rows} defaults={defRows} columns={cols} rowKey={r => r._key}
      onEdit={(i, k, v) => {
        const key = rows[i]._key; const n = clone(value)
        n[key][k] = k === 'shadow' && v < 0 ? 'ladder' : v
        onChange(n)
      }} />
  </div>
}

export function KeyNumberEditor({ value, def, onChange, intro, keyLabel, valueLabel }: EditorProps & { intro: string; keyLabel: string; valueLabel: string }) {
  const [newKey, setNewKey] = useState('')
  return <div style={card}>
    <Intro>{intro}</Intro>
    {Object.entries<number>(value).map(([k, v]) => (
      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
        <span style={{ width: '70px', fontFamily: 'monospace', color: C.text, fontSize: '12px' }}>{k}</span>
        <NumInput value={v} def={def[k]} onChange={n => onChange({ ...value, [k]: n })} width={110} />
        <button style={btn(C.red)} onClick={() => { const n = { ...value }; delete n[k]; onChange(n) }}>Remove</button>
      </div>
    ))}
    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
      <input className="editor-input" placeholder={keyLabel} value={newKey} onChange={e => setNewKey(e.target.value.toUpperCase())} style={{ width: '90px', padding: '4px 6px', fontSize: '12px' }} />
      <button style={btn(C.cyan, !/^Z\d+$/.test(newKey) || newKey in value)} onClick={() => { if (/^Z\d+$/.test(newKey) && !(newKey in value)) { onChange({ ...value, [newKey]: 0 }); setNewKey('') } }}>Add {valueLabel}</button>
    </div>
  </div>
}

// ─── Monsters & zones ─────────────────────────────────────────────

export function StarterMonstersEditor({ value, def, onChange }: EditorProps) {
  const cols: Column[] = [
    { key: 'id', label: 'ID', kind: 'readonly' }, { key: 'name', label: 'Name', kind: 'text', width: 150 },
    { key: 'hp', label: 'HP', kind: 'num', width: 70 }, { key: 'atk', label: 'ATK', kind: 'num', width: 70 },
    { key: 'def', label: 'DEF', kind: 'num', width: 70 }, { key: 'xp', label: 'XP', kind: 'num', width: 70 },
    { key: 'gold', label: 'Gold', kind: 'num', width: 70 },
  ]
  return <div style={card}>
    <Intro>Stats for every starter zone (Z01–Z24). Zones show their own monster names; these stats apply to the matching slot.</Intro>
    <Table rows={value} defaults={def} columns={cols} rowKey={r => r.id}
      onEdit={(i, k, v) => { const n = clone(value); n[i][k] = v; onChange(n) }} />
  </div>
}

export function ForgeEditor({ value, def, onChange }: EditorProps) {
  return <div style={card}>
    <Intro>Monster Forge: how monster stats are generated for every non-starter zone from its level and gear tier.</Intro>
    <NumberGrid value={value} defaults={def} help={FORGE_HELP} onEdit={(k, v) => onChange({ ...value, [k]: v })} />
  </div>
}

const GEARS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX']
const STAMP_IDS = Object.keys(STAMPS).filter(k => !k.startsWith('_'))

export function ZonesEditor({ value, def, onChange, zoneTypes }: EditorProps & { zoneTypes: string[] }) {
  const [q, setQ] = useState('')
  const all = useMemo(() => Object.entries<any>(value).map(([k, z]) => ({ _key: k, ...z })), [value])
  const rows = all.filter(r => !q || `${r._key} ${r.name} ${r.type}`.toLowerCase().includes(q.toLowerCase()))
  const defRows = Object.entries<any>(def).map(([k, z]) => ({ _key: k, ...z }))
  const cols: Column[] = [
    { key: '_key', label: 'Zone', kind: 'readonly' }, { key: 'name', label: 'Name', kind: 'text', width: 170 },
    { key: 'level', label: 'Level', kind: 'num', width: 80 }, { key: 'gear', label: 'Gear', kind: 'select', options: GEARS },
    { key: 'type', label: 'Type', kind: 'select', options: zoneTypes }, { key: 'gemMin', label: 'Gem min', kind: 'num', width: 55 },
    { key: 'gemMax', label: 'Gem max', kind: 'num', width: 55 }, { key: 'stamp', label: 'Map layout', kind: 'select', options: STAMP_IDS },
    { key: 'shadow', label: 'Shadow (label)', kind: 'text', width: 70 }, { key: 'gemRate', label: 'Gem (label)', kind: 'text', width: 70 },
  ]
  return <div style={card}>
    <Intro>Entry level, gear tier (drops + monster forge), zone type and gem grades. The two “label” columns are only shown to players.</Intro>
    <Search value={q} onChange={setQ} placeholder="Search zones (id, name, type)…" />
    <Table rows={rows} defaults={defRows} columns={cols} rowKey={r => r._key}
      onEdit={(i, k, v) => { const key = rows[i]._key; const n = clone(value); n[key][k] = v; onChange(n) }} />
  </div>
}

// ─── Gems & enchantments ──────────────────────────────────────────

export function GemsEditor({ value, def, onChange }: EditorProps) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<{ group: 'standard' | 'fusion'; id: string }>({ group: 'standard', id: 'warstone' })
  const list = (['standard', 'fusion'] as const).flatMap(g => Object.entries<any>(value[g]).map(([id, gem]) => ({ group: g, id, gem })))
    .filter(x => !q || `${x.id} ${x.gem.name} ${x.gem.category}`.toLowerCase().includes(q.toLowerCase()))
  const gem = value[sel.group]?.[sel.id]
  const dgem = def[sel.group]?.[sel.id]
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  const effects: string[] = gem ? (sel.group === 'fusion' ? gem.effects : [gem.effect]) : []
  const setGem = (fn: (g: any) => void) => { const n = clone(value); fn(n[sel.group][sel.id]); onChange(n) }

  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)', gap: '10px' }} className="god-split">
    <div style={card}>
      <Search value={q} onChange={setQ} placeholder="Search gems…" />
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {list.map(x => (
          <button key={x.group + x.id} onClick={() => setSel({ group: x.group, id: x.id })}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', marginBottom: '2px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
              background: sel.id === x.id && sel.group === x.group ? 'rgba(62,224,255,0.15)' : 'transparent', border: 'none',
              color: JSON.stringify(x.gem) !== JSON.stringify(def[x.group]?.[x.id]) ? C.changed : C.text }}>
            {x.gem.name} <span style={{ color: C.dim, fontSize: '10px' }}>{x.group === 'fusion' ? 'fusion' : x.gem.category}</span>
          </button>
        ))}
      </div>
    </div>
    {gem && <div style={card}>
      <div style={{ fontSize: '14px', fontWeight: 800, color: C.cyan }}>{gem.name}</div>
      <Intro>{gem.description}</Intro>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead><tr><th style={{ ...label, textAlign: 'left', padding: '4px 6px' }}>Grade</th>
            {effects.map(e => <th key={e} style={{ ...label, textAlign: 'left', padding: '4px 6px' }}>{e}</th>)}
            <th style={{ ...label, textAlign: 'left', padding: '4px 6px' }}>Min level</th></tr></thead>
          <tbody>
            {grades.map(g => (
              <tr key={g} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '4px 6px', color: C.text }}>G{g}</td>
                {effects.map(e => (
                  <td key={e} style={{ padding: '4px 6px' }}>
                    {sel.group === 'fusion'
                      ? <NumInput value={gem.grades[g]?.[e]} def={dgem?.grades[g]?.[e]} onChange={v => setGem(x => { x.grades[g][e] = v })} width={70} />
                      : <NumInput value={gem.grades[g]} def={dgem?.grades[g]} onChange={v => setGem(x => { x.grades[g] = v })} width={70} />}
                  </td>
                ))}
                <td style={{ padding: '4px 6px' }}>
                  {gem.minLevel ? <NumInput value={gem.minLevel[g]} def={dgem?.minLevel?.[g]} onChange={v => setGem(x => { x.minLevel[g] = v })} width={90} /> : <span style={{ color: C.dim }}>tier gate</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>}
  </div>
}

export function EnchantmentsEditor({ value, def, onChange }: EditorProps) {
  const [sel, setSel] = useState(0)
  const e = value[sel]
  const de = def.find((x: any) => x.id === e?.id)
  const setStat = (stat: string, i: number, v: number) => { const n = clone(value); n[sel].stats[stat][i] = v; onChange(n) }
  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)', gap: '10px' }} className="god-split">
    <div style={card}>
      {value.map((x: any, i: number) => (
        <button key={x.id} onClick={() => setSel(i)}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', marginBottom: '2px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', border: 'none',
            background: sel === i ? 'rgba(62,224,255,0.15)' : 'transparent',
            color: JSON.stringify(x) !== JSON.stringify(def.find((d: any) => d.id === x.id)) ? C.changed : C.text }}>
          {x.name} <span style={{ color: C.dim, fontSize: '10px' }}>{x.family}</span>
        </button>
      ))}
    </div>
    {e && <div style={card}>
      <div style={{ fontSize: '14px', fontWeight: 800, color: C.purple }}>{e.name}</div>
      <Intro>{e.description}. Values per magic tier (item tier ÷ 2.25). Percent stats are fractions: 0.05 = +5%.</Intro>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead><tr><th style={{ ...label, textAlign: 'left', padding: '4px 6px' }}>Stat</th>
            {Array.from({ length: 9 }, (_, i) => <th key={i} style={{ ...label, padding: '4px 6px' }}>M{i + 1}</th>)}</tr></thead>
          <tbody>
            {Object.entries<number[]>(e.stats).map(([stat, arr]) => (
              <tr key={stat} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '4px 6px', color: C.text, fontFamily: 'monospace' }}>{stat}</td>
                {arr.map((v, i) => <td key={i} style={{ padding: '4px 4px' }}><NumInput value={v} def={de?.stats[stat]?.[i]} onChange={n => setStat(stat, i, n)} width={62} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>}
  </div>
}
