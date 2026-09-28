// src/game/components/GemIcon.tsx
// Gem art from public/icons/gems (built by tools/build_icons.py); coloured dot fallback.
import { useState } from 'react'
import ICONS from '../../data/icons.json'
import { gemKey, gemInfo } from '../../systems/services'

const GEM_ART = new Set<string>((ICONS as any).gems || [])

export function gemDot(color: string) {
  return color === 'Red' ? '🔴' : color === 'Blue' ? '🔵' : color === 'Yellow' ? '🟡' : color === 'Purple' ? '🟣' : '🟢'
}

export default function GemIcon({ id, size = 22 }: { id: string; size?: number }) {
  const [broken, setBroken] = useState(false)
  const key = gemKey(id)
  if (GEM_ART.has(key) && !broken) {
    return <img src={`${import.meta.env.BASE_URL}icons/gems/${key}.webp`} alt={gemInfo(id).name} loading="lazy" draggable={false}
      onError={() => setBroken(true)} style={{ width: size, height: size, objectFit: 'contain', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }} />
  }
  return <span style={{ fontSize: Math.round(size * 0.55) }}>{gemDot(gemInfo(id).color)}</span>
}
