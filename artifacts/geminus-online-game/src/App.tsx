import { useState, useEffect, useRef } from 'react'

export default function App() {
  const [battleModeActive, setBattleModeActive] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const [inlinePanelOpen, setInlinePanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('equipment')
  const [theme, setTheme] = useState('aether')
  const [toast, setToast] = useState('')
  const smokeCanvasRef = useRef<HTMLCanvasElement>(null)

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  // Theme toggle
  useEffect(() => {
    if (theme === 'onyx') {
      document.documentElement.classList.add('theme-onyx')
    } else {
      document.documentElement.classList.remove('theme-onyx')
    }
  }, [theme])

  // Smoke particle system
  useEffect(() => {
    const canvas = smokeCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    class SmokeParticle {
      x: number; y: number; size: number; speedX: number; speedY: number
      rotation: number; rotSpeed: number; type: string; baseAlpha: number
      r: number; g: number; b: number

      constructor(initial = false) {
        this.x = initial ? Math.random() * canvas.width : (Math.random() > 0.5 ? -100 : canvas.width + 100)
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 240 + 80
        this.speedX = (Math.random() - 0.5) * 0.45
        this.speedY = (Math.random() - 0.5) * 0.35
        this.rotation = Math.random() * Math.PI * 2
        this.rotSpeed = (Math.random() - 0.5) * 0.004
        const roll = Math.random()
        if (roll < 0.35) { this.type = 'white'; this.baseAlpha = Math.random() * 0.05 + 0.02; this.r = 240; this.g = 245; this.b = 255 }
        else if (roll < 0.70) { this.type = 'black'; this.baseAlpha = Math.random() * 0.22 + 0.08; this.r = 0; this.g = 0; this.b = 0 }
        else { this.type = 'onyx'; this.baseAlpha = Math.random() * 0.18 + 0.06; this.r = 12; this.g = 12; this.b = 16 }
      }

      update() {
        this.x += this.speedX; this.y += this.speedY; this.rotation += this.rotSpeed
        if (this.x < -this.size * 1.5 || this.x > canvas.width + this.size * 1.5 || this.y < -this.size * 1.5 || this.y > canvas.height + this.size * 1.5) {
          Object.assign(this, new SmokeParticle())
        }
      }

      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size)
        if (this.type === 'black') {
          g.addColorStop(0, `rgba(0,0,0,${this.baseAlpha * 1.4})`)
          g.addColorStop(0.5, `rgba(0,0,0,${this.baseAlpha * 0.7})`)
          g.addColorStop(1, 'rgba(0,0,0,0)')
        } else if (this.type === 'white') {
          g.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.baseAlpha * 1.2})`)
          g.addColorStop(0.4, `rgba(200,210,225,${this.baseAlpha * 0.5})`)
          g.addColorStop(1, 'rgba(255,255,255,0)')
        } else {
          g.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.baseAlpha * 1.3})`)
          g.addColorStop(0.5, `rgba(5,5,8,${this.baseAlpha * 0.6})`)
          g.addColorStop(1, 'rgba(0,0,0,0)')
        }
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    const particles: SmokeParticle[] = []
    for (let i = 0; i < 35; i++) particles.push(new SmokeParticle(true))

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) { p.update(); p.draw() }
      animId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [])

  const openTab = (tab: string) => { setActiveTab(tab); setInlinePanelOpen(true) }
  const closePanel = () => setInlinePanelOpen(false)

  return (
    <>
      {/* Smoke canvas */}
      <canvas ref={smokeCanvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none', opacity: 0.9 }} />

      <div style={{ width: '100%', minHeight: '100dvh', maxWidth: '512px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', zIndex: 10, width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px', paddingBottom: '112px' }}>

            {/* HUD / Inline Panel */}
            <div style={{ flexShrink: 0, position: 'relative', zIndex: 30 }}>
              {!inlinePanelOpen ? (
                <header className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '8px' }}>

                    {/* Left: Player Stats */}
                    <section style={{ flex: 1, minWidth: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                          <p style={{ margin: 0 }}>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}>Jeff:</span>
                            <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace', marginLeft: '4px' }}>Level 1</span>
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>Experience:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace', marginLeft: '4px' }}>0</span></p>
                        <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>Next Level:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace', marginLeft: '4px' }}>200</span></p>
                        <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>Race:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', marginLeft: '4px' }}>Human</span></p>
                        <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>A-Spec:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', marginLeft: '4px' }}>True Fighter · DEX</span></p>

                        {/* Stats grid */}
                        <div style={{ paddingTop: '4px', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '12px' }}>
                          {[['Dex','20'],['Str','15'],['Wis','5'],['Ntl','5'],['Vit','10']].map(([stat, val]) => (
                            <div key={stat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#fff', fontWeight: 700 }}>{stat}:</span>
                                <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace' }}>{val}</span>
                              </div>
                              <button className="attr-btn glow-white">+</button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: '#fff', fontWeight: 700, marginRight: '4px' }}>Lvls:</span>
                            <span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace' }}>1 (40 AP)</span>
                          </div>
                        </div>

                        {/* HP Bar */}
                        <div style={{ paddingTop: '4px', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: '#fff', fontWeight: 700 }}>Health:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '10.5px', color: '#30D158' }}>200 / 200</span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '9999px', height: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ height: '100%', borderRadius: '9999px', width: '100%', background: '#30D158', boxShadow: '0 0 10px rgba(48,209,88,0.6)' }} />
                          </div>
                        </div>

                        {/* Battle Mode */}
                        <div style={{ paddingTop: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <button
                            className="battle-mode-btn"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: battleModeActive ? 'rgba(239,68,68,0.25)' : undefined, borderColor: battleModeActive ? 'rgba(248,113,113,0.8)' : undefined, color: battleModeActive ? '#fecaca' : undefined }}
                            onClick={() => { setBattleModeActive(!battleModeActive); showToast(battleModeActive ? 'Battle Mode deactivated.' : '⚔️ Battle Mode active.') }}
                          >
                            {battleModeActive ? 'Exit Battle Mode' : 'Battle Mode'}
                          </button>
                          <p style={{ fontSize: '9.5px', lineHeight: '1.3', textAlign: 'center', color: '#94a3b8', margin: 0 }}>
                            {battleModeActive ? 'Active: Navigation and tab controls hidden for streamlined battle.' : 'Streamlines HUD to stats, combat console, and transmissions for fast combat.'}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Right: Nav Deck */}
                    {!battleModeActive && (
                      <section style={{ width: '172px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '6px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '100%', textAlign: 'center', paddingTop: '2px' }}>
                          <p style={{ margin: 0, fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>Zone:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', marginLeft: '4px' }}>Aether Silver Cavern</span></p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px' }}><span style={{ color: '#fff', fontWeight: 700 }}>Cords:</span><span style={{ color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'monospace', marginLeft: '4px' }}>[7, 7]</span></p>
                        </div>

                        {/* Mini Map */}
                        <div style={{ cursor: 'pointer', margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '80px', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '1px dashed rgba(103,232,249,0.6)', animation: 'spin 20s linear infinite' }} />
                            <div className="glass-panel" style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(103,232,249,0.55)', boxShadow: '0 0 22px rgba(62,224,255,0.45)' }}>
                              <canvas style={{ width: '100%', height: '100%', display: 'block' }} />
                            </div>
                          </div>
                        </div>

                        {/* D-Pad */}
                        <div className="d-pad-controls" style={{ marginTop: '4px', marginBottom: '2px' }}>
                          <div className="game-key move-key" data-key="up"><svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'currentColor'}}><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg></div>
                          <div className="game-key move-key" data-key="left"><svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'currentColor'}}><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg></div>
                          <div className="game-key move-key key-enter-btn" data-key="enter">Enter</div>
                          <div className="game-key move-key" data-key="right"><svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'currentColor'}}><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg></div>
                          <div className="game-key move-key" data-key="down"><svg viewBox="0 0 24 24" style={{width:20,height:20,fill:'currentColor'}}><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></div>
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Gold/Bank */}
                  <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="info-cell" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#FFD60A', fontWeight: 700, fontSize: '11px' }}>Gold:</span>
                      <span style={{ color: '#FFD60A', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>1.2K</span>
                    </div>
                    <div className="info-cell" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#FFD60A', fontWeight: 700, fontSize: '11px' }}>Bank:</span>
                      <span style={{ color: '#FFD60A', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>10.0K</span>
                    </div>
                  </div>

                  {/* Nav Tabs */}
                  {!battleModeActive && (
                    <div style={{ paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['stats','training','settings'].map(t => (
                          <button key={t} className="hud-nav-pill" style={{ flex: 1, textAlign: 'center' }} onClick={() => openTab(t)}>
                            {t === 'stats' ? 'Player Info' : t === 'training' ? 'Training Log' : 'Settings'}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['equipment','inventory'].map(t => (
                          <button key={t} className="hud-nav-pill" style={{ flex: 1, textAlign: 'center' }} onClick={() => openTab(t)}>
                            {t === 'equipment' ? 'Equipment' : 'Inventory'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </header>
              ) : (
                /* Inline Panel */
                <div className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['stats','training','settings'].map(t => (
                          <button key={t} className={`hud-nav-pill${activeTab === t ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => setActiveTab(t)}>
                            {t === 'stats' ? 'Player Info' : t === 'training' ? 'Training Log' : 'Settings'}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['equipment','inventory'].map(t => (
                          <button key={t} className={`hud-nav-pill${activeTab === t ? ' tab-active' : ''}`} style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '2px 8px' }} onClick={() => setActiveTab(t)}>
                            {t === 'equipment' ? 'Equipment' : 'Inventory'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexShrink: 0 }}>
                      <button className="pin-btn">📌</button>
                      <button onClick={closePanel} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black', border: '1px solid rgba(255,255,255,0.2)', color: '#d4d4d8', fontSize: '18px', cursor: 'pointer' }}>×</button>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px' }}>
                    {/* Equipment */}
                    {activeTab === 'equipment' && (
                      <div className="equipment-grid">
                        {[
                          {slot:'Helmet',color:'#e4e4e7',glow:'rgba(255,255,255,0.4)',path:'M12 2a8 8 0 00-8 8v4a4 4 0 004 4h8a4 4 0 004-4v-4a8 8 0 00-8-8zM9 12h6M12 2v10M8 15h8'},
                          {slot:'Weapon 1',color:'#fb7185',glow:'rgba(255,55,95,0.6)',gem:'WAR',gemType:'fighter',path:'M14.5 4l5.5 5.5L7 22l-4-1 1-4L14.5 4zM18 7.5l-3.5-3.5M4 20l3.5-3.5'},
                          {slot:'Gloves',color:'#5eead4',glow:'rgba(45,212,191,0.6)',path:'M6 8h12v12H6a3 3 0 01-3-3v-6a3 3 0 013-3zM9 4v4M12 3v5M15 4v4'},
                          {slot:'Weapon 2',color:null,glow:null,empty:true},
                          {slot:'Armor',color:'#34d399',glow:'rgba(48,209,88,0.6)',gem:'OBS',gemType:'misc',path:'M12 3L4 7v6c0 5 4 8 8 9 4-1 8-4 8-9V7l-8-4zM12 3v19'},
                          {slot:'Spell 1',color:'#f87171',glow:'rgba(239,68,68,0.7)',gem:'LOR',gemType:'caster',path:'M12 2c1 3.5 4 5 4 8.5 0 3-2 5.5-4 7.5-2-2-4-4.5-4-7.5 0-3.5 3-5 4-8.5z'},
                          {slot:'Leggings',color:'#818cf8',glow:'rgba(129,140,248,0.6)',path:'M6 3h12v4l-2 13-3-1-1-9-1 9-3 1L6 7V3z'},
                          {slot:'Spell 2',color:'#7dd3fc',glow:'rgba(56,189,248,0.6)',path:'M4 8h13a3 3 0 10-3-3M3 12h14a3 3 0 11-3 3M6 16h8a2 2 0 10-2-2'},
                          {slot:'Boots',color:'#d4d4d8',glow:'rgba(255,255,255,0.4)',path:'M7 4h6v9l5 2v4H5v-4l2-2V4z'},
                          {slot:'Accessory',color:'#e4e4e7',glow:'rgba(255,255,255,0.4)',path:'M12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2M12 2v20'},
                          {slot:'Amulet',color:'#fcd34d',glow:'rgba(251,191,36,0.6)',path:'M6 3l6 9 6-9M12 16m-4 0a4 4 0 108 0 4 4 0 00-8 0M12 14v4M10 16h4'},
                          {slot:'Ring',color:'#fde047',glow:'rgba(253,224,71,0.6)',path:'M12 6a7 7 0 100 14 7 7 0 000-14zM12 3l2 3h-4l2-3z'},
                        ].map(({ slot, color, glow, gem, gemType, path, empty }: any) => (
                          <div key={slot} className="equipment-slot-wrapper">
                            <div className="equipment-slot-title"><span>{slot}</span></div>
                            <div className="equipment-slot-content">
                              {empty ? <span style={{ fontSize: '11px', color: '#71717a' }}>Empty</span> : (
                                <>
                                  {gem && (
                                    <div className="gem-overlays-container">
                                      <div className={`gem-overlay ${gemType}`}>{gem}</div>
                                    </div>
                                  )}
                                  <svg style={{ width: 28, height: 28, color, filter: `drop-shadow(0 0 8px ${glow})` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d={path} />
                                  </svg>
                                  <span className="item-tier-label">T1</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inventory */}
                    {activeTab === 'inventory' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Ledger</span>
                        </div>
                        <div className="stat-accordion-item open">
                          <button className="stat-accordion-header" onClick={e => e.currentTarget.parentElement?.classList.toggle('open')}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>📦 Weapon Chest <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>(2)</span></span>
                            <svg className="accordion-arrow" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </button>
                          <div className="stat-accordion-content">
                            <div className="inventory-grid">
                              {[{color:'#fbbf24',glow:'rgba(255,149,0,0.6)',path:'M14 12l6-6-4-4-6 6M4 20l10-10M9 7l4 4'},{color:'#38bdf8',glow:'rgba(10,132,255,0.6)',path:'M5 19L19 5M17 3l4 4M19 7l-2-2M12 12l2 2'}].map((item,i) => (
                                <div key={i} className="inventory-slot">
                                  <div className="item-icon-wrapper">
                                    <svg style={{ width: 28, height: 28, color: item.color, filter: `drop-shadow(0 0 8px ${item.glow})` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={item.path} /></svg>
                                  </div>
                                  <span className="item-tier-label">T1</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="stat-accordion-item open">
                          <button className="stat-accordion-header" onClick={e => e.currentTarget.parentElement?.classList.toggle('open')}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>💎 Gem Pouch <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>(7/200)</span></span>
                            <svg className="accordion-arrow" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </button>
                          <div className="stat-accordion-content">
                            <div className="gem-pouch-grid">
                              {[['🔴','War1'],['🔵','Lor1'],['🟢','Vit1'],['🟢','Obs1'],['🔴','Mig1'],['🟡','Spi1'],['🟡','Tre1']].map(([icon,label]) => (
                                <div key={label} className="gem-item"><span style={{ fontSize: '12px' }}>{icon}</span><span className="item-label">{label}</span></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Player Info */}
                    {activeTab === 'stats' && (
                      <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Combat Attributes</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                          {[['Armor Class (AC)','48.2'],['Weapon Class (WC)','14.4'],['Spell Class (SC)','14.4'],['Hit Probability','91.0%'],['Critical Chance','5.2%'],['Max Health','200']].map(([k,v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ color: '#9ca3af' }}>{k}</span>
                              <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
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
                          <div><span style={{ fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>Levels: </span><span style={{ background: 'black', padding: '1px 4px', borderRadius: '4px', border: '1px solid #262626', color: '#fff', fontWeight: 700 }}>1</span></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[['Kills','0'],['Rounds','0'],['Deaths','0'],['1 Hit Kill %','0%']].map(([k,v]) => (
                              <div key={k}><span style={{ fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>{k}: </span><span style={{ background: 'black', padding: '1px 4px', borderRadius: '4px', border: '1px solid #262626', color: '#fff', fontWeight: 700 }}>{v}</span></div>
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#d4d4d8' }}>Pilot Callsign</span>
                            <input className="editor-input" defaultValue="Jeff" style={{ width: '144px', padding: '4px 8px', fontSize: '12px' }} />
                          </div>
                        </div>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Display</span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <div style={{ color: '#e4e4e7' }}>Dark Mode</div>
                              <div style={{ fontSize: '10px', color: '#71717a' }}>Onyx black HUD — no cyan glass</div>
                            </div>
                            <button className="footer-tab-button" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => { const next = theme === 'onyx' ? 'aether' : 'onyx'; setTheme(next); showToast(next === 'onyx' ? 'Dark Mode on — Onyx HUD' : 'Aether glass restored') }}>
                              {theme === 'onyx' ? 'On' : 'Off'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Combat Console */}
            <section className="glass-panel" style={{ flexShrink: 0, padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', zIndex: 20, minHeight: '182px', height: '182px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9.5px', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 600, flexShrink: 0 }}>Last Item:</span>
                  <span style={{ color: '#8FA8C7', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>None</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '9px', marginLeft: '2px', flexShrink: 0, color: '#30D158' }}>13/200</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 600, flexShrink: 0 }}>Last Gem:</span>
                  <span style={{ color: '#8FA8C7', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>None</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '9px', marginLeft: '2px', flexShrink: 0, color: '#30D158' }}>7/200</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <select style={{ appearance: 'none', paddingLeft: '10px', paddingRight: '24px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '12px', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                    <option>Monsters</option>
                    <option>Players</option>
                  </select>
                  <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, right: '6px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <select className="editor-input" style={{ width: '100%', paddingTop: '6px', paddingBottom: '6px', paddingRight: '28px', fontSize: '12px', background: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.2)', appearance: 'none' }}>
                    <option>Glass Construct [HP 25]</option>
                    <option>Mercury Sprite [HP 32]</option>
                    <option>Mirror Gargoyle [HP 45]</option>
                  </select>
                  <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, right: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <button
                  className={`combat-engage-btn${engaged ? ' active' : ''}`}
                  onClick={() => { setEngaged(!engaged); }}
                >
                  {engaged ? 'DISENGAGE' : 'BATTLE'}
                </button>
              </div>

              {/* Cast/Fight row */}
              <div id="combat-action-row" className={engaged ? '' : 'standby'} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.12)', height: '40px', opacity: engaged ? 1 : 0, visibility: engaged ? 'visible' : 'hidden', transition: 'opacity 0.2s, visibility 0.2s' }}>
                <button className="combat-tactile-btn combat-cast-slab"><span>⚡</span><span>CAST</span></button>
                <button className="combat-tactile-btn combat-fight-slab"><span>⚔</span><span>FIGHT</span></button>
              </div>

              {/* Combat Log */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', height: '46px', minHeight: '46px', maxHeight: '46px', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', lineHeight: '1.3', fontWeight: 500, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}></div>
                <div style={{ fontSize: '10.5px', lineHeight: '1.3', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>Select target & press BATTLE to fight</div>
                <div style={{ fontSize: '10.5px', lineHeight: '1.3', fontWeight: 800, color: '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}></div>
              </div>
            </section>

            {/* Chat Console */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '240px' }}>
              <div className="glass-panel" style={{ width: '100%', padding: '10px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                    <button className="chat-expand-btn inbox-btn">💬</button>
                    {['Main','Sales','Clan','Groups'].map((ch, i) => (
                      <button key={ch} className={`footer-tab-button${i === 0 ? ' active' : ''}`} style={{ flex: 1 }}>{ch}</button>
                    ))}
                  </div>
                  <button className="chat-expand-btn" style={{ marginLeft: '4px' }}>
                    <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  </button>
                </div>

                <div className="sub-bar" style={{ flexShrink: 0, marginBottom: '8px' }}>
                  <button className="sub-btn active"><span>Main Chat</span></button>
                  <button className="sub-btn"><span>Name Color</span></button>
                </div>

                <div style={{ fontSize: '12px', flex: 1, overflowY: 'auto', minHeight: '140px', padding: '4px' }}>
                  <div style={{ margin: '4px 0' }}>
                    <span style={{ color: '#3EE0FF', fontWeight: 800 }}>System:</span>{' '}
                    <span style={{ color: '#fff' }}>Welcome to Geminus client core. Transmission systems operational.</span>
                  </div>
                </div>

                <form style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)' }} onSubmit={e => e.preventDefault()}>
                  <button type="button" className="icon-btn">😀</button>
                  <input type="text" className="editor-input" placeholder="Type To Chat…" style={{ flex: 1, padding: '8px', fontSize: '12px' }} />
                  <button type="button" className="footer-tab-button" style={{ padding: '8px 16px', fontWeight: 600 }}>Send</button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="glass-panel" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: '72px', zIndex: 210, padding: '8px 20px', borderRadius: '9999px', fontWeight: 500, fontSize: '12px', background: 'black', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </>
  )
}
