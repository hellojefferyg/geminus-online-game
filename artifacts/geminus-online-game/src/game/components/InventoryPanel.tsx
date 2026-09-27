import type { InventoryItem, GemInstance } from '../../game/types'
import { AccordionItem } from './AccordionItem'
import { ItemIcon } from './ItemIcon'

interface InventoryPanelProps {
  inventory: InventoryItem[]
  gems: GemInstance[]
  equipment: Record<string, string | null>
  filterState: { category: string; subType: string; tier: string; quality: string; sortBy: string; order: string }
  onFilterChange: (key: string, value: string) => void
  onItemClick: (instanceId: string) => void
  selectedItemId: string | null
  getItemName: (instanceId: string) => string
  getItemSubType: (instanceId: string) => string
  getItemTier: (instanceId: string) => number
  getItemGems: (instanceId: string) => GemInstance[]
  getGemName: (gemId: string) => string
  getGemColor: (gemId: string) => string
  getGemCategory: (gemId: string) => 'fighter' | 'caster' | 'misc'
  bagDefs: Record<string, string[]>
}

export function InventoryPanel({ inventory, gems, equipment, filterState, onFilterChange, onItemClick, selectedItemId, getItemName, getItemSubType, getItemTier, getItemGems, getGemName, getGemColor, getGemCategory, bagDefs }: InventoryPanelProps) {
  const equippedIds = new Set(Object.values(equipment).filter(Boolean))
  return (
    <div className="glass-panel p-3 flex flex-col gap-2">
      <AccordionItem title="Sort & Filter">
        <div className="grid grid-cols-2 gap-2 p-1">
          <select className="editor-input text-xs" value={filterState.category} onChange={(e) => onFilterChange('category', e.target.value)}>
            <option value="All">All Categories</option>
            {Object.keys(bagDefs).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="editor-input text-xs" value={filterState.tier} onChange={(e) => onFilterChange('tier', e.target.value)}>
            <option value="All">All Tiers</option>
            {Array.from({length:20},(_,i)=>i+1).map(t=><option key={t} value={String(t)}>Tier {t}</option>)}
          </select>
          <select className="editor-input text-xs" value={filterState.sortBy} onChange={(e) => onFilterChange('sortBy', e.target.value)}>
            <option value="tier">Sort by Tier</option>
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
          </select>
          <select className="editor-input text-xs" value={filterState.order} onChange={(e) => onFilterChange('order', e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </AccordionItem>
      {Object.entries(bagDefs).map(([bagName, allowedTypes]) => {
        const bagItems = inventory.filter(item => allowedTypes.some(t => t.toLowerCase() === getItemSubType(item.instanceId).toLowerCase()))
        return (
          <AccordionItem key={bagName} title={`${bagName} (${bagItems.length})`} defaultOpen>
            <div className="inventory-grid">
              {bagItems.map(item => {
                const attachedGems = getItemGems(item.instanceId)
                return (
                  <div key={item.instanceId} onClick={() => onItemClick(item.instanceId)} className={`inventory-slot ${selectedItemId === item.instanceId ? 'ring-2 ring-cyan-400' : ''}`} title={getItemName(item.instanceId)}>
                    <div className="gem-overlays-container">
                      {attachedGems.map((g,i) => <span key={i} className={`gem-overlay ${getGemCategory(g.id)}`} />)}
                    </div>
                    <div className="item-icon-wrapper"><ItemIcon subType={getItemSubType(item.instanceId)} /></div>
                    <span className="item-tier-label">T{getItemTier(item.instanceId)}</span>
                    {equippedIds.has(item.instanceId) && <span className="absolute top-0.5 right-0.5 text-[9px] font-bold text-cyan-300">E</span>}
                  </div>
                )
              })}
            </div>
          </AccordionItem>
        )
      })}
      <AccordionItem title={`Gem Pouch (${gems.length})`}>
        <div className="gem-pouch-grid">
          {gems.map((gem, idx) => (
            <div key={`${gem.id}-${idx}`} className="gem-item flex items-center gap-2 p-1.5 info-cell text-xs">
              <span className={`gem-overlay ${getGemCategory(gem.id)} inline-block`} style={{ backgroundColor: getGemColor(gem.id) }} />
              <span className="truncate">{getGemName(gem.id)} G{gem.grade}</span>
            </div>
          ))}
          {gems.length === 0 && <span className="text-xs text-neutral-500 italic p-2">Pouch is empty</span>}
        </div>
      </AccordionItem>
    </div>
  )
}
