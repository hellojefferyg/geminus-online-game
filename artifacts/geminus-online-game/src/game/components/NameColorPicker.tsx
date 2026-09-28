// src/components/NameColorPicker.tsx
import { useState, useEffect, useRef } from 'react'

interface NameColorPickerProps {
  nameColor: string
  onColorChange: (color: string) => void
}

export default function NameColorPicker({ nameColor, onColorChange }: NameColorPickerProps) {
  const [tab, setTab] = useState<'grid' | 'spectrum' | 'sliders'>('grid')
  const [rgb, setRgb] = useState({ r: 62, g: 224, b: 255 })
  const [opacity, setOpacity] = useState(100)
  const wheelRef = useRef<HTMLCanvasElement>(null)

  const hsvToHex = (h: number, s: number, v: number) => {
    const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
    return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`
  }

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')

  const applyColor = (hex: string) => {
    onColorChange(hex)
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    setRgb({ r, g, b })
  }

  const hues = [205, 225, 255, 280, 320, 0, 22, 35, 48, 72, 118, 150]
  const gridColors: string[] = []
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 12; col++) {
      if (row === 0) {
        const steps = [255, 235, 209, 199, 174, 142, 99, 72, 58, 44, 28, 0]
        gridColors.push(rgbToHex(steps[col], steps[col], steps[col]))
      } else {
        const v = [0.28, 0.38, 0.48, 0.58, 0.70, 0.82, 0.92, 0.97, 1][row - 1]
        const s = [1, 1, 1, 1, 1, 0.95, 0.72, 0.45, 0.28][row - 1]
        gridColors.push(hsvToHex(hues[col], s, v))
      }
    }
  }

  useEffect(() => {
    if (tab !== 'spectrum' || !wheelRef.current) return
    const canvas = wheelRef.current
    const ctx = canvas.getContext('2d')!
    const size = canvas.width
    const cx = size / 2; const cy = size / 2; const radius = size / 2 - 4
    const img = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx; const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const i = (y * size + x) * 4
        if (dist > radius) { img.data[i + 3] = 0; continue }
        let hue = Math.atan2(dy, dx) * 180 / Math.PI
        if (hue < 0) hue += 360
        const hex = hsvToHex(hue, dist / radius, 1)
        img.data[i] = parseInt(hex.slice(1, 3), 16)
        img.data[i + 1] = parseInt(hex.slice(3, 5), 16)
        img.data[i + 2] = parseInt(hex.slice(5, 7), 16)
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [tab])

  const handleWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = wheelRef.current!
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    const x = (e.clientX - rect.left) * scale
    const y = (e.clientY - rect.top) * scale
    const cx = canvas.width / 2; const cy = canvas.height / 2
    const radius = canvas.width / 2 - 4
    const dx = x - cx; const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > radius) return
    let hue = Math.atan2(dy, dx) * 180 / Math.PI
    if (hue < 0) hue += 360
    applyColor(hsvToHex(hue, dist / radius, 1))
  }

  const presets = ['#3EE0FF', '#0A84FF', '#30D158', '#FFD60A', '#FF3B30', '#BF5AF2', '#FF9F0A', '#FFFFFF', '#FF375F', '#A2845E']

  return (
    <div style={{ background: '#1c1c1e', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', padding: '14px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button style={{ width: 32, height: 32, borderRadius: '50%', background: '#2c2c2e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2"><path d="M2 22l5.5-5.5"/><path d="M18.4 3.6a2.8 2.8 0 014 4L8 22H4v-4L18.4 3.6z"/></svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 600, color: '#fff' }}>Colors</span>
        <div style={{ width: 32 }} />
      </div>
      <div style={{ background: '#2c2c2e', borderRadius: '9px', padding: '2px', display: 'flex', marginBottom: '12px' }}>
        {(['grid', 'spectrum', 'sliders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: 'none', background: tab === t ? '#636366' : 'transparent', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '6px 0', borderRadius: '7px', cursor: 'pointer' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0, borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
          {gridColors.map((c, i) => <button key={i} onClick={() => applyColor(c)} style={{ aspectRatio: '1', background: c, border: 'none', cursor: 'pointer', padding: 0, display: 'block' }} />)}
        </div>
      )}
      {tab === 'spectrum' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
          <canvas ref={wheelRef} width={240} height={240} style={{ width: '240px', height: '240px', borderRadius: '50%', cursor: 'crosshair', touchAction: 'none', display: 'block' }} onClick={handleWheelClick} onMouseMove={e => { if (e.buttons) handleWheelClick(e) }} />
        </div>
      )}
      {tab === 'sliders' && (
        <div style={{ marginBottom: '12px' }}>
          {(['r', 'g', 'b'] as const).map(ch => (
            <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '13px', color: '#fff' }}>
              <span style={{ width: '12px' }}>{ch.toUpperCase()}</span>
              <input type="range" min="0" max="255" value={rgb[ch]} onChange={e => { const v = parseInt(e.target.value); const nr = { ...rgb, [ch]: v }; setRgb(nr); applyColor(rgbToHex(nr.r, nr.g, nr.b)) }} style={{ flex: 1 }} />
              <input type="number" min="0" max="255" value={rgb[ch]} onChange={e => { const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0)); const nr = { ...rgb, [ch]: v }; setRgb(nr); applyColor(rgbToHex(nr.r, nr.g, nr.b)) }} style={{ width: '52px', background: '#2c2c2e', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px', textAlign: 'center', fontSize: '13px' }} />
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.05em', color: '#8e8e93', marginBottom: '4px' }}>OPACITY</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: '12px', background: '#2c2c2e', borderRadius: '8px', padding: '4px 8px', color: '#fff', minWidth: '48px', textAlign: 'center' }}>{opacity}%</span>
        </div>
      </div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '8px', background: nameColor, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {presets.map(c => <button key={c} onClick={() => applyColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer' }} />)}
        </div>
      </div>
    </div>
  )
}
