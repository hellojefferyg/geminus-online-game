import { useEffect, useRef, useState, useCallback } from 'react'

const RAW_BASE = 'https://raw.githubusercontent.com/hellojefferyg/geminus.2/main/public/data/zones'

interface WorldMapProps {
  playerPos: { x: number; y: number }
  currentZoneId: string
  onClose: () => void
  onZoneChange: (zoneId: string, zoneName: string) => void
}

interface ZoneEntry {
  zoneName: string
  minLevel: number
  chunks: string[]
  masterConfigFile: string
}

interface ChunkData {
  layers: any[]
  mapSize: { width: number; height: number }
  tileType: string
  assetLibrary: Record<string, any>
  biome?: string
  zoneName?: string
  backgroundImage?: string
  zid?: string
}

// Image cache shared across renders
const imgCache: Record<string, HTMLImageElement> = {}

function loadImg(url: string): Promise<HTMLImageElement> {
  if (imgCache[url]) return Promise.resolve(imgCache[url])
  return new Promise((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgCache[url] = img; res(img) }
    img.onerror = () => res(img)
    // Fix GitHub blob URLs to raw
    let src = url
    if (src.includes('github.com') && !src.includes('raw.githubusercontent.com')) {
      src = src.replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/').replace('/refs/heads/', '/')
    }
    img.src = src
  })
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex?.startsWith('#')) return `rgba(60,80,60,${alpha})`
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}

const BIOME_COLORS: Record<string, string> = {
  forest:'#2d5a27', desert:'#c4a35a', tundra:'#8ab4c2', mountain:'#6b6b6b',
  swamp:'#3d5228', jungle:'#1a5c1a', volcanic:'#5c2a1a', plains:'#5a8c3a',
  ocean:'#1a4a7a', wasteland:'#8c5c2d', badlands:'#8c4a2d', crystalline:'#3a7a8c',
  shadow:'#2d1a3d', default:'#2a4a3a', Clear:'rgba(0,0,0,0)',
}

