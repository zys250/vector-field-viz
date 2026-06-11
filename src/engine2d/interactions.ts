/**
 * 2D Canvas 交互处理 — 平移、缩放、拖拽
 */
import { Vec2 } from '../math/Vector2'
import type { Viewport } from '../store/useSceneStore'

export interface DragState {
  /** 是否正在拖拽 */
  active: boolean
  /** 拖拽类型 */
  type: 'pan' | 'charge' | 'curvePoint' | null
  /** 拖拽目标 ID */
  targetId: string | null
  /** 拖拽起点（世界坐标） */
  startWorld: Vec2
  /** 当前世界坐标 */
  currentWorld: Vec2
}

/**
 * 创建初始拖拽状态
 */
export function createDragState(): DragState {
  return {
    active: false,
    type: null,
    targetId: null,
    startWorld: Vec2.zero(),
    currentWorld: Vec2.zero(),
  }
}

/**
 * 处理滚轮缩放
 */
export function handleWheelZoom(
  vp: Viewport,
  anchor: Vec2,
  deltaY: number
): Viewport {
  const factor = deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(5, Math.min(500, vp.scale * factor))
  // 保持锚点不动
  const dx = anchor.x - vp.center.x
  const dy = anchor.y - vp.center.y
  const newCenter = new Vec2(
    anchor.x - dx * vp.scale / newScale,
    anchor.y - dy * vp.scale / newScale
  )
  return { center: newCenter, scale: newScale }
}

/**
 * 判断点是否在圆的范围内
 */
export function hitTestCircle(point: Vec2, center: Vec2, radius: number): boolean {
  return point.sub(center).norm() <= radius
}

/**
 * 判断点是否在某段附近（用于曲线顶点拖拽）
 */
export function hitTestPoint(
  point: Vec2,
  target: Vec2,
  threshold: number = 0.3
): boolean {
  return point.sub(target).norm() <= threshold
}

/**
 * 找到最近的曲线顶点
 */
export function findNearestCurvePoint(
  point: Vec2,
  curves: Array<{ id: string; points: Vec2[] }>,
  threshold: number = 0.3
): { curveId: string; pointIndex: number } | null {
  let bestDist = threshold
  let best: { curveId: string; pointIndex: number } | null = null

  for (const curve of curves) {
    for (let i = 0; i < curve.points.length; i++) {
      const dist = point.sub(curve.points[i]).norm()
      if (dist < bestDist) {
        bestDist = dist
        best = { curveId: curve.id, pointIndex: i }
      }
    }
  }

  return best
}

/**
 * 生成圆形回路的顶点
 */
export function generateCircleLoop(center: Vec2, radius: number, segments: number = 32): Vec2[] {
  const points: Vec2[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    points.push(new Vec2(
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius
    ))
  }
  return points
}
