/**
 * src/game/map/zoneMap.ts
 * Graphic zone maps ported from Geminus.1 (MapRenderer.js / ZoneManager.js).
 * Data comes from public/maps (built by tools/build_maps.py). Pure helpers + a canvas painter.
 *
 * Grid: 25x25 pointy-top hexes, odd rows shifted right (Geminus.1 "odd-r" layout).
 */

import MAP_META from '../../data/mapAssets.json'

export interface ZoneMap {
  zid: string
  name: string
  w: number
  h: number
  anim: string
  spawn: [number, number]
  walk: string[]
  objects: [number, number, string][]
  services: [number, number, string][]
}

export interface LoadedMap { data: ZoneMap; bg: HTMLImageElement | null }

const BASE = import.meta.env.BASE_URL
const META: { zones: string[]; assets: Record<string, { name: string; scale: number; yOffset: number }> } = MAP_META as any
export const TILE = 64

export function hasGraphicMap(zoneId: string): boolean {
  return META.zones.includes(zoneId)
}

// ─── Loading (cached) ─────────────────────────────────────────────

const mapCache = new Map<string, Promise<LoadedMap | null>>()
const assetCache = new Map<string, HTMLImageElement>()

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function loadZoneMap(zoneId: string): Promise<LoadedMap | null> {
  if (!hasGraphicMap(zoneId)) return Promise.resolve(null)
  let p = mapCache.get(zoneId)
  if (!p) {
    p = Promise.all([
      fetch(`${BASE}maps/${zoneId}.json`).then(r => (r.ok ? r.json() : null)).catch(() => null),
      loadImage(`${BASE}maps/${zoneId}.webp`),
    ]).then(([data, bg]) => (data ? { data, bg } : null))
    mapCache.set(zoneId, p)
    p.then(m => { if (!m) mapCache.delete(zoneId) })
  }
  return p
}

/** Loads the building/decor images; calls onReady when each arrives so the canvas can repaint. */
export function loadMapAssets(onReady: () => void): void {
  for (const id of Object.keys(META.assets)) {
    if (assetCache.has(id)) continue
    const img = new Image()
    assetCache.set(id, img)
    img.onload = onReady
    img.src = `${BASE}maps/assets/${id}.webp`
  }
}

// ─── Grid helpers ─────────────────────────────────────────────────

export function isWalkable(m: ZoneMap, x: number, y: number): boolean {
  return y >= 0 && y < m.h && x >= 0 && x < m.w && m.walk[y]?.[x] === '1'
}

/** Hex neighbour for a D-pad direction (dx, dy each -1/0/1), odd-r layout. */
function neighbour(x: number, y: number, dx: number, dy: number): [number, number] {
  if (dy === 0) return [x + dx, y]
  const odd = y % 2 !== 0
  // Diagonals: left leans to x-1 on even rows, right leans to x+1 on odd rows
  if (dx < 0) return [odd ? x : x - 1, y + dy]
  return [odd ? x + 1 : x, y + dy]
}

/**
 * Where a D-pad press takes the player, or null if blocked.
 * Straight up/down zig-zags between the two hexes above/below so the player travels vertically.
 */
export function stepOnMap(m: ZoneMap, x: number, y: number, dx: number, dy: number): [number, number] | null {
  if (dx === 0 && dy === 0) return null
  if (dx !== 0) {
    const [nx, ny] = neighbour(x, y, dx, dy)
    return isWalkable(m, nx, ny) ? [nx, ny] : null
  }
  const odd = y % 2 !== 0
  const first = neighbour(x, y, odd ? -1 : 1, dy)
  const second = neighbour(x, y, odd ? 1 : -1, dy)
  if (isWalkable(m, first[0], first[1])) return first
  if (isWalkable(m, second[0], second[1])) return second
  return null
}

/** Building the player is standing on or right next to. */
export function serviceNear(m: ZoneMap, x: number, y: number): { x: number; y: number; action: string } | null {
  const here = m.services.find(([sx, sy]) => sx === x && sy === y)
  if (here) return { x: here[0], y: here[1], action: here[2] }
  const around = [[-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy]) => neighbour(x, y, dx, dy))
  const near = m.services.find(([sx, sy]) => around.some(([ax, ay]) => ax === sx && ay === sy))
  return near ? { x: near[0], y: near[1], action: near[2] } : null
}

/** Player position on this map: saved spot if walkable, otherwise the zone entrance. */
export function resolvePos(m: ZoneMap, gx?: number, gy?: number): [number, number] {
  if (gx != null && gy != null && isWalkable(m, gx, gy)) return [gx, gy]
  return m.spawn
}

// ─── Geometry (Geminus.1 MapRenderer, top-down pointy hex) ────────

export function tileCenter(m: ZoneMap, x: number, y: number): { x: number; y: number } {
  const s = TILE / Math.sqrt(3), w = Math.sqrt(3) * s, h = 2 * s
  const o = y % 2 !== 0 ? w / 2 : 0
  return { x: (x - Math.floor(m.w / 2)) * w + o, y: (y - Math.floor(m.h / 2)) * h * 0.75 }
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const r = TILE / Math.sqrt(3)
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a)
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

const SERVICE_COLORS: Record<string, string> = {
  sanctuary: '#30D158', vault: '#FFD60A', armory: '#3EE0FF', arcanium: '#BF5AF2', gemcutter: '#5AC8FA',
  soulforge: '#FF6B35', teleport: '#FF375F', portal: '#94a3b8',
}

