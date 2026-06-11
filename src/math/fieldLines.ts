/**
 * 场线追踪 — 使用 RK4 从种子点双向追踪流线
 */
import { Vec2 } from './Vector2'
import type { Field2D } from './fields'
import { rk4StepAdaptive } from './numerical'

/**
 * 从种子点追踪一条场线
 * @param field 向量场
 * @param seed 种子点
 * @param stepSize 步长
 * @param maxSteps 最大步数（每个方向）
 * @param maxLength 场线最大总长度（防止跑出界外太远）
 * @returns 场线上的点序列
 */
export function traceFieldLine(
  field: Field2D,
  seed: Vec2,
  stepSize: number = 0.1,
  maxSteps: number = 200,
  maxLength: number = 20
): Vec2[] {
  // 正向追踪
  const forward: Vec2[] = []
  let pos = seed
  for (let i = 0; i < maxSteps; i++) {
    const next = rk4StepAdaptive(field, pos, stepSize, true)
    forward.push(next)
    if (next.sub(seed).norm() > maxLength) break
    // 如果场近乎为零，停止
    if (field(next).norm() < 1e-6) break
    pos = next
  }

  // 反向追踪
  const backward: Vec2[] = []
  pos = seed
  for (let i = 0; i < maxSteps; i++) {
    const next = rk4StepAdaptive(field, pos, stepSize, false)
    backward.push(next)
    if (next.sub(seed).norm() > maxLength) break
    if (field(next).norm() < 1e-6) break
    pos = next
  }

  // 合并：反向（逆序）+ 种子点 + 正向
  return [...backward.reverse(), seed, ...forward]
}

/**
 * 生成均匀分布的种子点（沿边界和内部网格）
 * @param bounds [xMin, xMax, yMin, yMax]
 * @param spacing 种子点间距
 */
export function generateSeeds(
  bounds: [number, number, number, number],
  spacing: number = 1
): Vec2[] {
  const [xMin, xMax, yMin, yMax] = bounds
  const seeds: Vec2[] = []

  // 内部网格
  for (let x = xMin; x <= xMax; x += spacing) {
    for (let y = yMin; y <= yMax; y += spacing) {
      seeds.push(new Vec2(x, y))
    }
  }

  return seeds
}

/**
 * 生成沿边界的种子点
 */
export function generateBoundarySeeds(
  bounds: [number, number, number, number],
  count: number = 40
): Vec2[] {
  const [xMin, xMax, yMin, yMax] = bounds
  const seeds: Vec2[] = []
  const w = xMax - xMin
  const h = yMax - yMin
  const perimeter = count

  // 上下边
  for (let i = 0; i <= perimeter / 4; i++) {
    const x = xMin + (w * i) / (perimeter / 4)
    seeds.push(new Vec2(x, yMin))
    seeds.push(new Vec2(x, yMax))
  }
  // 左右边
  for (let i = 1; i < perimeter / 4; i++) {
    const y = yMin + (h * i) / (perimeter / 4)
    seeds.push(new Vec2(xMin, y))
    seeds.push(new Vec2(xMax, y))
  }

  return seeds
}