export default function WorldMap({ playerPos, currentZoneId, onClose, onZoneChange }: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const miniCanvasRef = useRef<HTMLCanvasElement>(null)
  const [manifest, setManifest] = useState<Record<string, ZoneEntry>>({})
  const [chunkData, setChunkData] = useState<ChunkData | null>(null)
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null)
  const [assetImgs, setAssetImgs] = useState<Record<string, HTMLImageElement>>({})
  const [loadingZone, setLoadingZone] = useState(false)
  const [activeZone, setActiveZone] = useState(currentZoneId)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [view, setView] = useState<'world' | 'zone'>('zone')
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const isPanRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const dragStartRef = useRef({ x: 0, y: 0 })
  const animRef = useRef(0)
  const particlesRef = useRef<any[]>([])

  // ── Fetch manifest ──────────────────────────────────────────
  useEffect(() => {
    fetch(`${RAW_BASE}/manifest.json`)
      .then(r => r.json())
      .then(data => setManifest(data))
      .catch(() => console.warn('Manifest load failed'))
  }, [])

  // ── Load zone chunk ─────────────────────────────────────────
  const loadZone = useCallback(async (zid: string) => {
    const entry = manifest[zid]
    if (!entry) return
    setLoadingZone(true)
    setChunkData(null)
    setBgImg(null)
    setAssetImgs({})
    panRef.current = { x: 0, y: 0 }
    zoomRef.current = 1

    try {
      // Load master config first to get background
      let masterData: any = null
      try {
        const mr = await fetch(`${RAW_BASE}/${entry.masterConfigFile}`)
        if (mr.ok) masterData = await mr.json()
      } catch {}

      // Load first chunk
      const chunkId = entry.chunks[0]
      const cr = await fetch(`${RAW_BASE}/${zid}_chunk_${chunkId}.json`)
      if (!cr.ok) throw new Error('chunk not found')
      const chunk = await cr.json()

      // Merge master + chunk
      const merged: ChunkData = {
        ...chunk,
        zoneName: masterData?.zoneName || entry.zoneName,
        biome: masterData?.biome || chunk.biome,
        backgroundImage: masterData?.backgroundImage || chunk.backgroundImage,
        assetLibrary: { ...(masterData?.assetLibrary || {}), ...(chunk.assetLibrary || {}) },
        zid,
      }
      setChunkData(merged)

      // Load background image
      if (merged.backgroundImage) {
        const bi = await loadImg(merged.backgroundImage)
        setBgImg(bi.complete && bi.naturalWidth > 0 ? bi : null)
      }

      // Load asset images (staggered to avoid 429)
      const imgs: Record<string, HTMLImageElement> = {}
      const assets = Object.values(merged.assetLibrary || {}) as any[]
      for (const asset of assets) {
        if (asset.imageUrl) {
          await new Promise(r => setTimeout(r, 30))
          const img = await loadImg(asset.imageUrl)
          if (img.complete && img.naturalWidth > 0) imgs[asset.imageUrl] = img
        }
      }
      setAssetImgs(imgs)
    } catch (e) {
      console.warn('Zone load failed:', e)
    }
    setLoadingZone(false)
  }, [manifest])

  // Load initial zone
  useEffect(() => {
    if (Object.keys(manifest).length > 0) loadZone(activeZone)
  }, [manifest, activeZone, loadZone])

  // ── Draw hex shape ──────────────────────────────────────────
  const drawHex = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
    const s = size / Math.sqrt(3)
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30)
      const x = cx + s * Math.cos(a), y = cy + s * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.closePath()
  }

  // Get hex center (matches Josh's MapRenderer math exactly)
  const getTileCenter = (x: number, y: number, mapSize: { width: number; height: number }, TILE_SIZE: number) => {
    const s = TILE_SIZE / Math.sqrt(3)
    const w = Math.sqrt(3) * s
    const h = 2 * s
    const o = (y % 2 !== 0) ? w / 2 : 0
    const mx = Math.floor(mapSize.width / 2)
    const my = Math.floor(mapSize.height / 2)
    return { x: (x - mx) * w + o, y: (y - my) * h * 0.75 }
  }

  // ── Main draw loop ──────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth, H = canvas.clientHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#03080c'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!chunkData) return

    const TILE_SIZE = 64
    const mapSize = chunkData.mapSize || { width: 15, height: 15 }
    const biome = chunkData.biome || 'default'
    const tileColor = BIOME_COLORS[biome] || BIOME_COLORS.default
    const groundLayer = chunkData.layers?.find((l: any) => l.id === 'ground')
    const objectLayer = chunkData.layers?.find((l: any) => l.id === 'objects')

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.translate(W / 2 + panRef.current.x, H / 2 + panRef.current.y)
    ctx.scale(zoomRef.current, zoomRef.current)

    // Background image
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      const s = TILE_SIZE / Math.sqrt(3)
      const w = Math.sqrt(3) * s, h = 2 * s
      const totalW = (mapSize.width + 0.5) * w
      const totalH = (mapSize.height * 0.75 + 0.25) * h
      ctx.drawImage(bgImg, -totalW / 2, -totalH / 2, totalW, totalH)
    }

    // Draw ground tiles
    if (groundLayer?.grid) {
      for (let y = 0; y < mapSize.height; y++) {
        for (let x = 0; x < mapSize.width; x++) {
          const tile = groundLayer.grid[y]?.[x]
          if (!tile || tile.type === 'empty' || tile.type === 'wall') continue
          const c = getTileCenter(x, y, mapSize, TILE_SIZE)
          drawHex(ctx, c.x, c.y, TILE_SIZE)
          ctx.fillStyle = hexToRgba(tileColor, bgImg ? 0.3 : 0.85)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    // Draw object/asset layer
    if (objectLayer?.grid) {
      // Collect and depth-sort
      const items: { x: number; y: number; tile: any; depth: number }[] = []
      for (let y = 0; y < mapSize.height; y++) {
        for (let x = 0; x < mapSize.width; x++) {
          const tile = objectLayer.grid[y]?.[x]
          if (tile?.assetId) items.push({ x, y, tile, depth: y + x + 0.5 })
        }
      }
      items.sort((a, b) => a.depth - b.depth)

      items.forEach(({ x, y, tile }) => {
        const asset = chunkData.assetLibrary?.[tile.assetId]
        const img = asset ? (assetImgs[asset.imageUrl] || imgCache[asset.imageUrl]) : null
        const c = getTileCenter(x, y, mapSize, TILE_SIZE)

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save()
          ctx.translate(c.x, c.y)
          if (tile.rotation) ctx.rotate((tile.rotation * Math.PI) / 180)
          if (tile.flipped) ctx.scale(-1, 1)
          const scale = asset.scale || 1
          const yOffset = asset.yOffset || 0
          const size = TILE_SIZE * scale
          const ratio = img.height / img.width
          ctx.drawImage(img, -size/2, -(size*ratio)/2 + yOffset, size, size*ratio)
          ctx.restore()
        }

        // Interaction badge
        if (tile.properties?.interactionType && tile.properties.interactionType !== 'none') {
          const badgeR = TILE_SIZE / 5
          const bx = c.x + TILE_SIZE * 0.35, by = c.y - TILE_SIZE * 0.35
          ctx.beginPath(); ctx.arc(bx, by, badgeR, 0, Math.PI*2)
          ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fill()
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke()
          ctx.fillStyle = '#fff'; ctx.font = `${badgeR}px sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText('!', bx, by + 1)
        }
      })
    }

    // Draw player
    const pc = getTileCenter(playerPos.x, playerPos.y, mapSize, TILE_SIZE)
    ctx.save()
    ctx.shadowColor = 'rgba(62,224,255,0.9)'; ctx.shadowBlur = 16
    ctx.beginPath(); ctx.arc(pc.x, pc.y, TILE_SIZE / 2.8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(62,224,255,0.25)'; ctx.fill()
    ctx.strokeStyle = '#3EE0FF'; ctx.lineWidth = 2; ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.font = `bold ${TILE_SIZE * 0.4}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('⚡', pc.x, pc.y + 1)
    ctx.restore()

    // Zone name
    ctx.restore() // end transform
    if (chunkData.zoneName) {
      ctx.save()
      const fs = Math.min(W / 12, 32)
      ctx.font = `bold ${fs}px -apple-system, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 4
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 10
      ctx.strokeText(chunkData.zoneName, W/2, 16)
      ctx.fillText(chunkData.zoneName, W/2, 16)
      ctx.restore()
    }
  }, [chunkData, bgImg, assetImgs, playerPos])

  // Animation loop
  useEffect(() => {
    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const resize = () => { canvas.width = canvas.clientWidth*dpr; canvas.height = canvas.clientHeight*dpr }
    resize(); window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── Input handlers ──────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isPanRef.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanRef.current) return
    panRef.current = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y }
  }
  const handleMouseUp = () => { isPanRef.current = false }
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    zoomRef.current = Math.max(0.2, Math.min(4, zoomRef.current * (e.deltaY > 0 ? 0.9 : 1.1)))
  }

  const touchPanStart = useRef({ x: 0, y: 0 })
  const lastPinchDist = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      isPanRef.current = true
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      panStartRef.current = { x: e.touches[0].clientX - panRef.current.x, y: e.touches[0].clientY - panRef.current.y }
    } else if (e.touches.length === 2) {
      lastPinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && isPanRef.current) {
      panRef.current = { x: e.touches[0].clientX - panStartRef.current.x, y: e.touches[0].clientY - panStartRef.current.y }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      if (lastPinchDist.current > 0) {
        zoomRef.current = Math.max(0.2, Math.min(4, zoomRef.current * (dist / lastPinchDist.current)))
      }
      lastPinchDist.current = dist
    }
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    isPanRef.current = false
    lastPinchDist.current = 0
  }

  const zoneList = Object.entries(manifest)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#03080c' }}>

      {/* Header */}
      <div style={{
        flexShrink: 0, padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        borderBottom: '1px solid rgba(62,224,255,0.2)',
        background: 'rgba(3,8,12,0.95)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflowX: 'auto' }}>
          {zoneList.slice(0, 12).map(([zid, z]) => (
            <button key={zid} onClick={() => { setActiveZone(zid); loadZone(zid) }}
              style={{
                flexShrink: 0, padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                background: zid === activeZone ? 'rgba(62,224,255,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${zid === activeZone ? '#3EE0FF' : 'rgba(255,255,255,0.12)'}`,
                color: zid === activeZone ? '#3EE0FF' : '#94a3b8', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {zid}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loadingZone && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(3,8,12,0.8)', zIndex: 10, flexDirection: 'column', gap: '12px',
          }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(62,224,255,0.2)', borderTop: '3px solid #3EE0FF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#3EE0FF', fontSize: '12px', fontFamily: 'monospace' }}>Loading {ZONE_MANIFEST_NAMES[activeZone] || activeZone}...</div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: isPanRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: '8px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(3,8,12,0.95)', borderTop: '1px solid rgba(62,224,255,0.15)',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
            {manifest[activeZone]?.zoneName || activeZone}
          </div>
          <div style={{ fontSize: '10px', color: '#3EE0FF', fontFamily: 'monospace' }}>
            {activeZone} · Pos [{playerPos.x}, {playerPos.y}] · Drag to pan · Pinch to zoom
          </div>
        </div>
        <button
          onClick={() => { onZoneChange(activeZone, manifest[activeZone]?.zoneName || activeZone); onClose() }}
          style={{
            padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
            background: activeZone === currentZoneId ? 'rgba(48,209,88,0.15)' : 'rgba(62,224,255,0.15)',
            border: `1.5px solid ${activeZone === currentZoneId ? '#30D158' : '#3EE0FF'}`,
            color: activeZone === currentZoneId ? '#30D158' : '#3EE0FF',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {activeZone === currentZoneId ? '✓ HERE' : 'TRAVEL'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// Zone name lookup for loading screen
const ZONE_MANIFEST_NAMES: Record<string, string> = {
  Z01:'Crystal Caves', Z02:'Glimmerwood', Z03:'The Shifting Maze', Z04:'Chromatic Badlands',
  Z05:'Mana Springs', Z06:'Blazefire Wastes', Z07:'Shadow Mire', Z08:'Whispering Woods',
  Z09:'Ashfall Barrens', Z10:'Screaming Crags', Z11:'The Great Vine Labyrinth',
  Z12:'The Howling Steppes', Z13:'Cloud Peaks', Z14:'Emberfall Forest', Z15:'Aetherial Forests',
}
