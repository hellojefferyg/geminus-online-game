// src/game/components/CombatPanel.tsx
// HP bar, XP bar, last item drop, last gem drop
// Sits between PlayerHUD and CombatConsole

interface CombatPanelProps {
  hp: number
  maxHp: number
  xp: number
  xpToNextLevel: number
  level: number
  lastItem: string
  lastItemColor: string
  lastGem: string
  lastGemColor: string
  inventoryCount: number
  gemCount: number
}

function fmt(n: number): string {
  if (!n || isNaN(n)) return '0'
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}

export default function CombatPanel({
  hp, maxHp, xp, xpToNextLevel,
  lastItem, lastItemColor, lastGem, lastGemColor,
  inventoryCount, gemCount,
}: CombatPanelProps) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const xpPct = Math.max(0, Math.min(100, (xp / xpToNextLevel) * 100))

  const label: React.CSSProperties = { color: '#fff', fontWeight: 800 }
  const num: React.CSSProperties = { color: '#D4DAE3', fontWeight: 400, fontFamily: 'monospace' }
  const divider: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.1)' }
  const bar = (pct: number, fill: string, glow: string) => (
    <div style={{ width: '100%', background: 'rgba(0,0,0,0.8)', borderRadius: '9999px', height: '7px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ height: '100%', borderRadius: '9999px', width: `${pct}%`, background: fill, boxShadow: `0 0 10px ${glow}`, transition: 'width 0.3s' }} />
    </div>
  )
  const row: React.CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }

  return (
    <section className="glass-panel" style={{ flexShrink: 0, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ ...row, fontSize: '13px' }}>
            <span style={label}>Health:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#30D158' }}>{fmt(hp)} / {fmt(maxHp)}</span>
          </div>
          {bar(hpPct, '#30D158', 'rgba(48,209,88,0.6)')}
        </div>

        {/* Experience */}
        <div style={{ ...divider, paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={row}>
            <span><span style={label}>Experience:</span> <span style={num}>{fmt(xp)}</span></span>
            <span><span style={label}>Next Level:</span> <span style={num}>{fmt(xpToNextLevel)}</span></span>
          </div>
          {bar(xpPct, 'linear-gradient(90deg, #5AC8FA, #9BE7FF)', 'rgba(90,200,250,0.6)')}
        </div>

        {/* Last drops + bag space */}
        <div style={{ ...divider, paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={row}>
            <span style={{ minWidth: 0 }}><span style={label}>Last Gem:</span> <span style={{ color: lastGemColor, fontWeight: 700 }}>{lastGem}</span></span>
            <span style={{ flexShrink: 0 }}><span style={label}>Gem Pouch:</span> <span style={num}>{gemCount}/200</span></span>
          </div>
          <div style={row}>
            <span style={{ minWidth: 0 }}><span style={label}>Last Item:</span> <span style={{ color: lastItemColor, fontWeight: 700 }}>{lastItem}</span></span>
            <span style={{ flexShrink: 0 }}><span style={label}>Inventory:</span> <span style={num}>{inventoryCount}/200</span></span>
          </div>
        </div>
      </div>
    </section>
  )
}
