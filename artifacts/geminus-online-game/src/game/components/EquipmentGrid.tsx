import type { GemInstance } from '../../game/types'
import { ItemIcon } from './ItemIcon'

interface EquipmentGridProps {
  slots: { name: string }[]
  equipment: Record<string, string | null>
  getItemName: (instanceId: string) => string
  getItemSubType: (instanceId: string) => string
  getItemTier: (instanceId: string) => number
  getItemGems: (instanceId: string) => GemInstance[]
  getGemName: (gemId: string) => string
  getGemCategory: (gemId: string) => 'fighter' | 'caster' | 'misc'
  onUnequip: (instanceId: string) => void
}

export function EquipmentGrid({ slots, equipment, getItemName, getItemSubType, getItemTier, getItemGems, getGemCategory, onUnequip }: EquipmentGridProps) {
  return (
    <div className="glass-panel p-3">
      <div className="equipment-grid">
        {slots.map((slot) => {
          const instanceId = equipment[slot.name]
          const gems = instanceId ? getItemGems(instanceId) : []
          return (
            <div key={slot.name} className="equipment-slot-wrapper">
              <div className="equipment-slot-title flex justify-between items-center text-xs text-neutral-400">
                <span>{slot.name}</span>
                {instanceId && <button type="button" onClick={() => onUnequip(instanceId)} className="text-[10px] text-red-400 hover:text-red-300">Unequip</button>}
              </div>
              <div className="equipment-slot-content flex items-center gap-2 p-2">
                {instanceId ? (
                  <>
                    <div className="inventory-slot relative flex-shrink-0">
                      <div className="gem-overlays-container">{gems.map((g,i) => <span key={i} className={`gem-overlay ${getGemCategory(g.id)}`} />)}</div>
                      <div className="item-icon-wrapper"><ItemIcon subType={getItemSubType(instanceId)} /></div>
                      <span className="item-tier-label">T{getItemTier(instanceId)}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-cyan-200 truncate">{getItemName(instanceId)}</span>
                      <span className="text-[10px] text-neutral-400 uppercase">{getItemSubType(instanceId)}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center text-neutral-600 text-xs italic py-2">Empty</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
