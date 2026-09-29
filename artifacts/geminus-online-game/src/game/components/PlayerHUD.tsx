// src/game/components/PlayerHUD.tsx
// Player name, level, race, archetype, stats, gold, bank, minimap, dpad, zone info, logout, menu
import { useRef, useEffect, useState } from 'react'
import DPad from './DPad'
import { type MapMode, type Stamp, drawLattice, loadAvatar, loadBuildingArt } from '../map/lattice'
import { romanToInt } from '../../systems/services'

const hudBtn = (color: string): React.CSSProperties => ({
  flexShrink: 0, fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
  background: `${color}22`, border: `1px solid ${color}88`, color, letterSpacing: '0.04em', textTransform: 'uppercase',
})

function fmt(n: number): string {
  if (!n || isNaN(n)) return '0'
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}

const WHITE: React.CSSProperties = { color: '#fff', fontWeight: 800 }
const PLAT: React.CSSProperties = { color: '#D4DAE3', fontWeight: 400 }
const PLAT_DIM = '#7C8591'
const ORANGE = '#FF9F0A'
const TYPE_LABELS: Record<string, string> = {
  starter: 'Starter (exp)', xp: 'Exp', gold: 'Gold farm', shadow: 'Shadow farm', gem: 'Gem farm', prestige: 'Prestige (exp)',
}
const TYPE_COLORS: Record<string, string> = {
  starter: '#3EE0FF', xp: '#30D158', gold: '#FFD60A',
  shadow: '#BF5AF2', gem: '#5AC8FA', prestige: '#FF9500',
}

interface PlayerHUDProps {
  player: any
  zone: any
  zoneId: string
  stamp: Stamp
  activeTile: { tile: string; service: any; x: number; y: number } | null
  menuOpen: boolean
  mapOverlay: boolean
  freeLevels: number
  races: Record<string, any>
  /** Same stamp either way: squares in text mode, hexes (over the zone painting) in graphic mode */
  mapMode: MapMode
  zoneBg: HTMLImageElement | null
  avatarGender: 'male' | 'female'
  onSetMapMode: (mode: MapMode) => void
  onMove: (dx: number, dy: number) => void
  onEnter: () => void
  onLogout: () => void
  onSetMenuOpen: (val: boolean) => void
  onSetActiveTab: (tab: string) => void
  onSetMapOverlay: (val: boolean) => void
  onTileEnter: () => void
  onEstate: () => void
}

