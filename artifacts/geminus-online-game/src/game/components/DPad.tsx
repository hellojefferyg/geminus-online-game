// src/components/DPad.tsx

interface DPadProps {
  onMove: (dx: number, dy: number) => void
  onEnter: () => void
  style?: React.CSSProperties
  /** Button width in px (height follows); the HUD uses a slightly smaller pad inside its frame */
  size?: number
}

export default function DPad({ onMove, onEnter, style, size = 50 }: DPadProps) {
  const h = Math.round(size * 0.92)
  const btnSize = { width: `${size}px`, height: `${h}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 as const, cursor: 'pointer' }
  const diagBtn: React.CSSProperties = { ...btnSize, background: 'linear-gradient(180deg, #12232d 0%, #060c10 100%)', border: '1.5px solid rgba(62,224,255,0.6)', borderRadius: '0.75rem', color: '#e8fbff', fontSize: '13px', boxShadow: '0 0 10px rgba(62,224,255,0.28), inset 0 1px 1px rgba(62,224,255,0.28), 0 3px 8px rgba(0,0,0,0.8)' }
  const cardinalBtn: React.CSSProperties = { ...btnSize, background: 'linear-gradient(180deg, #12232d 0%, #060c10 100%)', border: '1.5px solid rgba(62,224,255,0.85)', borderRadius: '0.75rem', color: '#e8fbff', boxShadow: '0 0 14px rgba(62,224,255,0.45), inset 0 1px 1px rgba(62,224,255,0.4), 0 3px 8px rgba(0,0,0,0.8)' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${size}px)`, gridTemplateRows: `repeat(3, ${h}px)`, gap: '6px', justifyContent: 'center', marginTop: '8px', ...style }}>
      <div style={diagBtn} onClick={() => onMove(-1, -1)}>↖</div>
      <div style={cardinalBtn} onClick={() => onMove(0, -1)}><svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg></div>
      <div style={diagBtn} onClick={() => onMove(1, -1)}>↗</div>
      <div style={cardinalBtn} onClick={() => onMove(-1, 0)}><svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg></div>
      <div style={{ ...diagBtn, border: '1.5px solid rgba(62,224,255,0.6)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.01em', color: '#d9f8ff' }} onClick={onEnter}>Enter</div>
      <div style={cardinalBtn} onClick={() => onMove(1, 0)}><svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg></div>
      <div style={diagBtn} onClick={() => onMove(-1, 1)}>↙</div>
      <div style={cardinalBtn} onClick={() => onMove(0, 1)}><svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor' }}><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg></div>
      <div style={diagBtn} onClick={() => onMove(1, 1)}>↘</div>
    </div>
  )
}
