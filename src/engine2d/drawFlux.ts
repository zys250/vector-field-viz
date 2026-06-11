/**
 * 通量可视化绘制 — 高亮曲线及法向量分量
 */
import { Vec2 } from '../math/Vector2'
import type { Field2D } from '../math/fields'
import { computeClosedFlux, computeFlux } from '../math/flux'
import type { Viewport } from '../store/useSceneStore'
import { worldToScreen } from './coordinates'

interface FluxVisualOptions {
  closed?: boolean
  drawPoints?: boolean
  lineWidth?: number
}

/**
 * 绘制通量可视化
 * @param ctx
 * @param field 向量场
 * @param curve 曲线顶点
 * @param vp 视口
 * @param w canvas 宽
 * @param h canvas 高
 * @returns 总通量值
 */
export function drawFluxVisual(
  ctx: CanvasRenderingContext2D,
  field: Field2D,
  curve: Vec2[],
  vp: Viewport,
  w: number,
  h: number,
  options: FluxVisualOptions = {}
): number {
  if (curve.length < 2) return 0

  const result = options.closed
    ? computeClosedFlux(field, curve, 4)
    : computeFlux(field, curve, 4)

  ctx.save()

  // 绘制曲线段，颜色编码通量贡献
  for (const seg of result.segments) {
    const p0 = worldToScreen(seg.start, vp, w, h)
    const p1 = worldToScreen(seg.end, vp, w, h)

    // 颜色：绿 = 正贡献，红 = 负贡献
    const maxContrib = 1.0
    const t = Math.max(-1, Math.min(1, seg.contribution / maxContrib))
    let color: string
    if (t >= 0) {
      // 绿色：F·n > 0，向外
      color = `rgba(34, 197, 94, ${0.4 + t * 0.6})`
    } else {
      // 红色：F·n < 0，向内
      color = `rgba(239, 68, 68, ${0.4 - t * 0.6})`
    }

    ctx.strokeStyle = color
    ctx.lineWidth = options.lineWidth ?? 3
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.stroke()

    // 绘制法向量
    const mid = worldToScreen(seg.midpoint, vp, w, h)
    const normalComponent = seg.ds > 0 ? seg.contribution / seg.ds : 0
    const normalLen = Math.max(-34, Math.min(34, normalComponent * vp.scale * 0.35))
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mid.x, mid.y)
    const nx = normalLen * seg.normal.x
    const ny = -normalLen * seg.normal.y // canvas y 翻转
    ctx.lineTo(mid.x + nx, mid.y + ny)
    ctx.stroke()
  }

  if (options.drawPoints !== false) {
    for (let i = 0; i < curve.length; i++) {
      const pt = worldToScreen(curve[i], vp, w, h)
      ctx.fillStyle = i === 0 ? '#47c8ff' : i === curve.length - 1 ? '#f7c86a' : '#a9b8d6'
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#f7fbff'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  ctx.restore()

  return result.total
}
