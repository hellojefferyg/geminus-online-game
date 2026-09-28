// src/admin/panels.tsx
// God Editor: Roles and published-version history.
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { fetchBalanceHistory, ROLE_LABELS, type Balance, type Role } from '../systems/balance'
import { C, card, label, btn, Search } from './fields'

const ROLE_ORDER: Role[] = ['dev', 'admin', 'arch', 'mod', 'player']
// Same colours as chat names (ChatConsole ROLE_STYLE)
const ROLE_COLORS: Record<Role, string> = { dev: '#FF2D2D', admin: '#B84DFF', arch: '#2E8BFF', mod: '#2BFF5F', player: C.muted }

export function RolesPanel({ myUid, notify }: { myUid: string; notify: (msg: string) => void }) {
  const [players, setPlayers] = useState<any[]>([])
  const [roles, setRoles] = useState<Record<string, Role>>({})
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    const [{ data: ps, error: e1 }, { data: rs, error: e2 }] = await Promise.all([
      supabase.from('players').select('uid, name, race_name, level, email').order('level', { ascending: false }).limit(500),
      supabase.from('user_roles').select('uid, role'),
    ])
    if (e1 || e2) { notify(`Could not load players: ${(e1 || e2)?.message}`); return }
    setPlayers(ps || [])
    setRoles(Object.fromEntries((rs || []).map((r: any) => [r.uid, r.role])))
  }
  useEffect(() => { load() }, [])

  const setRole = async (uid: string, role: Role) => {
    setBusy(uid)
    const { error } = await supabase.rpc('set_user_role', { target_uid: uid, new_role: role })
    setBusy(null)
    if (error) { notify(error.message); return }
    notify(`Role updated to ${ROLE_LABELS[role]}.`)
    load()
  }

  const shown = players.filter(p => !q || `${p.name} ${p.email} ${p.race_name}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => ROLE_ORDER.indexOf(roles[a.uid] || 'player') - ROLE_ORDER.indexOf(roles[b.uid] || 'player'))

  return <div style={card}>
    <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 10px' }}>
      Dev = full access (God Editor, dev tools, roles). Admin, Arch and Mod get a coloured name and tag in chat. Only devs can change roles; the last dev can't remove themselves.
    </p>
    <Search value={q} onChange={setQ} placeholder="Search players by name or email…" />
    {shown.map(p => {
      const r: Role = roles[p.uid] || 'player'
      return (
        <div key={p.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', color: C.text, fontWeight: 700 }}>
              {p.name || 'Pilot'} <span style={{ color: ROLE_COLORS[r], fontSize: '11px' }}>({ROLE_LABELS[r]})</span>{p.uid === myUid ? <span style={{ color: C.dim, fontSize: '10px' }}> · you</span> : null}
            </div>
            <div style={{ fontSize: '10px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email || '—'} · {p.race_name} · Lv {p.level}</div>
          </div>
          <select className="editor-input" disabled={busy === p.uid} value={r} onChange={e => setRole(p.uid, e.target.value as Role)} style={{ padding: '4px 6px', fontSize: '12px', color: ROLE_COLORS[r] }}>
            {ROLE_ORDER.map(x => <option key={x} value={x}>{ROLE_LABELS[x]}</option>)}
          </select>
        </div>
      )
    })}
  </div>
}

export function HistoryPanel({ names, onLoad }: { names: Record<string, string>; onLoad: (data: Balance, version: number) => void }) {
  const [rows, setRows] = useState<any[] | null>(null)
  useEffect(() => { fetchBalanceHistory(25).then(setRows) }, [])
  return <div style={card}>
    <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 10px' }}>
      Every publish is kept. “Load” puts that version into the editor; press Publish to make it live again.
    </p>
    {rows === null && <div style={{ color: C.muted, fontSize: '12px' }}>Loading…</div>}
    {rows?.length === 0 && <div style={{ color: C.muted, fontSize: '12px' }}>Nothing published yet: the game is running on the code defaults.</div>}
    {rows?.map(r => (
      <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div style={{ fontSize: '13px', color: C.text, fontWeight: 700 }}>Version {r.version}</div>
          <div style={{ fontSize: '10px', color: C.muted }}>
            {new Date(r.updated_at).toLocaleString()} · {names[r.updated_by] || 'unknown'} · {Object.keys(r.data || {}).length} section(s) changed
          </div>
        </div>
        <button style={btn(C.cyan)} onClick={() => onLoad(r.data || {}, r.version)}>Load</button>
      </div>
    ))}
  </div>
}

export function SectionHeader({ title, changedFromPublished, overridden, onReset }: { title: string; changedFromPublished: boolean; overridden: boolean; onReset: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 800 }}>{title}</h2>
        {changedFromPublished && <span style={{ ...label, color: C.changed }}>unpublished edits</span>}
        {!changedFromPublished && overridden && <span style={{ ...label, color: C.cyan }}>live override</span>}
      </div>
      <button style={btn(C.muted, !overridden)} onClick={onReset} title="Drop this section's override so the game uses the code default">Reset to code default</button>
    </div>
  )
}
