import type { GemInstance } from '../../game/types'
import { ItemIcon } from './ItemIcon'

interface ItemModalProps {
  instanceId: string | null
  onClose: () => void
  getItemName: (id: string) => string
  getItemSubType: (id: string) => string
  getItemTier: (id: string) => number
  getItemStatLabel: (id: string) => string
  getItemStatValue: (id: string) => string
  getItemGems: (id: string) => GemInstance[]
  getGemName: (gemId: string) => string
  getGemEffect: (gemId: string) => string
  getGemCategory: (gemId: string) => 'fighter' | 'caster' | 'misc'
  isEquipped: boolean
  onEquip: (id: string) => void
}

export function ItemModal({ instanceId, onClose, getItemName, getItemSubType, getItemTier, getItemStatLabel, getItemStatValue, getItemGems, getGemName, getGemEffect, getGemCategory, isEquipped, onEquip }: ItemModalProps) {
  if (!instanceId) return null
  const gems = getItemGems(instanceId)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="glass-panel w-full max-w-sm p-4 flex flex-col gap-4 relative">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-neutral-400 hover:text-white text-base">✕</button>
        <div className="flex items-center gap-3">
          <div className="inventory-slot">
            <div className="item-icon-wrapper"><ItemIcon subType={getItemSubType(instanceId)} /></div>
            <span className="item-tier-label">T{getItemTier(instanceId)}</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-cyan-300">{getItemName(instanceId)}</h3>
            <span className="text-xs text-neutral-400 uppercase">{getItemSubType(instanceId)} • Tier {getItemTier(instanceId)}</span>
          </div>
        </div>
        <div className="info-cell p-2 flex justify-between text-xs font-mono">
          <span className="text-neutral-400">{getItemStatLabel(instanceId)}</span>
          <span className="text-cyan-200 font-bold">{getItemStatValue(instanceId)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Gems ({gems.length})</span>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {gems.length === 0
              ? <span className="text-xs text-neutral-500 italic">No gems socketed</span>
              : gems.map((g, idx) => (
                <div key={idx} className="info-cell p-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`gem-overlay ${getGemCategory(g.id)} inline-block`} />
                    <span className="text-neutral-200">{getGemName(g.id)}</span>
                  </div>
                  <span className="text-neutral-400 text-[10px]">{getGemEffect(g.id)}</span>
                </div>
              ))
            }
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onEquip(instanceId)} className="combat-tactile-btn combat-cast-slab flex-1 py-1.5 text-xs uppercase font-bold">{isEquipped ? 'Unequip' : 'Equip'}</button>
          <button type="button" onClick={onClose} className="battle-mode-btn flex-1 py-1.5 text-xs uppercase">Cancel</button>
        </div>
      </div>
    </div>
  )
}
