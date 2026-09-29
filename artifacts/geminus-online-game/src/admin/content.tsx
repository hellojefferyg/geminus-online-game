// src/admin/content.tsx
// God Editor: Races (starting stats), Zone Monsters, Items (Geminus.1 RaceEditor / BestiaryEditor / ItemEditor).
import { useMemo, useState } from 'react'
import { races } from '../gdd.js'
import ZONES from '../data/zones.json'
import { C, card, label, Table, Search, Select, TextInput, type Column } from './fields'

type EditorProps = { value: any; def: any; onChange: (v: any) => void }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

function Intro({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 10px' }}>{children}</p>
}

export function RaceStartsEditor({ value, def, onChange }: EditorProps) {
  const rows = Object.entries<any>(value).map(([k, s]) => ({ _key: k, name: races[k]?.raceName || k, arch: races[k]?.archetype || '', ...s }))
  const defRows = Object.entries<any>(def).map(([k, s]) => ({ _key: k, ...s }))
  const cols: Column[] = [
    { key: 'name', label: 'Race', kind: 'readonly' }, { key: 'arch', label: 'Archetype', kind: 'readonly' },
    ...['STR', 'DEX', 'VIT', 'NTL', 'WIS'].map(st => ({ key: st, label: st, kind: 'num' as const, width: 56 })),
  ]
  return <div style={card}>
    <Intro>Stats a brand-new character starts with. Only affects characters created after you publish; existing players keep theirs.</Intro>
    <Table rows={rows} defaults={defRows} columns={cols} rowKey={r => r._key}
      onEdit={(i, k, v) => { const n = clone(value); n[rows[i]._key][k] = v; onChange(n) }} />
  </div>
}

const RANKS = ['Minion', 'Standard', 'Elite', 'Boss']

export function ZoneMonstersEditor({ value, def, onChange }: EditorProps) {
  const zoneIds = useMemo(() => Object.keys(value).filter(z => /^Z\d+$/.test(z) && parseInt(z.slice(1), 10) > 24)
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10)), [value])
  const [zid, setZid] = useState(zoneIds[0] || 'Z25')
  const slots: any[] = value[zid] || []
  const set = (i: number, patch: any) => { const n = clone(value); n[zid][i] = { ...n[zid][i], ...patch }; onChange(n) }
  return <div style={card}>
    <Intro>Monster names and ranks for Z25–Z101. Stats come from the Monster Forge (rank decides minion vs boss scaling). Starter zones use Starter Monsters.</Intro>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
      <span style={label}>Zone</span>
      <select className="editor-input" value={zid} onChange={e => setZid(e.target.value)} style={{ padding: '6px 8px', fontSize: '16px', flex: '1 1 220px', minWidth: 0 }}>
        {zoneIds.map(z => <option key={z} value={z}>{z}: {(ZONES as any)[z]?.name}</option>)}
      </select>
    </div>
    {slots.map((m, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ width: '28px', color: C.muted, fontFamily: 'monospace', fontSize: '12px' }}>{i === 10 ? 'Boss' : i + 1}</span>
        {m
          ? <>
              <TextInput value={m.name} def={def[zid]?.[i]?.name} width={200} onChange={s => set(i, { name: s })} />
              <Select value={m.rank} def={def[zid]?.[i]?.rank} options={RANKS} onChange={s => set(i, { rank: s })} />
            </>
          : <span style={{ color: C.dim, fontSize: '12px' }}>empty slot</span>}
      </div>
    ))}
  </div>
}

export function ItemsEditor({ value, def, onChange }: EditorProps) {
  const [q, setQ] = useState('')
  const rows = value.map((r: any, i: number) => ({ ...r, _i: i })).filter((r: any) => !q || `${r.name} ${r.type} ${r.subType}`.toLowerCase().includes(q.toLowerCase()))
  const cols: Column[] = [
    { key: 'type', label: 'Type', kind: 'readonly' }, { key: 'subType', label: 'Slot', kind: 'readonly' },
    { key: 'name', label: 'Name', kind: 'text', width: 170 }, { key: 'sockets', label: 'Sockets (0–6)', kind: 'num', width: 60 },
  ]
  return <div style={card}>
    <Intro>Every base item the shops sell and monsters drop. Rename them or change their gem sockets (applies to every copy players own; lowering it never deletes gems already socketed). Price and power per tier are in Gear Tiers.</Intro>
    <Search value={q} onChange={setQ} placeholder="Search items (name, type, slot)…" />
    <Table rows={rows} defaults={def} columns={cols} rowKey={r => r.id}
      onEdit={(i, k, v) => { const n = clone(value); n[rows[i]._i][k] = k === 'sockets' ? Math.round(v) : v; onChange(n) }} />
  </div>
}
