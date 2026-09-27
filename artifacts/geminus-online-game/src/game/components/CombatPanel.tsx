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
  hp, maxHp, xp, xpToNextLevel, level,
  lastItem, lastItemColor, lastGem, lastGemColor,
  inventoryCount, gemCount,
}: CombatPanelProps) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const xpPct = Math.max(0, Math.min(100, (xp / xpToNextLevel) * 100))

  return (
    <section className="glass-panel" style={{ flexShrink: 0, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* HP Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#fff', fontWeight: 700 }}>Health:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#30D158' }}>{fmt(hp)} / {fmt(maxHp)}</span>
        </div>
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.8)', borderRadius: '9999px', height: '7px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', borderRadius: '9999px', width: `${hpPct}%`, background: '#30D158', boxShadow: '0 0 10px rgba(48,209,88,0.6)', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#fff', fontWeight: 700 }}>Experience: <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 400 }}>{fmt(xp)}</span></span>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Next Level: <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{fmt(xpToNextLevel)}</span></span>
        </div>
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.8)', borderRadius: '9999px', height: '7px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', borderRadius: '9999px', width: `${xpPct}%`, background: 'linear-gradient(90deg, #FF6B00, #FF9500)', boxShadow: '0 0 10px rgba(255,149,0,0.6)', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Last Drops */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>
            Last Item: <span style={{ color: lastItemColor, fontWeight: 700 }}>{lastItem}</span>{' '}
            <span style={{ color: '#30D158', fontFamily: 'monospace', fontSize: '11px' }}>{inventoryCount}/200</span>
          </span>
          <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '12px' }}>Level: <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'monospace' }}>{level}</span></span>
        </div>
        <div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>
            Last Gem: <span style={{ color: lastGemColor, fontWeight: 700 }}>{lastGem}</span>{' '}
            <span style={{ color: '#30D158', fontFamily: 'monospace', fontSize: '11px' }}>{gemCount}/200</span>
          </span>
        </div>
      </div>
    </section>
  )
}
