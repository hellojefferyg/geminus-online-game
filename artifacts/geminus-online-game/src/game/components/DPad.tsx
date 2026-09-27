interface DPadProps {
  onMove: (dx: number, dy: number) => void
  onEnter: () => void
  style?: React.CSSProperties
}

export function DPad({ onMove, onEnter, style }: DPadProps) {
  const base: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(20,24,33,0.85)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'6px', color:'#38bdf8', cursor:'pointer', fontSize:'14px', fontWeight:'bold' }
  const enter: React.CSSProperties = { ...base, backgroundColor:'rgba(34,211,238,0.15)', borderColor:'rgba(34,211,238,0.7)', color:'#22d3ee' }
  const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, 44px)', gridTemplateRows:'repeat(3, 44px)', gap:'4px', userSelect:'none', touchAction:'manipulation', ...style }
  return (
    <div style={grid}>
      <button type="button" style={base} onClick={() => onMove(-1,-1)}>↖</button>
      <button type="button" style={base} onClick={() => onMove(0,-1)}>↑</button>
      <button type="button" style={base} onClick={() => onMove(1,-1)}>↗</button>
      <button type="button" style={base} onClick={() => onMove(-1,0)}>←</button>
      <button type="button" style={enter} onClick={onEnter}>OK</button>
      <button type="button" style={base} onClick={() => onMove(1,0)}>→</button>
      <button type="button" style={base} onClick={() => onMove(-1,1)}>↙</button>
      <button type="button" style={base} onClick={() => onMove(0,1)}>↓</button>
      <button type="button" style={base} onClick={() => onMove(1,1)}>↘</button>
    </div>
  )
}
