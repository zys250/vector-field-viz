/**
 * 2D 场线/流线渲染 — 密度感知，避免重叠
 *
 * 策略：
 * 1. 使用均匀内部网格种子点（而非边界种子），避免场线汇聚到同一点
 * 2. 追踪前检查种子点是否太靠近已有场线（密度控制）
 * 3. 在场线上每隔一段绘制方向箭头
 */
import { Vec2 } from '../math/Vector2'
import type { Field2D } from '../math/fields'
import { traceFieldLine } from '../math/fieldLines'
import type { Viewport } from '../store/useSceneStore'
import { worldToScreen } from './coordinates'

/** 已追踪场线的采样点集合（用于密度检测） */
interface TracedLines {
  samples: Vec2[]
}

/**
 * 判断点是否太靠近已有场线
 */
function isTooClose(point: Vec2, traced: TracedLines, threshold: number): boolean {
  for (const s of traced.samples) {
    if (point.sub(s).normSq() < threshold * threshold) return true
  }
  return false
}

/**
 * 在场线上采样并注册到 traced
 */
function registerLine(line: Vec2[], traced: TracedLines, sampleEvery: number = 3) {
  for (let i = 0; i < line.length; i += sampleEvery) {
    traced.samples.push(line[i])
  }
  // 限制总采样点数
  if (traced.samples.length > 3000) {
    traced.samples = traced.samples.slice(-2000)
  }
}

/**
 * 绘制场线（密度感知版）
 */
export function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  field: Field2D,
  vp: Viewport,
  w: number,
  h: number,
  options?: {
    color?: string
    lineWidth?: number
    spacing?: number    // 种子点间距（世界单位）
    maxSteps?: number
    drawArrows?: boolean
    arrowInterval?: number  // 每隔多少步画箭头
    densityThreshold?: number
    maxLines?: number
  }
) {
  const color = options?.color ?? 'rgba(99, 102, 241, 0.35)'
  const lw = options?.lineWidth ?? 1
  const spacing = options?.spacing ?? 1.0
  const maxSteps = options?.maxSteps ?? 400
  const drawArrows = options?.drawArrows ?? false
  const arrowInterval = options?.arrowInterval ?? 15
  const densityThreshold = options?.densityThreshold ?? spacing * 0.7
  const maxLines = options?.maxLines ?? 60

  // 计算可见范围
  const halfW = (w / 2) / vp.scale
  const halfH = (h / 2) / vp.scale
  const xMin = vp.center.x - halfW
  const xMax = vp.center.x + halfW
  const yMin = vp.center.y - halfH
  const yMax = vp.center.y + halfH

  // 生成均匀内部网格种子点
  const seeds: Vec2[] = []
  for (let x = xMin; x <= xMax; x += spacing) {
    for (let y = yMin; y <= yMax; y += spacing) {
      seeds.push(new Vec2(x, y))
    }
  }

  const traced: TracedLines = { samples: [] }
  let lineCount = 0

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const seed of seeds) {
    if (lineCount >= maxLines) break

    // 密度检查：跳过太靠近已有场线的种子
    if (isTooClose(seed, traced, densityThreshold)) continue

    // 追踪场线
    const line = traceFieldLine(field, seed, 0.08, maxSteps, 15)
    if (line.length < 3) continue

    // 注册到场线集合
    registerLine(line, traced, 5)
    lineCount++

    // 绘制场线
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.beginPath()
    const first = worldToScreen(line[0], vp, w, h)
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < line.length; i++) {
      const pt = worldToScreen(line[i], vp, w, h)
      ctx.lineTo(pt.x, pt.y)
    }
    ctx.stroke()

    // 绘制方向箭头
    if (drawArrows) {
      ctx.fillStyle = color.replace('0.35', '0.7').replace('0.45', '0.8')
      for (let i = arrowInterval; i < line.length - arrowInterval; i += arrowInterval) {
        const curr = line[i]
        const next = line[i + 1]
        const dir = next.sub(curr)
        const mag = dir.norm()
        if (mag < 0.001) continue
        const ndir = dir.scale(1 / mag)
        const sp = worldToScreen(curr, vp, w, h)
        const angle = Math.atan2(-ndir.y, ndir.x)

        ctx.save()
        ctx.translate(sp.x, sp.y)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(5, 0)
        ctx.lineTo(-3, -3)
        ctx.lineTo(-3, 3)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
    }
  }

  ctx.restore()
}
