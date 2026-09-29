/**
 * src/game/map/lattice.ts
 * ZONE-LATTICE-DUALVIEW-v1: every zone is one stamp (src/data/stamps.json) and the player's
 * position is one {x, y} on it. Text mode draws each cell as a rounded square, Graphic mode as a
 * pointy-top hex centred on the SAME point, so switching modes never moves the player or a building.
 *
 *   screenX = originX + x * tileW
 *   screenY = originY + (rows - 1 - y) * tileH     (y grows north, screen y grows down)
 *   hex radius = 0.46 * min(tileW, tileH)           (no row indent, no axial conversion)
 */

import STAMPS_DATA from '../../data/stamps.json'

export interface Stamp { size: number; spawn: [number, number]; rows: string[]; locked?: boolean }
export type MapMode = 'text' | 'graphic'

const STAMPS: Record<string, any> = STAMPS_DATA
export const SERVICES: Record<string, { label: string; color: string; action: string }> = STAMPS._services
/** Bump when the lattice changes so saved positions from an older layout go back to spawn. */
export const LATTICE_VERSION = 2

export function getStampById(id: string | undefined): Stamp {
  return STAMPS[id || ''] || STAMPS.starter_7x7
}

export function tileAt(s: Stamp, x: number, y: number): string | null {
  if (y < 0 || y >= s.size || x < 0 || x >= s.size) return null
  return s.rows[y][x] ?? null
}

/** Saved spot if it's on this stamp and from the current layout, otherwise the Sanctuary spawn. */
export function resolvePos(s: Stamp, pos: any): [number, number] {
  const { x, y, v } = pos || {}
  if (v === LATTICE_VERSION && tileAt(s, x, y) != null) return [x, y]
  return [s.spawn[0], s.spawn[1]]
}

/** One step in any of the 8 directions (dy > 0 = north). Null if it would leave the zone. */
export function stepOn(s: Stamp, x: number, y: number, dx: number, dy: number): [number, number] | null {
  if (dx === 0 && dy === 0) return null
  const nx = x + dx, ny = y + dy
  return tileAt(s, nx, ny) == null ? null : [nx, ny]
}

// ─── Building art (tools/build_buildings.py) ───────────────────────

const BUILDING_ART: Record<string, string> = {
  R: 'sanctuary', B: 'vault', S: 'armory', M: 'arcanum', Q: 'quest', T: 'teleporter',
  G: 'gemcutter', F: 'soulforge', C: 'clan', X: 'boss', E: 'exit', r: 'rubble',
}
const artCache = new Map<string, HTMLImageElement>()

/** Starts loading the building sprites; onReady fires as each one arrives so the canvas can repaint. */
export function loadBuildingArt(onReady: () => void): void {
  for (const name of Object.values(BUILDING_ART)) {
    if (artCache.has(name)) continue
    const img = new Image()
    artCache.set(name, img)
    img.onload = onReady
    img.src = `${import.meta.env.BASE_URL}buildings/${name}.webp`
  }
}

function art(tile: string): HTMLImageElement | null {
  const img = artCache.get(BUILDING_ART[tile])
  return img && img.complete && img.naturalWidth > 0 ? img : null
}

// ─── Drawing ───────────────────────────────────────────────────────

export interface LatticeView {
  stamp: Stamp
  mode: MapMode
  px: number
  py: number
  /** Big map: more padding, labels under buildings */
  big: boolean
  /** Zone painting behind the hexes (graphic mode) */
  bg?: HTMLImageElement | null
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h) // older iOS
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90)          // pointy top
    const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a)
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

