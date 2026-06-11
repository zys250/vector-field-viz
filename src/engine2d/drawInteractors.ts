import { Vec2 } from '../math/Vector2'
import type { Viewport } from '../store/useSceneStore'
import { worldToScreen } from './coordinates'

export function drawCharge(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  charge: number,
  vp: Viewport,
  w: number,
  h: number,
  options?: { hovered?: boolean; dragging?: boolean }
) {
  const sp = worldToScreen(pos, vp, w, h)
  const radius = 14
  const isPositive = charge > 0

  ctx.save()

  if (options?.hovered || options?.dragging) {
    ctx.shadowColor = isPositive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'
    ctx.shadowBlur = 15
  }

  ctx.beginPath()
  ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = isPositive ? '#ef4444' : '#3b82f6'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(isPositive ? '+' : '-', sp.x, sp.y)

  ctx.restore()
}

export function drawObservationPoint(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  vp: Viewport,
  w: number,
  h: number
) {
  const sp = worldToScreen(pos, vp, w, h)
  const size = 8

  ctx.save()
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sp.x - size, sp.y)
  ctx.lineTo(sp.x + size, sp.y)
  ctx.moveTo(sp.x, sp.y - size)
  ctx.lineTo(sp.x, sp.y + size)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#22d3ee'
  ctx.fill()

  ctx.restore()
}

export function drawPaddleWheel(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  curlValue: number,
  vp: Viewport,
  w: number,
  h: number,
  angle: number
) {
  const sp = worldToScreen(pos, vp, w, h)
  const radius = 18
  const hasSpin = Math.abs(curlValue) > 0.03
  const spinColor = curlValue > 0.03 ? '#ff7b8f' : curlValue < -0.03 ? '#47c8ff' : '#f7c86a'

  ctx.save()
  ctx.translate(sp.x, sp.y)

  ctx.beginPath()
  ctx.arc(0, 0, radius + 5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(5, 13, 24, 0.66)'
  ctx.fill()
  ctx.strokeStyle = hasSpin ? `${spinColor}cc` : 'rgba(247, 200, 106, 0.55)'
  ctx.lineWidth = 1.4
  ctx.stroke()

  if (hasSpin) {
    const direction = curlValue > 0 ? 1 : -1
    const start = direction > 0 ? -0.55 : Math.PI + 0.55
    const end = start + direction * 1.45
    ctx.beginPath()
    ctx.arc(0, 0, radius + 10, start, end, direction < 0)
    ctx.strokeStyle = `${spinColor}aa`
    ctx.lineWidth = 2
    ctx.stroke()

    const arrowAngle = end
    const arrowX = Math.cos(arrowAngle) * (radius + 10)
    const arrowY = Math.sin(arrowAngle) * (radius + 10)
    ctx.save()
    ctx.translate(arrowX, arrowY)
    ctx.rotate(arrowAngle + (direction > 0 ? Math.PI / 2 : -Math.PI / 2))
    ctx.beginPath()
    ctx.moveTo(0, -5)
    ctx.lineTo(4, 4)
    ctx.lineTo(-4, 4)
    ctx.closePath()
    ctx.fillStyle = spinColor
    ctx.fill()
    ctx.restore()
  }

  ctx.rotate(angle)

  for (let i = 0; i < 6; i++) {
    const bladeAngle = (i / 6) * Math.PI * 2
    const inner = 4
    const outer = i === 0 ? radius + 3 : radius
    ctx.save()
    ctx.rotate(bladeAngle)
    ctx.strokeStyle = i === 0 ? spinColor : 'rgba(247, 200, 106, 0.9)'
    ctx.lineWidth = i === 0 ? 4 : 2.1
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(inner, 0)
    ctx.lineTo(outer, 0)
    ctx.stroke()
    ctx.restore()
  }

  ctx.beginPath()
  ctx.arc(radius + 4, 0, 4.6, 0, Math.PI * 2)
  ctx.fillStyle = spinColor
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.86)'
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, 4.3, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()

  ctx.restore()
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  w: number,
  h: number
) {
  ctx.save()

  let spacing = 1
  if (vp.scale < 20) spacing = 5
  else if (vp.scale < 50) spacing = 2

  const halfW = w / 2 / vp.scale
  const halfH = h / 2 / vp.scale
  const xMin = Math.floor((vp.center.x - halfW) / spacing) * spacing
  const xMax = Math.ceil((vp.center.x + halfW) / spacing) * spacing
  const yMin = Math.floor((vp.center.y - halfH) / spacing) * spacing
  const yMax = Math.ceil((vp.center.y + halfH) / spacing) * spacing

  for (let x = xMin; x <= xMax; x += spacing) {
    const sx = (x - vp.center.x) * vp.scale + w / 2
    const isMajor = Math.abs(x % (spacing * 5)) < 1e-8
    ctx.strokeStyle = isMajor ? 'rgba(125, 155, 205, 0.13)' : 'rgba(125, 155, 205, 0.065)'
    ctx.lineWidth = isMajor ? 0.8 : 0.5
    ctx.beginPath()
    ctx.moveTo(sx, 0)
    ctx.lineTo(sx, h)
    ctx.stroke()
  }

  for (let y = yMin; y <= yMax; y += spacing) {
    const sy = h / 2 - (y - vp.center.y) * vp.scale
    const isMajor = Math.abs(y % (spacing * 5)) < 1e-8
    ctx.strokeStyle = isMajor ? 'rgba(125, 155, 205, 0.13)' : 'rgba(125, 155, 205, 0.065)'
    ctx.lineWidth = isMajor ? 0.8 : 0.5
    ctx.beginPath()
    ctx.moveTo(0, sy)
    ctx.lineTo(w, sy)
    ctx.stroke()
  }

  const originX = (0 - vp.center.x) * vp.scale + w / 2
  const originY = h / 2 - (0 - vp.center.y) * vp.scale

  ctx.strokeStyle = 'rgba(172, 198, 235, 0.32)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, h)
  ctx.moveTo(0, originY)
  ctx.lineTo(w, originY)
  ctx.stroke()

  ctx.fillStyle = 'rgba(166, 190, 224, 0.48)'
  ctx.font = '10px ui-monospace, SFMono-Regular, Consolas, monospace'
  if (originY > 12 && originY < h - 8) {
    for (let x = xMin; x <= xMax; x += spacing * 5) {
      if (Math.abs(x) < 1e-8) continue
      const sx = (x - vp.center.x) * vp.scale + w / 2
      if (sx > 16 && sx < w - 16) ctx.fillText(String(x), sx + 4, originY - 5)
    }
  }
  if (originX > 8 && originX < w - 20) {
    for (let y = yMin; y <= yMax; y += spacing * 5) {
      if (Math.abs(y) < 1e-8) continue
      const sy = h / 2 - (y - vp.center.y) * vp.scale
      if (sy > 16 && sy < h - 8) ctx.fillText(String(y), originX + 5, sy - 4)
    }
  }

  ctx.restore()
}
