// src/game/components/PlayerHUD.tsx
// Player name, level, race, archetype, stats, gold, bank, minimap, dpad, zone info, logout, menu
import { useRef, useEffect } from 'react'
import DPad from './DPad'

function fmt(n: number): string {
  if (!n || isNaN(n)) return '0'
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}

const TILE_COLORS: Record<string, string> = {
  '.': '#0d1f2d', 'r': '#1a1a1a', 'E': '#2d3748', 'R': '#14532d', 'B': '#713f12',
  'S': '#0c4a6e', 'M': '#4a1d96', 'Q': '#7c2d12', 'T': '#7f1d1d', 'G': '#164e63',
  'F': '#431407', 'C': '#14532d', 'X': '#450a0a',
}
const TILE_TEXT: Record<string, string> = {
  '.': '', 'r': 'r', 'E': 'E', 'R': 'R', 'B': 'B', 'S': 'S',
  'M': 'M', 'Q': 'Q', 'T': 'T', 'G': 'G', 'F': 'F', 'C': 'C', 'X': 'X',
}
const TYPE_COLORS: Record<string, string> = {
  starter: '#3EE0FF', xp: '#30D158', gold: '#FFD60A',
  shadow: '#BF5AF2', gem: '#5AC8FA', prestige: '#FF9500',
}

interface PlayerHUDProps {
  player: any
  zone: any
  zoneId: string
  stamp: any
  activeTile: { tile: string; service: any; x: number; y: number } | null
  menuOpen: boolean
  mapOverlay: boolean
  freeLevels: number
  races: Record<string, any>
  onMove: (dx: number, dy: number) => void
  onEnter: () => void
  onLogout: () => void
  onSetMenuOpen: (val: boolean) => void
  onSetActiveTab: (tab: string) => void
  onSetMapOverlay: (val: boolean) => void
  onTileEnter: () => void
}

