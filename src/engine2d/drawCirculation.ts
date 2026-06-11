/**
 * 环量可视化绘制 — 闭合回路 + 切向量分量 + 流动粒子
 */
import { Vec2 } from '../math/Vector2'
import type { Field2D } from '../math/fields'
import { computeCirculation } from '../math/circulation'
import type { Viewport } from '../store/useSceneStore'
import { worldToScreen } from './coordinates'

/**
 * 绘制环量可视化
 * @returns 总环量值和包围面积
 */
export function drawCirculationVisual(
  ctx: CanvasRenderingContext2D,
  field: Field2D,
  loop: Vec2[],
  vp: Viewport,
  w: number,
  h: number,
  particles: Array<{ pos: Vec2; t: number }>,
  dt: number
): { total: number; area: number } {
  if (loop.length < 3) return { total: 0, area: 0 }

  const result = computeCirculation(field, loop, 4)

  ctx.save()

  // 绘制回路内部填充（半透明）
  ctx.beginPath()
  const firstPt = worldToScreen(loop[0], vp, w, h)
  ctx.moveTo(firstPt.x, firstPt.y)
  for (let i = 1; i < loop.length; i++) {
    const pt = worldToScreen(loop[i], vp, w, h)
    ctx.lineTo(pt.x, pt.y)
  }
  ctx.closePath()
  // 根据环量正负着色
  const absCirc = Math.abs(result.total)
  const maxCirc = 5
  const alpha = Math.min(0.2, absCirc / maxCirc * 0.2)
  if (result.total > 0) {
    ctx.fillStyle = `rgba(34, 197, 94, ${alpha})` // CCW = 绿
  } else {
    ctx.fillStyle = `rgba(239, 68, 68, ${alpha})` // CW = 红
  }
  ctx.fill()

  // 绘制回路边
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 2
  ctx.stroke()

  // 绘制切向量分量
  for (const seg of result.segments) {
    const mid = worldToScreen(seg.midpoint, vp, w, h)

    // 切向量
    const tangentLen = seg.contribution * vp.scale * 2
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)' // 金色
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(mid.x, mid.y)
    ctx.lineTo(mid.x + seg.tangent.x * tangentLen, mid.y - seg.tangent.y * tangentLen)
    ctx.stroke()
  }

  // 绘制控制点
  for (const pt of loop) {
    const sp = worldToScreen(pt, vp, w, h)
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  const totalLen = computeLoopLength(loop)

  // 更新和绘制流动粒子
  for (const p of particles) {
    // 沿回路移动粒子
    if (totalLen < 0.001) continue

    const f = field(p.pos)
    const tangent = getLoopTangent(loop, p.t)
    const speed = f.dot(tangent) * 0.5
    p.t = (p.t + speed * dt / totalLen) % 1
    if (p.t < 0) p.t += 1
    p.pos = pointOnLoop(loop, p.t)

    const sp = worldToScreen(p.pos, vp, w, h)
    ctx.fillStyle = speed > 0 ? '#22d3ee' : '#f59e0b'
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()

  return { total: result.total, area: result.enclosedArea }
}

/** 计算回路总长度 */
function computeLoopLength(loop: Vec2[]): number {
  let len = 0
  for (let i = 0; i < loop.length; i++) {
    const next = loop[(i + 1) % loop.length]
    len += loop[i].sub(next).norm()
  }
  return len
}

/** 获取回路上参数 t ∈ [0,1) 处的点 */
function pointOnLoop(loop: Vec2[], t: number): Vec2 {
  const totalLen = computeLoopLength(loop)
  const target = t * totalLen
  let accumulated = 0

  for (let i = 0; i < loop.length; i++) {
    const next = loop[(i + 1) % loop.length]
    const segLen = loop[i].sub(next).norm()
    if (accumulated + segLen >= target) {
      const localT = (target - accumulated) / segLen
      return Vec2.lerp(loop[i], next, localT)
    }
    accumulated += segLen
  }

  return loop[0]
}

/** 获取回路上参数 t 处的切向量 */
function getLoopTangent(loop: Vec2[], t: number): Vec2 {
  const totalLen = computeLoopLength(loop)
  const target = t * totalLen
  let accumulated = 0

  for (let i = 0; i < loop.length; i++) {
    const next = loop[(i + 1) % loop.length]
    const segLen = loop[i].sub(next).norm()
    if (accumulated + segLen >= target) {
      return next.sub(loop[i]).normalize()
    }
    accumulated += segLen
  }

  return loop[1].sub(loop[0]).normalize()
}

/** 初始化环量粒子 */
export function createCirculationParticles(loop: Vec2[], count: number = 20): Array<{ pos: Vec2; t: number }> {
  const particles: Array<{ pos: Vec2; t: number }> = []
  for (let i = 0; i < count; i++) {
    const t = i / count
    particles.push({ pos: pointOnLoop(loop, t), t })
  }
  return particles
}
