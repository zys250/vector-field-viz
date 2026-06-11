/**
 * 散度计算 — 使用有限差分法
 *
 * 2D: div F = ∂F_x/∂x + ∂F_y/∂y
 *   ≈ [F_x(x+h,y) - F_x(x-h,y)] / (2h)
 *    + [F_y(x,y+h) - F_y(x,y-h)] / (2h)
 *
 * 3D: div F = ∂F_x/∂x + ∂F_y/∂y + ∂F_z/∂z
 */
import { Vec2 } from './Vector2'
import { Vec3 } from './Vector3'
import type { Field2D, Field3D } from './fields'

/** 默认差分步长 */
const DEFAULT_H = 0.01

/**
 * 计算 2D 场在指定点的散度（标量）
 */
export function divergence2D(
  field: Field2D,
  pos: Vec2,
  h: number = DEFAULT_H
): number {
  const fxRight = field(new Vec2(pos.x + h, pos.y))
  const fxLeft  = field(new Vec2(pos.x - h, pos.y))
  const fyTop   = field(new Vec2(pos.x, pos.y + h))
  const fyBottom = field(new Vec2(pos.x, pos.y - h))

  const dFx_dx = (fxRight.x - fxLeft.x) / (2 * h)
  const dFy_dy = (fyTop.y - fyBottom.y) / (2 * h)

  return dFx_dx + dFy_dy
}

/**
 * 在 2D 网格上计算散度
 * @returns 每个网格点的散度值数组
 */
export function divergence2DGrid(
  field: Field2D,
  xMin: number, xMax: number, nx: number,
  yMin: number, yMax: number, ny: number,
  h: number = DEFAULT_H
): { x: number; y: number; div: number }[] {
  const result: { x: number; y: number; div: number }[] = []
  const dx = (xMax - xMin) / (nx - 1)
  const dy = (yMax - yMin) / (ny - 1)

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const x = xMin + i * dx
      const y = yMin + j * dy
      const pos = new Vec2(x, y)
      const div = divergence2D(field, pos, h)
      result.push({ x, y, div })
    }
  }

  return result
}

/**
 * 计算 3D 场在指定点的散度
 */
export function divergence3D(
  field: Field3D,
  pos: Vec3,
  h: number = DEFAULT_H
): number {
  const fxp = field(new Vec3(pos.x + h, pos.y, pos.z))
  const fxm = field(new Vec3(pos.x - h, pos.y, pos.z))
  const fyp = field(new Vec3(pos.x, pos.y + h, pos.z))
  const fym = field(new Vec3(pos.x, pos.y - h, pos.z))
  const fzp = field(new Vec3(pos.x, pos.y, pos.z + h))
  const fzm = field(new Vec3(pos.x, pos.y, pos.z - h))

  return (fxp.x - fxm.x + fyp.y - fym.y + fzp.z - fzm.z) / (2 * h)
}