export function drawLattice(canvas: HTMLCanvasElement, v: LatticeView) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth, h = canvas.clientHeight
  if (!w || !h) return
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const { stamp, mode, px, py, big } = v
  const n = stamp.size
  const pad = big ? 14 : 6
  // Graphic sprites stand taller than their hex, so leave headroom above the north row
  const head = mode === 'graphic' ? 0.45 : 0
  const tile = Math.floor((Math.min(w, h) - pad * 2) / (n + head))   // square cells: tileW = tileH
  const originX = Math.floor((w - tile * n) / 2) + tile / 2
  const originY = Math.floor((h - tile * (n + head)) / 2) + tile * head + tile / 2
  const at = (x: number, y: number) => ({ cx: originX + x * tile, cy: originY + (n - 1 - y) * tile })

  // Backdrop
  if (mode === 'graphic' && v.bg) {
    const s = Math.max(w / v.bg.naturalWidth, h / v.bg.naturalHeight)   // cover
    const bw = v.bg.naturalWidth * s, bh = v.bg.naturalHeight * s
    ctx.drawImage(v.bg, (w - bw) / 2, (h - bh) / 2, bw, bh)
    ctx.fillStyle = 'rgba(2,6,10,0.45)'; ctx.fillRect(0, 0, w, h)
  } else {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75)
    g.addColorStop(0, '#0b1118'); g.addColorStop(1, '#03060a')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  }

  // Cells
  const gap = big ? 4 : 2
  const hexR = 0.46 * tile
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const t = stamp.rows[y][x]
    const svc = SERVICES[t]
    const { cx, cy } = at(x, y)
    const shape = () => mode === 'graphic'
      ? hexPath(ctx, cx, cy, hexR)
      : roundRect(ctx, cx - tile / 2 + gap / 2, cy - tile / 2 + gap / 2, tile - gap, tile - gap, Math.max(2, tile * 0.18))
    shape()
    const g = ctx.createLinearGradient(cx - tile / 2, cy - tile / 2, cx + tile / 2, cy + tile / 2)
    if (t === 'r') {
      g.addColorStop(0, mode === 'graphic' ? 'rgba(20,24,30,0.75)' : '#0d1116'); g.addColorStop(1, mode === 'graphic' ? 'rgba(8,10,14,0.75)' : '#07090c')
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(212,218,227,0.12)'; ctx.lineWidth = 1; ctx.stroke()
    } else if (svc) {
      g.addColorStop(0, svc.color + (mode === 'graphic' ? '66' : '55')); g.addColorStop(1, svc.color + (mode === 'graphic' ? '26' : '14'))
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = svc.color + 'cc'; ctx.lineWidth = big ? 1.5 : 1; ctx.stroke()
    } else if (mode === 'graphic') {
      g.addColorStop(0, 'rgba(62,224,255,0.16)'); g.addColorStop(1, 'rgba(8,20,30,0.40)')
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(62,224,255,0.38)'; ctx.lineWidth = 1; ctx.stroke()
    } else {
      g.addColorStop(0, 'rgba(226,232,240,0.16)'); g.addColorStop(1, 'rgba(148,163,184,0.05)')
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(212,218,227,0.22)'; ctx.lineWidth = 1; ctx.stroke()
    }
    if (x === px && y === py) {
      ctx.save(); ctx.shadowColor = 'rgba(62,224,255,0.9)'; ctx.shadowBlur = big ? 14 : 8
      shape(); ctx.strokeStyle = '#3EE0FF'; ctx.lineWidth = big ? 2.5 : 1.8; ctx.stroke(); ctx.restore()
    }
  }

  // Buildings: letters (text) or sprites standing on their hex (graphic), drawn south-last so they overlap correctly
  const fontSize = Math.floor(tile * (big ? 0.34 : 0.46))
  for (let y = n - 1; y >= 0; y--) for (let x = 0; x < n; x++) {
    const t = stamp.rows[y][x]
    if (t === '.') continue
    const svc = SERVICES[t]
    const { cx, cy } = at(x, y)
    const isPlayer = x === px && y === py
    const img = mode === 'graphic' ? art(t) : null
    if (img) {
      const size = tile * (t === 'r' ? 0.8 : 1.02)
      const ih = size * (img.naturalHeight / img.naturalWidth)
      ctx.globalAlpha = isPlayer ? 0.55 : 1
      ctx.drawImage(img, cx - size / 2, cy + hexR * 0.55 - ih, size, ih)   // feet on the lower part of the hex
      ctx.globalAlpha = 1
    } else if (svc || t === 'r') {
      ctx.fillStyle = isPlayer ? '#fff' : svc?.color || 'rgba(212,218,227,0.35)'
      ctx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(t, cx, cy + (isPlayer && big ? -tile * 0.16 : 0))
    }
  }

  // Big graphic map: name under each building, after all sprites so none get covered; shrunk to fit its cell
  if (big && mode === 'graphic') {
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const svc = SERVICES[stamp.rows[y][x]]
      if (!svc) continue
      const { cx, cy } = at(x, y)
      let fs = Math.max(9, Math.floor(tile * 0.17))
      const fit = () => { ctx.font = `700 ${fs}px -apple-system, BlinkMacSystemFont, sans-serif` }
      fit()
      while (fs > 7 && ctx.measureText(svc.label).width > tile * 0.98) { fs--; fit() }
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(svc.label, cx, cy + hexR * 0.62)
      ctx.fillStyle = svc.color; ctx.fillText(svc.label, cx, cy + hexR * 0.62)
    }
  }

  // Player marker
  const { cx, cy } = at(px, py)
  const onBuilding = !!SERVICES[stamp.rows[py]?.[px]]
  ctx.save(); ctx.shadowColor = '#3EE0FF'; ctx.shadowBlur = 10
  ctx.fillStyle = '#e8fbff'; ctx.beginPath()
  ctx.arc(cx, cy + (onBuilding ? tile * 0.2 : 0), tile * (onBuilding ? 0.1 : 0.16), 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

// ─── Zone paintings (graphic backdrop) ─────────────────────────────

const bgCache = new Map<string, Promise<HTMLImageElement | null>>()

export function loadZoneBackground(zoneId: string): Promise<HTMLImageElement | null> {
  let p = bgCache.get(zoneId)
  if (!p) {
    p = new Promise(resolve => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = `${import.meta.env.BASE_URL}maps/${zoneId}.webp`
    })
    bgCache.set(zoneId, p)
  }
  return p
}
