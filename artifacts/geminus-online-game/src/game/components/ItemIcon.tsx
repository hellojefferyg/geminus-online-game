// src/components/ItemIcon.tsx
// Item art from public/icons (built by tools/build_icons.py); drawn SVG icons are the fallback.
import { useState } from 'react'
import ICONS from '../../data/icons.json'

const ITEM_ART: Record<string, string[]> = (ICONS as any).items || {}

/** 'dropper' | 'shadow' | 'echo' | 'starter' for an inventory item. */
export function itemQuality(item: any): string {
  if (item?.type === 'Shadow') return 'shadow'
  if (item?.type === 'Echo') return 'echo'
  if (item?.starter) return 'starter'
  return 'dropper'
}

export function itemArtUrl(subType: string, quality = 'dropper'): string | null {
  const slot = (subType || '').toLowerCase()
  const q = ITEM_ART[quality]?.includes(slot) ? quality : ITEM_ART.dropper?.includes(slot) ? 'dropper' : null
  return q ? `${import.meta.env.BASE_URL}icons/items/${q}/${slot}.webp` : null
}

export default function ItemIcon({ subType, quality = 'dropper', size = 28 }: { subType: string; quality?: string; size?: number }) {
  const [broken, setBroken] = useState(false)
  const url = itemArtUrl(subType, quality)
  if (url && !broken) {
    return <img src={url} alt={subType} loading="lazy" draggable={false} onError={() => setBroken(true)}
      style={{ width: size, height: size, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
  }
  return <DrawnIcon subType={subType} />
}


function DrawnIcon({ subType }: { subType: string }) {
  const s = (subType || '').toLowerCase()
  if (s.includes('helmet') || s.includes('helm'))
    return <svg className="w-7 h-7" style={{ color: '#e4e4e7', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a8 8 0 00-8 8v4a4 4 0 004 4h8a4 4 0 004-4v-4a8 8 0 00-8-8z"/><path d="M9 12h6M12 2v10M8 15h8"/></svg>
  if (s.includes('sword') || s.includes('blade'))
    return <svg className="w-7 h-7" style={{ color: '#fb7185', filter: 'drop-shadow(0 0 8px rgba(255,55,95,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.5 4l5.5 5.5L7 22l-4-1 1-4L14.5 4z"/><path d="M18 7.5l-3.5-3.5M4 20l3.5-3.5"/></svg>
  if (s.includes('axe'))
    return <svg className="w-7 h-7" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(255,149,0,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 12l6-6-4-4-6 6M4 20l10-10M9 7l4 4"/></svg>
  if (s.includes('staff'))
    return <svg className="w-7 h-7" style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 8px rgba(10,132,255,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 19L19 5M17 3l4 4M19 7l-2-2M12 12l2 2"/></svg>
  if (s.includes('armor') || s.includes('cuirass'))
    return <svg className="w-7 h-7" style={{ color: '#34d399', filter: 'drop-shadow(0 0 8px rgba(48,209,88,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3L4 7v6c0 5 4 8 8 9 4-1 8-4 8-9V7l-8-4z"/><path d="M12 3v19"/></svg>
  if (s.includes('gauntlet') || s.includes('glove'))
    return <svg className="w-7 h-7" style={{ color: '#5eead4', filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="8" width="12" height="12" rx="3"/><path d="M9 4v4M12 3v5M15 4v4"/></svg>
  if (s.includes('legging'))
    return <svg className="w-7 h-7" style={{ color: '#818cf8', filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h12v4l-2 13-3-1-1-9-1 9-3 1L6 7V3z"/></svg>
  if (s.includes('boot'))
    return <svg className="w-7 h-7" style={{ color: '#d4d4d8', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h6v9l5 2v4H5v-4l2-2V4z"/></svg>
  if (s.includes('fire'))
    return <svg className="w-7 h-7" style={{ color: '#f87171', filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.7))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2c1 3.5 4 5 4 8.5 0 3-2 5.5-4 7.5-2-2-4-4.5-4-7.5 0-3.5 3-5 4-8.5z"/></svg>
  if (s.includes('air') || s.includes('zephyr'))
    return <svg className="w-7 h-7" style={{ color: '#7dd3fc', filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8h13a3 3 0 10-3-3M3 12h14a3 3 0 11-3 3M6 16h8a2 2 0 10-2-2"/></svg>
  if (s.includes('death') || s.includes('void'))
    return <svg className="w-7 h-7" style={{ color: '#c084fc', filter: 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a9 9 0 00-9 9c0 4 2.5 7 6 8.5V22h6v-2.5c3.5-1.5 6-4.5 6-8.5a9 9 0 00-9-9z"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/></svg>
  if (s.includes('rune') || s.includes('accessory'))
    return <svg className="w-7 h-7" style={{ color: '#e4e4e7', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
  if (s.includes('amulet') || s.includes('pendant'))
    return <svg className="w-7 h-7" style={{ color: '#fcd34d', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3l6 9 6-9"/><circle cx="12" cy="16" r="4"/><path d="M12 14v4M10 16h4"/></svg>
  if (s.includes('ring'))
    return <svg className="w-7 h-7" style={{ color: '#fde047', filter: 'drop-shadow(0 0 8px rgba(253,224,71,0.6))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="13" r="7"/><polygon points="12 3 14 6 10 6 12 3"/></svg>
  return <svg className="w-7 h-7" style={{ color: '#e4e4e7' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/></svg>
}
