// src/admin/GodEditor.tsx
// Geminus God Editor (/admin): edit live game balance without code. Devs only.
// Edits build a draft; Publish writes it to Supabase game_config and every player gets it on next load.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import {
  DEFAULTS, SECTION_IDS, fetchMyRole, fetchPublishedBalance, publishBalance, validateSection,
  readDraft, writeDraft, type Balance, type PublishedBalance, type SectionId, type Role,
} from '../systems/balance'
import { C, btn } from './fields'
import {
  GddEditor, TiersEditor, ZoneTypesEditor, KeyNumberEditor, StarterMonstersEditor, ForgeEditor,
  ZonesEditor, GemsEditor, EnchantmentsEditor,
} from './sections'
import { RolesPanel, HistoryPanel, SectionHeader } from './panels'

type PageId = SectionId | 'roles' | 'history' | 'backup'

const NAV: { group: string; items: { id: PageId; label: string }[] }[] = [
  { group: 'Core', items: [
    { id: 'gdd', label: 'Constants' }, { id: 'dropperTiers', label: 'Gear Tiers' }, { id: 'zoneTypes', label: 'Zone Types' },
    { id: 'shadowLadder', label: 'Shadow Ladder' }, { id: 'pureGemFarms', label: 'Gem Farms' },
  ] },
  { group: 'World', items: [
    { id: 'zones', label: 'Zones' }, { id: 'starterMonsters', label: 'Starter Monsters' }, { id: 'forge', label: 'Monster Forge' },
  ] },
  { group: 'Items', items: [{ id: 'gems', label: 'Gems' }, { id: 'enchantments', label: 'Enchantments' }] },
  { group: 'Admin', items: [{ id: 'roles', label: 'Roles' }, { id: 'history', label: 'History' }, { id: 'backup', label: 'Backup' }] },
]
const TITLES: Record<string, string> = Object.fromEntries(NAV.flatMap(g => g.items.map(i => [i.id, i.label])))
const same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b)