export default function PlayerHUD({
  player, zone, zoneId, stamp, activeTile, menuOpen, mapOverlay,
  freeLevels, races, onMove, onEnter, onLogout, onSetMenuOpen,
  onSetActiveTab, onSetMapOverlay, onTileEnter,
}: PlayerHUDProps) {
  const miniMapRef = useRef<HTMLCanvasElement>(null)
  const zoneCanvasRef = useRef<HTMLCanvasElement>(null)

  function drawZoneMap(canvas: HTMLCanvasElement, px: number, py: number, cellSize: number, showLabels: boolean) {
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const w = canvas.offsetWidth; const h = canvas.offsetHeight
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#03080c'; ctx.fillRect(0, 0, w, h)
    const size = stamp.size
    const ox = Math.floor(w / 2 - px * cellSize - cellSize / 2)
    const oy = Math.floor(h / 2 - py * cellSize - cellSize / 2)
    ctx.save(); ctx.translate(ox, oy)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tile = stamp.grid[row]?.[col] ?? '.'
        const cx = col * cellSize; const cy = row * cellSize
        const isPlayer = col === px && row === py
        ctx.fillStyle = TILE_COLORS[tile] || '#0d1f2d'
        ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
        if (isPlayer) { ctx.fillStyle = 'rgba(62,224,255,0.25)'; ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2) }
        ctx.strokeStyle = isPlayer ? 'rgba(62,224,255,0.9)' : 'rgba(255,255,255,0.08)'
        ctx.lineWidth = isPlayer ? 1.5 : 0.5
        ctx.strokeRect(cx + 0.5, cy + 0.5, cellSize - 1, cellSize - 1)
        if (showLabels && tile !== '.') {
          const svc = stamp._services?.[tile]
          ctx.fillStyle = svc ? svc.color : '#94a3b8'
          ctx.font = `bold ${Math.floor(cellSize * 0.35)}px monospace`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(TILE_TEXT[tile] || tile, cx + cellSize / 2, cy + cellSize / 2)
        }
        if (isPlayer) {
          ctx.fillStyle = '#3EE0FF'; ctx.beginPath()
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize * 0.18, 0, Math.PI * 2); ctx.fill()
        }
      }
    }
    ctx.restore()
  }

  useEffect(() => {
    if (!miniMapRef.current || !player) return
    drawZoneMap(miniMapRef.current, player.pos?.x ?? 0, player.pos?.y ?? 0, 18, false)
  }, [player])

  useEffect(() => {
    if (!zoneCanvasRef.current || !player || !mapOverlay) return
    drawZoneMap(zoneCanvasRef.current, player.pos?.x ?? 0, player.pos?.y ?? 0, 42, true)
  }, [player, mapOverlay])

  return (
    <>
      <header className="glass-panel" style={{ flexShrink: 0, position: 'relative', zIndex: 30, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '8px' }}>

          {/* Left -- Player Info */}
          <section style={{ flex: 1, minWidth: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>{player.name}:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace', marginLeft: '4px' }}>Level {player.level}</span></p>
              <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>Race:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', marginLeft: '4px' }}>{player.raceName || player.race}</span></p>
              <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>A-Spec:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', marginLeft: '4px' }}>{player.archetype} · {races[player.race]?.primaryStat || player.cci}</span></p>

              {/* Stats Grid */}
              <div style={{ paddingTop: '4px', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
                {(['DEX', 'STR', 'WIS', 'NTL', 'VIT'] as const).map(stat => (
                  <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{stat.charAt(0) + stat.slice(1).toLowerCase()}:</span>
                    <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace' }}>{fmt(player.baseStats[stat])}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#fff', fontWeight: 700, marginRight: '4px' }}>Lvls:</span>
                  <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace' }}>{freeLevels} ({player.attributePoints || 0} AP)</span>
                </div>
              </div>

              {/* Gold / Bank */}
              <div style={{ paddingTop: '4px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="info-cell" style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ color: '#FFD60A', fontWeight: 700, fontSize: '11px' }}>Gold:</span><span style={{ color: '#FFD60A', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{fmt(player.gold)}</span></div>
                <div className="info-cell" style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ color: '#FFD60A', fontWeight: 700, fontSize: '11px' }}>Bank:</span><span style={{ color: '#FFD60A', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{fmt(player.bank)}</span></div>
              </div>

              {/* Menu */}
              <div className="menu-container" style={{ paddingTop: '4px', position: 'relative' }}>
                <button className="battle-mode-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => onSetMenuOpen(!menuOpen)}>
                  <span style={{ fontSize: '13px' }}>≡</span> Menu
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: 'rgba(3,12,20,0.97)', border: '1px solid rgba(62,224,255,0.42)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.9)' }}>
                    {([['stats', 'Player Info'], ['training', 'Training Log'], ['settings', 'Settings'], ['equipment', 'Equipment'], ['inventory', 'Inventory']] as const).map(([tab, label]) => (
                      <button key={tab} onClick={() => { onSetActiveTab(tab); onSetMenuOpen(false) }}
                        style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#e8fbff', fontSize: '12px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(62,224,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {tab === 'stats' ? '👤' : tab === 'training' ? '📊' : tab === 'settings' ? '⚙️' : tab === 'equipment' ? '🛡️' : '🎒'} {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Zone Info */}
              <div style={{ paddingTop: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3 }}><span style={{ color: '#fff', fontWeight: 700 }}>{zoneId}:</span> <span style={{ color: '#cbd5e1' }}>{zone.name}</span></p>
                  <button onClick={onLogout} style={{ flexShrink: 0, fontSize: '9px', fontWeight: 800, padding: '3px 7px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', cursor: 'pointer', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Logout</button>
                </div>
                <p style={{ margin: 0, fontSize: '9.5px', color: '#94a3b8', fontFamily: 'monospace', lineHeight: 1.3 }}>[{player.pos?.x ?? 0}, {player.pos?.y ?? 0}] · Tier {zone.gear} · Lv {zone.level?.toLocaleString()}</p>
                <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3 }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Type: </span><span style={{ color: TYPE_COLORS[zone.type] || '#fff', fontWeight: 700, textTransform: 'capitalize' }}>{zone.type}</span>
                  <span style={{ color: '#64748b' }}> · </span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Gem: </span><span style={{ color: '#30D158' }}>G{zone.gemMin}{zone.gemMin !== zone.gemMax ? `–${zone.gemMax}` : ''} · {zone.gemRate}</span>
                </p>
                <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3 }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Shadow: </span>
                  <span style={{ color: zone.shadow === 'off' ? '#52525b' : '#BF5AF2', fontWeight: 700 }}>{zone.shadow === 'off' ? 'Off' : zone.shadow}</span>
                </p>
                {activeTile && (
                  <div style={{ marginTop: '4px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${activeTile.service.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: activeTile.service.color, fontWeight: 700 }}>📍 {activeTile.service.label}</span>
                    <button onClick={onTileEnter} style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: `${activeTile.service.color}20`, border: `1px solid ${activeTile.service.color}60`, color: activeTile.service.color, cursor: 'pointer' }}>Enter</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right -- Minimap + DPad */}
          <section style={{ width: '162px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: '6px', paddingRight: '4px' }}>
            <div onClick={() => onSetMapOverlay(true)} style={{ cursor: 'pointer', width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: '10px', border: '1.5px dashed rgba(62,224,255,0.5)', boxShadow: '0 0 12px rgba(62,224,255,0.2)', flexShrink: 0 }}>
              <canvas ref={miniMapRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <DPad onMove={onMove} onEnter={onEnter} />
            </div>
          </section>
        </div>
      </header>

      {/* Map Overlay */}
      {mapOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '18px', color: '#3EE0FF', margin: 0 }}>{zoneId}</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>{zone.name}</p>
          </div>
          <div style={{ width: '100%', maxWidth: '420px', maxHeight: '400px', aspectRatio: '1/1', position: 'relative' }}>
            <div className="glass-panel" style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.25)' }}>
              <canvas ref={zoneCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            </div>
          </div>
          <DPad onMove={onMove} onEnter={onEnter} style={{ marginBottom: '8px' }} />
          <button onClick={() => onSetMapOverlay(false)} style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '24px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
    </>
  )
}
