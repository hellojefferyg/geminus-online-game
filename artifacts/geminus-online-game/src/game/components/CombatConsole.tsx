// src/game/components/CombatConsole.tsx
// Monster select, BATTLE button, Cast/Spellstrike/Fight, combat log, level up buttons

interface CombatLogLine {
  text: string
  color: string
}

interface CombatConsoleProps {
  targets: any[]
  selectedTargetId: string
  engaged: boolean
  combatMonster: any
  combatLog: CombatLogLine[]
  enemyCurrentHP: number | null
  canAllocate: boolean
  freeLevels: number
  raceKey: string
  onSelectTarget: (id: string) => void
  onToggleEngage: () => void
  onPerformTurn: (isMagic: boolean) => void
  onSpendPoint: (stat: string) => void
  getAttributeFocusOrder: (raceKey: string) => string[]
}

export default function CombatConsole({
  targets, selectedTargetId, engaged, combatMonster,
  combatLog, enemyCurrentHP, canAllocate, freeLevels,
  raceKey, onSelectTarget, onToggleEngage, onPerformTurn,
  onSpendPoint, getAttributeFocusOrder,
}: CombatConsoleProps) {
  return (
    <section className="glass-panel" style={{ flexShrink: 0, padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', zIndex: 20 }}>

      {/* Monster Select + Battle Button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '12px', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 600, color: '#fff' }}>Monsters</div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <select
            className="editor-input"
            value={selectedTargetId}
            onChange={e => { onSelectTarget(e.target.value); if (engaged) onToggleEngage() }}
            style={{ width: '100%', paddingTop: '6px', paddingBottom: '6px', paddingRight: '28px', fontSize: '12px', background: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.2)', appearance: 'none' }}>
            {targets.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div style={{ pointerEvents: 'none', position: 'absolute', top: 0, right: '8px', bottom: 0, display: 'flex', alignItems: 'center' }}>
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <button className={`combat-engage-btn${engaged ? ' active' : ''}`} onClick={onToggleEngage}>
          {engaged ? 'DISENGAGE' : 'BATTLE'}
        </button>
      </div>

      {/* Action Buttons */}
      {engaged && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.12)', height: '40px' }}>
          <button className="combat-tactile-btn combat-cast-slab" onClick={() => onPerformTurn(true)}>Cast</button>
          <button className="combat-tactile-btn" onClick={() => onPerformTurn(false)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, borderRadius: '0.65rem', border: '1.5px solid rgba(191,90,242,0.8)', background: 'linear-gradient(180deg, #7B2FBE 0%, #4A1280 100%)', color: '#f3e8ff', boxShadow: '0 0 16px rgba(191,90,242,0.5), inset 0 1px 1px rgba(255,255,255,0.2)', cursor: 'pointer', letterSpacing: '0.02em' }}>
            Spellstrike
          </button>
          <button className="combat-tactile-btn combat-fight-slab" onClick={() => onPerformTurn(false)}>Fight</button>
        </div>
      )}

      {/* Enemy HP */}
      {engaged && enemyCurrentHP !== null && (
        <div style={{ textAlign: 'center', paddingTop: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF375F' }}>
            Enemies Health: {enemyCurrentHP}/{combatMonster?.hp ?? 0}
          </span>
        </div>
      )}

      {/* Combat Log */}
      {combatLog.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2px', paddingTop: '2px' }}>
          {combatLog.map((line, i) => (
            <div key={i} style={{ fontSize: '11px', lineHeight: 1.4, fontWeight: i === combatLog.length - 1 ? 700 : 500, color: line.color }}>{line.text}</div>
          ))}
        </div>
      )}

      {/* Idle message */}
      {!engaged && combatLog.length === 0 && (
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#475569', paddingTop: '2px' }}>Select target &amp; press BATTLE to fight</div>
      )}

      {/* Level Up Buttons */}
      {canAllocate && (
        <div style={{ flexShrink: 0, paddingTop: '6px', borderTop: '1px solid rgba(255,149,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: '#FF9500', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>⬆ Level Up -- Choose Focus</span>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'center', gap: '2px' }}>
            {getAttributeFocusOrder(raceKey).map((stat, idx, arr) => (
              <span key={stat} style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => onSpendPoint(stat)}
                  style={{ background: 'rgba(255,149,0,0.15)', border: '1.5px solid rgba(255,149,0,0.7)', borderRadius: '8px', cursor: 'pointer', padding: '6px 8px', color: '#FF9500', fontSize: '11.5px', fontWeight: 800, fontFamily: 'monospace', WebkitTapHighlightColor: 'rgba(255,149,0,0.3)', touchAction: 'manipulation', minWidth: '44px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
                  {stat}({freeLevels})
                </button>
                {idx < arr.length - 1 && <span style={{ color: '#FF9500', fontSize: '10px', opacity: 0.4, marginLeft: '2px', marginRight: '2px' }}>|</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
