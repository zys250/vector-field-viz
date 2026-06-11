/**
 * 2D 向量场箭头网格渲染
 * 在 canvas 上绘制等间距的箭头表示向量场
 */
import { Vec2 } from '../math/Vector2'
import type { Viewport } from '../store/useSceneStore'
import { worldToScreen } from './coordinates'

/** 根据数值映射到 HSL 颜色（用于箭头着色） */
export function magnitudeToColor(magnitude: number, maxMag: number = 3): string {
  const t = Math.min(magnitude / maxMag, 1)
  const hue = 196 - t * 155
  const saturation = 88
  const lightness = 62 + t * 8
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/** 散度/旋度标量值映射到颜色 */
export function scalarToColor(value: number, maxAbs: number = 2): string {
  const t = Math.max(-1, Math.min(1, value / maxAbs))
  const alpha = 0.04 + Math.abs(t) * 0.32
  if (t > 0) return `rgba(255, 92, 122, ${alpha})`
  if (t < 0) return `rgba(62, 139, 255, ${alpha})`
  return 'rgba(20, 30, 55, 0.08)'
}

/**
 * 绘制箭头网格
 * @param ctx canvas 上下文
 * @param field 向量场函数
 * @param vp 视口
 * @param w canvas 宽度
 * @param h canvas 高度
 * @param gridSpacing 网格间距（世界坐标单位）
 */
export function drawArrowGrid(
  ctx: CanvasRenderingContext2D,
  field: (pos: Vec2) => Vec2,
  vp: Viewport,
  w: number,
  h: number,
  gridSpacing: number = 0.5
) {
  // 计算可见范围
  const halfW = (w / 2) / vp.scale
  const halfH = (h / 2) / vp.scale
  const xMin = Math.floor((vp.center.x - halfW) / gridSpacing) * gridSpacing
  const xMax = Math.ceil((vp.center.x + halfW) / gridSpacing) * gridSpacing
  const yMin = Math.floor((vp.center.y - halfH) / gridSpacing) * gridSpacing
  const yMax = Math.ceil((vp.center.y + halfH) / gridSpacing) * gridSpacing

  for (let x = xMin; x <= xMax; x += gridSpacing) {
    for (let y = yMin; y <= yMax; y += gridSpacing) {
      const pos = new Vec2(x, y)
      const vec = field(pos)
      const mag = vec.norm()
      if (mag < 0.001) continue

      drawArrow(ctx, pos, vec, vp, w, h)
    }
  }
}

/**
 * 在指定世界坐标绘制一个箭头
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  vec: Vec2,
  vp: Viewport,
  w: number,
  h: number,
  options?: {
    color?: string
    maxPixelLen?: number
    headSize?: number
    lineWidth?: number
  }
) {
  const maxLen = options?.maxPixelLen ?? 28
  const headSize = options?.headSize ?? 6
  const lw = options?.lineWidth ?? 1.5

  const mag = vec.norm()
  if (mag < 0.0001) return

  const dir = vec.scale(1 / mag)
  const screen = worldToScreen(pos, vp, w, h)

  const strength = 1 - Math.exp(-mag * 0.7)
  const pixelLen = 5 + (maxLen - 5) * strength
  const startScreen = {
    x: screen.x - dir.x * pixelLen * 0.35,
    y: screen.y + dir.y * pixelLen * 0.35,
  }
  const endScreen = {
    x: screen.x + dir.x * pixelLen * 0.65,
    y: screen.y - dir.y * pixelLen * 0.65,
  }

  const color = options?.color ?? magnitudeToColor(mag)

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lw
  ctx.lineCap = 'round'

  // 箭身
  ctx.beginPath()
  ctx.moveTo(startScreen.x, startScreen.y)
  ctx.lineTo(endScreen.x, endScreen.y)
  ctx.stroke()

  // 箭头（三角形）
  const angle = Math.atan2(-dir.y, dir.x)
  ctx.beginPath()
  ctx.moveTo(endScreen.x, endScreen.y)
  ctx.lineTo(
    endScreen.x - headSize * Math.cos(angle - Math.PI / 6),
    endScreen.y - headSize * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    endScreen.x - headSize * Math.cos(angle + Math.PI / 6),
    endScreen.y - headSize * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}
