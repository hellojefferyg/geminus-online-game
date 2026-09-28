// src/admin/fields.tsx
// Small building blocks for the God Editor: number inputs and editable tables.
import { useEffect, useState } from 'react'

export const C = {
  cyan: '#3EE0FF', gold: '#FFD60A', green: '#30D158', red: '#FF375F', purple: '#BF5AF2',
  text: '#e4e4e7', muted: '#94a3b8', dim: '#52525b', changed: '#FF9F0A',
}

export const card: React.CSSProperties = { padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }
export const label: React.CSSProperties = { fontSize: '10px', color: '#fff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }
export const btn = (color: string, disabled = false): React.CSSProperties => ({
  fontSize: '11px', fontWeight: 800, padding: '6px 12px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? 'rgba(255,255,255,0.04)' : `${color}1f`, border: `1px solid ${disabled ? 'rgba(255,255,255,0.12)' : color + '88'}`,
  color: disabled ? C.dim : color, whiteSpace: 'nowrap',
})

/** Number input that lets you type freely and only commits valid numbers. */
export function NumInput({ value, onChange, def, width = 84 }: { value: number; onChange: (n: number) => void; def?: number; width?: number }) {
  const [text, setText] = useState(String(value ?? ''))
  useEffect(() => { if (Number(text) !== value) setText(String(value ?? '')) }, [value])
  const changed = def !== undefined && value !== def
  return (
    <input className="editor-input" inputMode="decimal" value={text}
      title={def !== undefined ? `Code default: ${def}` : undefined}
      onChange={e => { setText(e.target.value); const n = Number(e.target.value); if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(n) }}
      onBlur={() => setText(String(value ?? ''))}
      style={{ width, padding: '4px 6px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', borderColor: changed ? C.changed : undefined, color: changed ? C.changed : undefined }} />
  )
}

export function TextInput({ value, onChange, def, width = 140 }: { value: string; onChange: (s: string) => void; def?: string; width?: number }) {
  const changed = def !== undefined && value !== def
  return <input className="editor-input" value={value ?? ''} onChange={e => onChange(e.target.value)} title={def !== undefined ? `Code default: ${def}` : undefined}
    style={{ width, padding: '4px 6px', fontSize: '12px', borderColor: changed ? C.changed : undefined, color: changed ? C.changed : undefined }} />
}

export function Select({ value, options, onChange, def }: { value: string; options: string[]; onChange: (s: string) => void; def?: string }) {
  const changed = def !== undefined && value !== def
  return (
    <select className="editor-input" value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '4px 6px', fontSize: '12px', borderColor: changed ? C.changed : undefined, color: changed ? C.changed : undefined }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export interface Column {
  key: string
  label: string
  kind: 'num' | 'text' | 'select' | 'readonly'
  options?: string[]
  width?: number
}

/** Editable table for a list of rows (or a map turned into rows with a `_key` column). */
export function Table({ rows, defaults, columns, onEdit, rowKey }: {
  rows: any[]; defaults?: any[]; columns: Column[]; rowKey: (r: any, i: number) => string
  onEdit: (index: number, key: string, value: any) => void
}) {
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '100%' }}>
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ ...label, textAlign: 'left', padding: '6px 6px', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#050b10' }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const d = defaults?.find((x, j) => rowKey(x, j) === rowKey(r, i))
            return (
              <tr key={rowKey(r, i)} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {columns.map(c => (
                  <td key={c.key} style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>
                    {c.kind === 'readonly' && <span style={{ color: C.text, fontFamily: 'monospace' }}>{String(r[c.key] ?? '')}</span>}
                    {c.kind === 'num' && <NumInput value={r[c.key]} def={d?.[c.key]} width={c.width} onChange={v => onEdit(i, c.key, v)} />}
                    {c.kind === 'text' && <TextInput value={r[c.key]} def={d?.[c.key]} width={c.width} onChange={v => onEdit(i, c.key, v)} />}
                    {c.kind === 'select' && <Select value={String(r[c.key])} def={d ? String(d[c.key]) : undefined} options={c.options || []} onChange={v => onEdit(i, c.key, v)} />}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Labelled number fields for an object of numbers (GDD constants, forge settings). */
export function NumberGrid({ value, defaults, help, onEdit }: {
  value: Record<string, number>; defaults: Record<string, number>; help?: Record<string, string>
  onEdit: (key: string, v: number) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
      {Object.keys(defaults).map(k => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: C.text, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k}</div>
            {help?.[k] && <div style={{ fontSize: '10px', color: C.muted }}>{help[k]}</div>}
          </div>
          <NumInput value={value[k]} def={defaults[k]} onChange={v => onEdit(k, v)} />
        </div>
      ))}
    </div>
  )
}

export function Search({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (s: string) => void; placeholder?: string }) {
  return <input className="editor-input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '12px', marginBottom: '8px' }} />
}
