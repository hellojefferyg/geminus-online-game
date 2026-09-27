import type { Monster } from '../../game/types'

interface CombatConsoleProps {
  monsters: Monster[]
  selectedTargetId: string
  onTargetChange: (id: string) => void
  engaged: boolean
  onEngage: () => void
  onCast: () => void
  onFight: () => void
  onSpellstrike: () => void
  combatLog: { text: string; color: string }[]
  enemyCurrentHP: number | null
  enemyMaxHP: number | null
  canAllocate: boolean
  freeLevels: number
  attributePoints: number
  focusOrder: string[]
  onSpendPoint: (stat: string) => void
  archetype: string
}

export function CombatConsole({ monsters, selectedTargetId, onTargetChange, engaged, onEngage, onCast, onFight, onSpellstrike, combatLog, enemyCurrentHP, enemyMaxHP, canAllocate, freeLevels, attributePoints, focusOrder, onSpendPoint, archetype }: CombatConsoleProps) {
  return (
    <div className="glass-panel p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="combat-target-select" className="text-xs uppercase font-bold tracking-wider text-cyan-400">Target</label>
        <select id="combat-target-select" className="editor-input flex-1 py-1 px-2 text-sm" value={selectedTargetId} onChange={(e) => onTargetChange(e.target.value)} disabled={engaged}>
          {monsters.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button type="button" onClick={onEngage} className={`combat-engage-btn ${engaged ? 'active' : ''}`}>{engaged ? 'DISENGAGE' : 'BATTLE'}</button>
      </div>
      {engaged && (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={onCast} className="combat-tactile-btn combat-cast-slab">Cast</button>
          <button type="button" onClick={onSpellstrike} className="combat-tactile-btn combat-cast-slab">Spellstrike</button>
          <button type="button" onClick={onFight} className="combat-tactile-btn combat-fight-slab">Fight</button>
        </div>
      )}
      {engaged && enemyCurrentHP !== null && enemyMaxHP !== null && (
        <div className="info-cell p-2 flex flex-col gap-1">
          <div className="flex justify-between text-xs text-neutral-300"><span>Enemy Vitality</span><span>{enemyCurrentHP} / {enemyMaxHP}</span></div>
          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-700">
            <div className="bg-red-600 h-full transition-all duration-200" style={{ width: `${Math.max(0, Math.min(100, (enemyCurrentHP / enemyMaxHP) * 100))}%` }} />
          </div>
        </div>
      )}
      <div className="info-cell p-2 h-36 overflow-y-auto flex flex-col gap-1 text-xs font-mono">
        {combatLog.length === 0 && !engaged && <div className="text-neutral-500 italic text-center my-auto">Select target & press BATTLE</div>}
        {combatLog.map((log, i) => <div key={i} style={{ color: log.color }}>{log.text}</div>)}
      </div>
      {canAllocate && (
        <div className="border border-orange-500/40 bg-orange-950/20 rounded p-2 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-orange-400 font-bold uppercase tracking-wider">
            <span>Level Up Available ({archetype})</span>
            <span>Free Lv: {freeLevels} | Points: {attributePoints}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {focusOrder.map((stat) => <button key={stat} type="button" onClick={() => onSpendPoint(stat)} className="battle-mode-btn border-orange-500 text-orange-300 px-2 py-1 text-xs">+ {stat}</button>)}
          </div>
        </div>
      )}
    </div>
  )
}
