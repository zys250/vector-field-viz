/**
 * 数值积分工具 — 中点法、梯形法、辛普森法、RK4
 */
import { Vec2 } from './Vector2'

/**
 * 中点法数值积分（一维）
 * ∫ f(x) dx ≈ Σ f((x_i + x_{i+1})/2) · Δx
 */
export function midpointIntegration(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number
): number {
  const dx = (b - a) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const mid = a + (i + 0.5) * dx
    sum += f(mid) * dx
  }
  return sum
}

/**
 * 梯形法数值积分
 */
export function trapezoidIntegration(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number
): number {
  const dx = (b - a) / n
  let sum = (f(a) + f(b)) / 2
  for (let i = 1; i < n; i++) {
    sum += f(a + i * dx)
  }
  return sum * dx
}

/**
 * 辛普森法数值积分（n 必须为偶数）
 */
export function simpsonIntegration(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number
): number {
  if (n % 2 !== 0) n += 1 // 确保偶数
  const dx = (b - a) / n
  let sum = f(a) + f(b)
  for (let i = 1; i < n; i++) {
    const x = a + i * dx
    sum += f(x) * (i % 2 === 0 ? 2 : 4)
  }
  return (sum * dx) / 3
}

/**
 * 四阶 Runge-Kutta 法（RK4）— 用于场线追踪
 * 从起点 start 沿向量场 field 积分一步
 * @param field 向量场函数
 * @param start 当前位置
 * @param h 步长
 * @param forward 是否正向积分
 * @returns 下一步位置
 */
export function rk4Step(
  field: (pos: Vec2) => Vec2,
  start: Vec2,
  h: number,
  forward: boolean = true
): Vec2 {
  const dir = forward ? 1 : -1
  const k1 = field(start).scale(dir)
  const k2 = field(start.add(k1.scale(h / 2))).scale(dir)
  const k3 = field(start.add(k2.scale(h / 2))).scale(dir)
  const k4 = field(start.add(k3.scale(h))).scale(dir)

  const dx = (k1.x + 2 * k2.x + 2 * k3.x + k4.x) * h / 6
  const dy = (k1.y + 2 * k2.y + 2 * k3.y + k4.y) * h / 6

  return new Vec2(start.x + dx, start.y + dy)
}

/**
 * 自适应步长 RK4 — 当场很强时自动缩小步长
 */
export function rk4StepAdaptive(
  field: (pos: Vec2) => Vec2,
  start: Vec2,
  baseH: number,
  forward: boolean = true,
  minH: number = 0.001,
  maxSpeed: number = 50
): Vec2 {
  const f = field(start)
  const speed = f.norm()
  // 场越强，步长越小
  const h = speed > 1 ? Math.max(baseH / speed, minH) : baseH
  // 截断过长的步
  const clampedH = Math.min(h, maxSpeed * baseH)
  return rk4Step(field, start, clampedH, forward)
}
