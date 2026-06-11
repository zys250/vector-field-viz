import { Vec2 } from '../math/Vector2'
import type { Viewport } from '../store/useSceneStore'
import { worldToScreen } from './coordinates'

export function drawScalarHeatmap(
  ctx: CanvasRenderingContext2D,
  sampler: (pos: Vec2) => number,
  viewport: Viewport,
  width: number,
  height: number,
  options: {
    grid?: number
    maxAbs?: number
    color?: (value: number, maxAbs: number) => string
  } = {}
) {
  const grid = options.grid ?? 34
  const halfW = width / 2 / viewport.scale
  const halfH = height / 2 / viewport.scale
  const xMin = viewport.center.x - halfW
  const xMax = viewport.center.x + halfW
  const yMin = viewport.center.y - halfH
  const yMax = viewport.center.y + halfH
  const samples: Array<{ pos: Vec2; value: number }> = []
  let maxAbs = options.maxAbs ?? 0

  for (let ix = 0; ix < grid; ix++) {
    for (let iy = 0; iy < grid; iy++) {
      const x = xMin + (xMax - xMin) * ix / (grid - 1)
      const y = yMin + (yMax - yMin) * iy / (grid - 1)
      const pos = new Vec2(x, y)
      const value = sampler(pos)
      samples.push({ pos, value })
      if (!options.maxAbs) maxAbs = Math.max(maxAbs, Math.abs(value))
    }
  }

  maxAbs = Math.max(maxAbs, 0.001)
  const cellW = width / (grid - 1)
  const cellH = height / (grid - 1)
  const color = options.color ?? signedHeatColor

  ctx.save()
  for (const sample of samples) {
    const screen = worldToScreen(sample.pos, viewport, width, height)
    ctx.fillStyle = color(sample.value, maxAbs)
    ctx.fillRect(screen.x - cellW / 2, screen.y - cellH / 2, cellW + 1, cellH + 1)
  }
  ctx.restore()
}

export function signedHeatColor(value: number, maxAbs: number): string {
  const t = Math.max(-1, Math.min(1, value / maxAbs))
  const alpha = 0.05 + Math.abs(t) * 0.3
  if (t > 0) return `rgba(255, 104, 128, ${alpha})`
  if (t < 0) return `rgba(62, 139, 255, ${alpha})`
  return 'rgba(20, 30, 55, 0.08)'
}

export function speedHeatColor(value: number, maxAbs: number): string {
  const t = Math.max(0, Math.min(1, value / maxAbs))
  return `rgba(${Math.round(40 + t * 60)}, ${Math.round(130 + t * 90)}, 255, ${0.05 + t * 0.28})`
}