export default function GodEditor({ uid }: { uid: string }) {
  const [role, setRole] = useState<Role | null>(null)
  const [published, setPublished] = useState<PublishedBalance | null>(null)
  const [draft, setDraft] = useState<Balance>({})
  const [page, setPage] = useState<PageId>('gdd')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [names, setNames] = useState<Record<string, string>>({})
  const [previewing, setPreviewing] = useState(() => !!readDraft())
  const [wide, setWide] = useState(() => window.innerWidth >= 860)

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 860)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    (async () => {
      const r = await fetchMyRole()
      setRole(r)
      if (r !== 'dev') return
      const pub = await fetchPublishedBalance()
      setPublished(pub)
      setDraft(pub?.data ? JSON.parse(JSON.stringify(pub.data)) : {})
      const { data } = await supabase.from('players').select('uid, name').limit(1000)
      setNames(Object.fromEntries((data || []).map((p: any) => [p.uid, p.name || 'Pilot'])))
    })()
  }, [uid])

  const pubData = published?.data || {}
  const working = (id: SectionId) => draft[id] ?? DEFAULTS[id]
  const setSection = (id: SectionId, v: any) => setDraft(d => {
    const n = { ...d }
    if (same(v, DEFAULTS[id])) delete n[id]; else n[id] = v
    return n
  })
  const dirtyIds = useMemo(() => SECTION_IDS.filter(id => !same(draft[id], pubData[id])), [draft, published])
  const problems = useMemo(() => Object.fromEntries(SECTION_IDS.filter(id => draft[id] !== undefined)
    .map(id => [id, validateSection(id, draft[id])]).filter(([, e]) => e)), [draft])

  const publish = async () => {
    if (Object.keys(problems).length) { notify('Fix the highlighted problems first.'); return }
    if (!window.confirm(`Publish ${dirtyIds.length} changed section(s) to every player?`)) return
    setBusy(true)
    const res = await publishBalance(draft)
    setBusy(false)
    if (!res.ok) { notify(`Publish failed: ${res.error}`); return }
    const pub = await fetchPublishedBalance()
    setPublished(pub)
    notify(`Published version ${res.version}. Players get it on their next load.`)
  }

  const preview = () => {
    writeDraft(draft); setPreviewing(true)
    notify('Draft saved for preview on this device. Open the game to try it.')
  }
  const stopPreview = () => { writeDraft(null); setPreviewing(false); notify('Preview off: this device uses the published balance again.') }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `geminus-balance-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = (file: File) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result))
        const bad = Object.keys(data).filter(k => !SECTION_IDS.includes(k as SectionId) || validateSection(k as SectionId, data[k]))
        if (bad.length) { notify(`Not imported: problems in ${bad.join(', ')}`); return }
        setDraft(data); notify('Imported into the editor. Review, then Publish.')
      } catch (e: any) { notify(`Not a valid JSON file: ${e.message}`) }
    }
    r.readAsText(file)
  }

  // ── Gates ──
  const shell: React.CSSProperties = { minHeight: '100dvh', background: 'radial-gradient(circle at 50% 0%, #10283a 0%, #071521 40%, #03080c 100%)', color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }
  if (role === null) return <div style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Checking access…</div>
  if (role !== 'dev') return (
    <div style={{ ...shell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
      <h1 style={{ color: C.cyan, letterSpacing: '0.12em', margin: 0 }}>GOD EDITOR</h1>
      <p style={{ color: C.muted, margin: 0 }}>Devs only. Ask a dev to give your account the Dev role.</p>
      <a href="/" style={{ ...btn(C.cyan), textDecoration: 'none' }}>Back to the game</a>
    </div>
  )

  const sectionEditor = (id: SectionId) => {
    const props = { value: working(id), def: DEFAULTS[id], onChange: (v: any) => setSection(id, v) }
    switch (id) {
      case 'gdd': return <GddEditor {...props} />
      case 'dropperTiers': return <TiersEditor {...props} />
      case 'zoneTypes': return <ZoneTypesEditor {...props} />
      case 'shadowLadder': return <KeyNumberEditor {...props} intro="Shadow drop chance per kill for Shadow-type zones (0.005 = 1 in 200)." keyLabel="Z25" valueLabel="zone" />
      case 'pureGemFarms': return <KeyNumberEditor {...props} intro="Gem-type zones and the exact gem grade they drop." keyLabel="Z34" valueLabel="zone" />
      case 'zones': return <ZonesEditor {...props} zoneTypes={Object.keys(working('zoneTypes'))} />
      case 'starterMonsters': return <StarterMonstersEditor {...props} />
      case 'forge': return <ForgeEditor {...props} />
      case 'gems': return <GemsEditor {...props} />
      case 'enchantments': return <EnchantmentsEditor {...props} />
    }
  }

  const navButton = (id: PageId, text: string) => {
    const dirty = SECTION_IDS.includes(id as SectionId) && dirtyIds.includes(id as SectionId)
    const bad = (problems as any)[id]
    return (
      <button key={id} onClick={() => setPage(id)} className={wide ? undefined : `hud-nav-pill${page === id ? ' tab-active' : ''}`}
        style={wide
          ? { display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', marginBottom: '2px', background: page === id ? 'rgba(62,224,255,0.14)' : 'transparent', color: bad ? C.red : dirty ? C.changed : page === id ? C.cyan : C.text }
          : { fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap', color: bad ? C.red : dirty ? C.changed : undefined }}>
        {text}{dirty ? ' •' : ''}
      </button>
    )
  }

  return (
    <div style={shell} className="god-root">
      {/* Top bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', background: 'rgba(3,8,12,0.92)', borderBottom: '1px solid rgba(62,224,255,0.25)', backdropFilter: 'blur(8px)' }}>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: '0.14em', color: C.cyan, fontSize: '15px' }}>GEMINUS GOD EDITOR</div>
          <div style={{ fontSize: '10px', color: C.muted }}>
            Live: {published ? `version ${published.version} · ${new Date(published.updated_at).toLocaleString()}` : 'code defaults (nothing published)'}
            {dirtyIds.length > 0 && <span style={{ color: C.changed }}> · {dirtyIds.length} unpublished section(s)</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <a href="/" style={{ ...btn(C.muted), textDecoration: 'none' }}>← Game</a>
          {previewing
            ? <button style={btn(C.purple)} onClick={stopPreview}>Stop preview</button>
            : <button style={btn(C.purple)} onClick={preview} title="Try this draft in the game on this device only">Preview in game</button>}
          <button style={btn(C.muted, !dirtyIds.length)} disabled={!dirtyIds.length} onClick={() => { if (window.confirm('Throw away unpublished edits?')) setDraft(pubData ? JSON.parse(JSON.stringify(pubData)) : {}) }}>Discard</button>
          <button style={btn(C.green, !dirtyIds.length || busy)} disabled={!dirtyIds.length || busy} onClick={publish}>{busy ? 'Publishing…' : 'Publish'}</button>
        </div>
      </header>

      <div style={{ display: wide ? 'flex' : 'block', alignItems: 'flex-start' }}>
        {/* Navigation */}
        {wide ? (
          <nav style={{ width: '200px', flexShrink: 0, padding: '12px 10px', position: 'sticky', top: '64px' }}>
            {NAV.map(g => (
              <div key={g.group} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.14em', color: C.dim, textTransform: 'uppercase', margin: '0 0 4px 10px' }}>{g.group}</div>
                {g.items.map(i => navButton(i.id, i.label))}
              </div>
            ))}
          </nav>
        ) : (
          <nav style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 14px' }}>
            {NAV.flatMap(g => g.items).map(i => navButton(i.id, i.label))}
          </nav>
        )}

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0, padding: wide ? '14px 18px 60px 4px' : '0 14px 60px' }}>
          {SECTION_IDS.includes(page as SectionId) && (() => {
            const id = page as SectionId
            return <>
              <SectionHeader title={TITLES[id]} changedFromPublished={dirtyIds.includes(id)} overridden={draft[id] !== undefined}
                onReset={() => setSection(id, DEFAULTS[id])} />
              {(problems as any)[id] && <div style={{ color: C.red, fontSize: '12px', marginBottom: '8px' }}>⚠ {(problems as any)[id]}</div>}
              {sectionEditor(id)}
            </>
          })()}
          {page === 'roles' && <><SectionHeader title="Roles" changedFromPublished={false} overridden={false} onReset={() => {}} /><RolesPanel myUid={uid} notify={notify} /></>}
          {page === 'history' && <><SectionHeader title="History" changedFromPublished={false} overridden={false} onReset={() => {}} />
            <HistoryPanel names={names} onLoad={(d, v) => { setDraft(JSON.parse(JSON.stringify(d))); notify(`Version ${v} loaded into the editor. Publish to make it live.`) }} /></>}
          {page === 'backup' && <>
            <SectionHeader title="Backup" changedFromPublished={false} overridden={false} onReset={() => {}} />
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>Download the editor's current draft as JSON, or load one back in (then Publish).</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button style={btn(C.cyan)} onClick={exportJson}>Download JSON</button>
                <label style={{ ...btn(C.cyan), display: 'inline-block' }}>Load JSON…<input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} /></label>
              </div>
            </div>
          </>}
        </main>
      </div>

      {toast && <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: '24px', zIndex: 50, padding: '8px 18px', borderRadius: '9999px', background: 'black', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '12px', maxWidth: '90vw', textAlign: 'center' }}>{toast}</div>}
    </div>
  )
}