export interface DrawOptions {
  /** 'follow' keeps the player centred at `zoom`; 'fit' shows the whole walkable area. */
  camera: 'follow' | 'fit'
  zoom?: number
  showGrid?: boolean
  labels?: boolean
  highlight?: { x: number; y: number } | null
}

/** Bounding box (world coords) of walkable tiles, for the 'fit' camera. */
function walkBounds(m: ZoneMap) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.walk[y][x] !== '1') continue
    const c = tileCenter(m, x, y)
    minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x); minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y)
  }
  if (!isFinite(minX)) return { cx: 0, cy: 0, bw: m.w * TILE, bh: m.h * TILE }
  const pad = TILE * 2.5
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, bw: maxX - minX + pad * 2, bh: maxY - minY + pad * 2 }
}

export function drawZoneMap(canvas: HTMLCanvasElement, map: LoadedMap, px: number, py: number, opt: DrawOptions) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const cw = canvas.clientWidth, ch = canvas.clientHeight
  if (!cw || !ch) return
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr)
  }
  const m = map.data
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#03080c'
  ctx.fillRect(0, 0, cw, ch)

  // Camera
  const player = tileCenter(m, px, py)
  let zoom: number, camX: number, camY: number
  if (opt.camera === 'fit') {
    const b = walkBounds(m)
    zoom = Math.min(cw / b.bw, ch / b.bh)
    camX = b.cx; camY = b.cy
  } else {
    zoom = opt.zoom ?? 0.6
    camX = player.x; camY = player.y
  }
  ctx.save()
  ctx.translate(cw / 2, ch / 2)
  ctx.scale(zoom, zoom)
  ctx.translate(-camX, -camY)

  // 1. Background art (same placement maths as Geminus.1)
  if (map.bg) {
    const s = TILE / Math.sqrt(3), h = 2 * s
    const totalW = m.w * TILE, totalH = m.h * TILE * 1.5
    const shiftY = (totalH - m.h * 0.75 * h) / 4
    ctx.drawImage(map.bg, -totalW / 2, -totalH / 2 + shiftY, totalW, totalH)
  }

  // 2. Walkable path
  if (opt.showGrid) {
    ctx.lineWidth = 1.5 / zoom
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.walk[y][x] !== '1') continue
      const c = tileCenter(m, x, y)
      hexPath(ctx, c.x, c.y)
      ctx.fillStyle = 'rgba(62,224,255,0.07)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(62,224,255,0.28)'
      ctx.stroke()
    }
  }

  // 3. Buildings + decor, back to front
  const objs = [...m.objects].sort((a, b) => a[1] + a[0] - (b[1] + b[0]))
  for (const [x, y, id] of objs) {
    const c = tileCenter(m, x, y)
    const img = assetCache.get(id)
    const meta = META.assets[id]
    if (img && img.complete && img.naturalWidth > 0 && meta) {
      const size = TILE * (meta.scale || 1)
      const ratio = img.naturalHeight / img.naturalWidth
      ctx.drawImage(img, c.x - size / 2, c.y - (size * ratio) / 2 + (meta.yOffset || 0), size, size * ratio)
    }
  }

  // 4. Building markers
  for (const [x, y, action] of m.services) {
    const c = tileCenter(m, x, y)
    const col = SERVICE_COLORS[action] || '#fff'
    const hi = opt.highlight && opt.highlight.x === x && opt.highlight.y === y
    hexPath(ctx, c.x, c.y)
    ctx.lineWidth = (hi ? 3 : 1.5) / zoom
    ctx.strokeStyle = hi ? col : col + '99'
    ctx.stroke()
    if (hi) { ctx.fillStyle = col + '33'; ctx.fill() }
  }

  // 5. Player (Geminus.1 fallback marker)
  const r = TILE / 2.8
  ctx.save()
  ctx.shadowColor = 'rgba(0,255,255,0.9)'
  ctx.shadowBlur = 18
  ctx.beginPath(); ctx.arc(player.x, player.y, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,255,255,0.9)'; ctx.fill()
  ctx.shadowBlur = 0
  ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke()
  ctx.fillStyle = '#000'; ctx.font = `bold ${Math.round(TILE * 0.4)}px sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('⚡', player.x, player.y + 1)
  ctx.restore()

  // 6. Building labels (big map)
  if (opt.labels) {
    ctx.font = `bold ${Math.max(10, 12 / zoom)}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
    for (const [x, y, action] of m.services) {
      const c = tileCenter(m, x, y)
      const label = LABELS[action] || action
      ctx.lineWidth = 3 / zoom; ctx.strokeStyle = 'rgba(0,0,0,0.9)'
      ctx.strokeText(label, c.x, c.y - TILE * 0.55)
      ctx.fillStyle = SERVICE_COLORS[action] || '#fff'
      ctx.fillText(label, c.x, c.y - TILE * 0.55)
    }
  }
  ctx.restore()
}

const LABELS: Record<string, string> = {
  sanctuary: 'Sanctuary', vault: 'Vault', armory: 'Armory', arcanium: 'Arcanum', gemcutter: 'Gem Cutter',
  soulforge: 'Soulforge', teleport: 'Portal', portal: 'Entrance',
}