export default function PlayerHUD({
  player, zone, zoneId, stamp, activeTile, menuOpen, mapOverlay,
  freeLevels, races, mapMode, zoneBg, avatarGender, onSetMapMode, onMove, onEnter, onLogout, onSetMenuOpen,
  onSetActiveTab, onSetMapOverlay, onTileEnter, onEstate,
}: PlayerHUDProps) {
  const miniMapRef = useRef<HTMLCanvasElement>(null)
  const zoneCanvasRef = useRef<HTMLCanvasElement>(null)

  // Building sprites arrive asynchronously; bump a counter to repaint
  const [artTick, setArtTick] = useState(0)
  useEffect(() => { if (mapMode === 'graphic') loadBuildingArt(() => setArtTick(t => t + 1)) }, [mapMode])

  // Your race's character walks the hexes in graphic mode
  const [avatar, setAvatar] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (mapMode !== 'graphic' || !player.race) { setAvatar(null); return }
    let live = true
    const img = loadAvatar(player.race, avatarGender, () => { if (live) setAvatar(img) })
    return () => { live = false }
  }, [mapMode, player.race, avatarGender])

  const px = player.pos?.x ?? stamp.spawn[0]
  const py = player.pos?.y ?? stamp.spawn[1]
  const graphic = mapMode === 'graphic'
  // Keep the building popup off the player's own cell (y grows north, so a high y is near the top)
  const popupOnTop = py < stamp.size / 2

  useEffect(() => {
    if (miniMapRef.current) drawLattice(miniMapRef.current, { stamp, mode: mapMode, px, py, big: false, bg: zoneBg, avatar })
  }, [stamp, mapMode, px, py, zoneBg, artTick, avatar])

  useEffect(() => {
    if (zoneCanvasRef.current && mapOverlay) drawLattice(zoneCanvasRef.current, { stamp, mode: mapMode, px, py, big: true, bg: zoneBg, avatar })
  }, [stamp, mapMode, px, py, zoneBg, artTick, avatar, mapOverlay])

  return (
    <>
      <header className="glass-panel" style={{ flexShrink: 0, position: 'relative', zIndex: 30, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '8px' }}>

          {/* Left -- Player Info */}
          <section style={{ flex: 1, minWidth: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <p style={{ margin: 0, fontSize: '12px' }}><span style={WHITE}>{player.name}:</span><span style={{ ...PLAT, fontSize: '11.5px', marginLeft: '5px' }}>Level {player.level?.toLocaleString()}</span></p>
              <p style={{ margin: 0, fontSize: '12px' }}><span style={WHITE}>Race:</span><span style={{ ...PLAT, fontSize: '11.5px', marginLeft: '5px' }}>{player.raceName || player.race}</span></p>
              <p style={{ margin: 0, fontSize: '12px' }}><span style={WHITE}>A-Spec:</span><span style={{ ...PLAT, fontSize: '11.5px', marginLeft: '5px' }}>{player.archetype} • {races[player.race]?.primaryStat || player.cci}</span></p>

              {/* Stats Grid */}
              <div style={{ paddingTop: '4px', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
                {(['DEX', 'STR', 'WIS', 'NTL', 'VIT'] as const).map(stat => (
                  <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <span style={WHITE}>{stat.charAt(0) + stat.slice(1).toLowerCase()}:</span>
                    <span style={{ ...PLAT, fontSize: '11.5px' }}>{fmt(player.baseStats[stat])}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ ...WHITE, marginRight: '4px' }}>Lvls:</span>
                  <span style={{ ...PLAT, fontSize: '11.5px' }}>{freeLevels} ({player.attributePoints || 0} AP)</span>
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
              <div style={{ paddingTop: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', lineHeight: 1.35 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ minWidth: 0 }}><span style={WHITE}>{zoneId}:</span> <span style={{ color: ORANGE, fontWeight: 400 }}>{zone.name}</span></span>
                  <span style={{ color: ORANGE, fontWeight: 400, flexShrink: 0 }}>{px}, {py}</span>
                </div>
                <span style={WHITE}>Zone req:</span>
                <span style={PLAT}>Tier {romanToInt(zone.gear)}&nbsp;&nbsp;&nbsp;Lv {zone.level?.toLocaleString()}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span><span style={WHITE}>Type:</span> <span style={PLAT}>{TYPE_LABELS[zone.type] || zone.type}</span></span>
                  <button onClick={onEstate} style={hudBtn('#FFD60A')}>Estate</button>
                </div>
                <span style={{ ...WHITE, marginTop: '2px' }}>Drops:</span>
                <span><span style={WHITE}>Gem:</span> <span style={PLAT}>G{zone.gemMin}{zone.gemMin !== zone.gemMax ? `–${zone.gemMax}` : ''} • {zone.gemRate}</span></span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span><span style={WHITE}>Shadow:</span> <span style={{ color: zone.shadow === 'off' ? PLAT_DIM : '#D4DAE3' }}>{zone.shadow === 'off' ? 'Off' : zone.shadow}</span></span>
                  <button onClick={onLogout} style={hudBtn('#FF453A')}>Logout</button>
                </div>
              </div>
            </div>
          </section>

          {/* Right -- Minimap + DPad */}
          <section style={{ width: '162px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: '6px', paddingRight: '4px' }}>
            <div onClick={() => onSetMapOverlay(true)} style={{ cursor: 'pointer', width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: '10px', border: '1.5px dashed rgba(62,224,255,0.5)', boxShadow: '0 0 12px rgba(62,224,255,0.2)', flexShrink: 0 }}>
              <canvas ref={miniMapRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              {activeTile && (
                <button onClick={e => { e.stopPropagation(); onTileEnter() }}
                  style={{ position: 'absolute', left: '6px', right: '6px', ...(popupOnTop ? { top: '6px' } : { bottom: '6px' }), padding: '5px 6px', borderRadius: '8px', cursor: 'pointer',
                    background: 'rgba(3,8,12,0.88)', border: `1px solid ${activeTile.service.color}aa`, boxShadow: `0 0 12px ${activeTile.service.color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: activeTile.service.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTile.service.label}</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#fff', letterSpacing: '0.04em', padding: '1px 5px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.35)' }}>ENTER</span>
                </button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <DPad onMove={onMove} onEnter={onEnter} />
            </div>
            {/* Map style, right under the D-pad */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', padding: '3px', borderRadius: '10px', background: 'rgba(0,8,14,0.6)', border: '1px solid rgba(62,224,255,0.2)' }}>
              {(['text', 'graphic'] as const).map(m => (
                <button key={m} onClick={() => onSetMapMode(m)} className={`footer-tab-button${mapMode === m ? ' active' : ''}`}
                  style={{ flex: 1, padding: '7px 0', fontSize: '11px', fontWeight: 800 }}>{m === 'text' ? 'Text' : 'Graphics'}</button>
              ))}
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
            <p style={{ fontSize: '11px', margin: '4px 0 0', minHeight: '15px', color: activeTile ? activeTile.service.color : '#475569', fontWeight: 700 }}>
              {activeTile ? `📍 ${activeTile.service.label} · press Enter` : graphic ? 'Walk onto a building to enter it' : ''}
            </p>
          </div>
          <div style={{ width: '100%', maxWidth: '420px', maxHeight: '420px', aspectRatio: '1/1', position: 'relative' }}>
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
