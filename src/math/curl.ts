/**
 * 旋度计算 — 使用有限差分法
 *
 * 2D（标量旋度）: curl F = ∂F_y/∂x - ∂F_x/∂y
 *   ≈ [F_y(x+h,y) - F_y(x-h,y)] / (2h)
 *    - [F_x(x,y+h) - F_x(x,y-h)] / (2h)
 *
 * 3D（向量旋度）: curl F = ∇ × F = (∂F_z/∂y - ∂F_y/∂z,
 *                                     ∂F_x/∂z - ∂F_z/∂x,
 *                                     ∂F_y/∂x - ∂F_x/∂y)
 */
import { Vec2 } from './Vector2'
import { Vec3 } from './Vector3'
import type { Field2D, Field3D } from './fields'

const DEFAULT_H = 0.01

/**
 * 计算 2D 场的标量旋度
 * 正值 = 逆时针旋转，负值 = 顺时针旋转
 */
export function curl2D(
  field: Field2D,
  pos: Vec2,
  h: number = DEFAULT_H
): number {
  const fyRight = field(new Vec2(pos.x + h, pos.y))
  const fyLeft  = field(new Vec2(pos.x - h, pos.y))
  const fxTop   = field(new Vec2(pos.x, pos.y + h))
  const fxBottom = field(new Vec2(pos.x, pos.y - h))

  const dFy_dx = (fyRight.y - fyLeft.y) / (2 * h)
  const dFx_dy = (fxTop.x - fxBottom.x) / (2 * h)

  return dFy_dx - dFx_dy
}

/**
 * 在 2D 网格上计算旋度
 */
export function curl2DGrid(
  field: Field2D,
  xMin: number, xMax: number, nx: number,
  yMin: number, yMax: number, ny: number,
  h: number = DEFAULT_H
): { x: number; y: number; curl: number }[] {
  const result: { x: number; y: number; curl: number }[] = []
  const dx = (xMax - xMin) / (nx - 1)
  const dy = (yMax - yMin) / (ny - 1)

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const x = xMin + i * dx
      const y = yMin + j * dy
      const pos = new Vec2(x, y)
      const c = curl2D(field, pos, h)
      result.push({ x, y, curl: c })
    }
  }

  return result
}

/**
 * 计算 3D 场的向量旋度
 */
export function curl3D(
  field: Field3D,
  pos: Vec3,
  h: number = DEFAULT_H
): Vec3 {
  // ∂F_z/∂y - ∂F_y/∂z
  const fzp = field(new Vec3(pos.x, pos.y + h, pos.z))
  const fzm = field(new Vec3(pos.x, pos.y - h, pos.z))
  const fyp = field(new Vec3(pos.x, pos.y, pos.z + h))
  const fym = field(new Vec3(pos.x, pos.y, pos.z - h))
  const curlX = (fzp.z - fzm.z - fyp.y + fym.y) / (2 * h)

  // ∂F_x/∂z - ∂F_z/∂x
  const fxp = field(new Vec3(pos.x, pos.y, pos.z + h))
  const fxm = field(new Vec3(pos.x, pos.y, pos.z - h))
  const fzp2 = field(new Vec3(pos.x + h, pos.y, pos.z))
  const fzm2 = field(new Vec3(pos.x - h, pos.y, pos.z))
  const curlY = (fxp.x - fxm.x - fzp2.z + fzm2.z) / (2 * h)

  // ∂F_y/∂x - ∂F_x/∂y
  const fyp2 = field(new Vec3(pos.x + h, pos.y, pos.z))
  const fym2 = field(new Vec3(pos.x - h, pos.y, pos.z))
  const fxp2 = field(new Vec3(pos.x, pos.y + h, pos.z))
  const fxm2 = field(new Vec3(pos.x, pos.y - h, pos.z))
  const curlZ = (fyp2.y - fym2.y - fxp2.x + fxm2.x) / (2 * h)

  return new Vec3(curlX, curlY, curlZ)
}
