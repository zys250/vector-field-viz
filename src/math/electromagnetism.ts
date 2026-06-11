/**
 * 电磁学公式 — 电场、磁场计算
 *
 * 库仑定律: E = kQ/r² * r̂
 * 毕奥-萨伐尔定律: B = μ₀I/(2πr) * φ̂（无限长直导线）
 * 螺线管内部: B = μ₀nI（均匀）
 */
import { Vec2 } from './Vector2'
import { Vec3 } from './Vector3'
import type { Field2D, Field3D } from './fields'

/** 库仑常数 k = 1/(4πε₀) */
const K = 1

/**
 * 单个点电荷的电场（2D）
 * E = kQ/r² * r̂
 * @param chargePos 电荷位置
 * @param charge 电荷量（正=向外，负=向内）
 */
export function coulombField2D(chargePos: Vec2, charge: number): Field2D {
  return (pos: Vec2) => {
    const r = pos.sub(chargePos)
    const dist = r.norm()
    if (dist < 0.05) return Vec2.zero() // 避免奇点
    return r.normalize().scale(K * charge / (dist * dist))
  }
}

/**
 * 多个点电荷的叠加电场（2D）
 */
export function multiChargeField2D(
  charges: Array<{ pos: Vec2; q: number }>
): Field2D {
  return (pos: Vec2) => {
    let result = Vec2.zero()
    for (const c of charges) {
      const r = pos.sub(c.pos)
      const dist = r.norm()
      if (dist < 0.05) continue
      result = result.add(r.normalize().scale(K * c.q / (dist * dist)))
    }
    return result
  }
}

/**
 * 二维静电类比中的点电荷场。
 * E = kQ/r * r̂ = kQ r/r²，因此闭合曲线通量为 2πkQ。
 */
export function planarChargeField2D(chargePos: Vec2, charge: number): Field2D {
  return (pos: Vec2) => {
    const r = pos.sub(chargePos)
    const distSq = r.normSq()
    if (distSq < 0.0025) return Vec2.zero()
    return r.scale(K * charge / distSq)
  }
}

/**
 * 多个二维点电荷的叠加场。
 */
export function multiPlanarChargeField2D(
  charges: Array<{ pos: Vec2; q: number }>
): Field2D {
  return (pos: Vec2) => {
    let result = Vec2.zero()
    for (const charge of charges) {
      const r = pos.sub(charge.pos)
      const distSq = r.normSq()
      if (distSq < 0.0025) continue
      result = result.add(r.scale(K * charge.q / distSq))
    }
    return result
  }
}

/**
 * 单个点电荷的电场（3D）
 */
export function coulombField3D(chargePos: Vec3, charge: number): Field3D {
  return (pos: Vec3) => {
    const r = pos.sub(chargePos)
    const dist = r.norm()
    if (dist < 0.1) return Vec3.zero()
    return r.normalize().scale(K * charge / (dist * dist))
  }
}

/**
 * 多个点电荷的叠加电场（3D）
 */
export function multiChargeField3D(
  charges: Array<{ pos: Vec3; q: number }>
): Field3D {
  return (pos: Vec3) => {
    let result = Vec3.zero()
    for (const c of charges) {
      const r = pos.sub(c.pos)
      const dist = r.norm()
      if (dist < 0.1) continue
      result = result.add(r.normalize().scale(K * c.q / (dist * dist)))
    }
    return result
  }
}

/**
 * 无限长直导线磁场（2D 横截面）
 * B = μ₀I/(2πr) * φ̂（方位角方向）
 * 在 2D 中：如果电流沿 +z 方向（出屏幕），则 B 绕逆时针
 *           即 B = (μ₀I/(2πr)) * (-y/r, x/r) = μ₀I/(2πr²) * (-y, x)
 * @param wirePos 导线在 2D 横截面中的位置
 * @param current 电流（正=出屏幕，负=入屏幕）
 */
export function wireBField2D(wirePos: Vec2, current: number): Field2D {
  const mu0_over_2pi = 1 // 简化常数
  return (pos: Vec2) => {
    const r = pos.sub(wirePos)
    const distSq = r.normSq()
    if (distSq < 0.01) return Vec2.zero()
    // (-y, x) / r² = 方位角方向
    return new Vec2(-r.y, r.x).scale(mu0_over_2pi * current / distSq)
  }
}

/**
 * 螺线管轴线上的磁场（3D）
 * 理想螺线管内部 B = μ₀nI，沿轴线方向
 * 简化模型：沿 z 轴的螺线管，内部近似均匀
 * @param axisStart 轴线起点
 * @param axisEnd 轴线终点
 * @param radius 螺线管半径
 * @param nI 安匝数（匝密度 × 电流）
 */
export function solenoidField3D(
  axisStart: Vec3,
  axisEnd: Vec3,
  radius: number,
  nI: number
): Field3D {
  const axisDir = axisEnd.sub(axisStart).normalize()
  const axisLen = axisEnd.sub(axisStart).norm()
  const mu0 = 1 // 简化常数

  return (pos: Vec3) => {
    // 计算点在轴线上的投影
    const rel = pos.sub(axisStart)
    const t = rel.dot(axisDir)
    const closestOnAxis = axisStart.add(axisDir.scale(t))
    const radialVec = pos.sub(closestOnAxis)
    const radialDist = radialVec.norm()

    // 判断是否在螺线管内部
    const inside = t >= 0 && t <= axisLen && radialDist < radius

    if (inside) {
      // 内部：近似均匀场 B = μ₀nI
      return axisDir.scale(mu0 * nI)
    } else {
      // 外部：简化为偶极子近似
      // 此处返回零场的简化处理——完整偶极子公式更复杂
      if (radialDist < 0.01) return Vec3.zero()
      // 外部场近似为磁偶极子
      const mid = axisStart.add(axisEnd).scale(0.5)
      const r = pos.sub(mid)
      const dist = r.norm()
      if (dist < 0.1) return Vec3.zero()
      const m = axisDir.scale(mu0 * nI * Math.PI * radius * radius * axisLen)
      const rHat = r.normalize()
      const mDotR = m.dot(rHat)
      return rHat.scale(3 * mDotR).sub(m).scale(1 / (dist * dist * dist))
    }
  }
}

/**
 * 电偶极子电势（标量场，2D）
 * V = k p·r̂ / r²
 */
export function dipolePotential2D(
  center: Vec2,
  moment: Vec2
): (pos: Vec2) => number {
  return (pos: Vec2) => {
    const r = pos.sub(center)
    const dist = r.norm()
    if (dist < 0.05) return 0
    return K * moment.dot(r) / (dist * dist * dist)
  }
}

/**
 * 变化磁通量下的感应电动势（法拉第定律）
 * ε = -dΦ_B/dt
 *
 * 模拟：给定磁通量变化率，计算感应电场方向
 * 对于圆形回路，感应电场沿回路切线方向
 * @param loopCenter 回路中心
 * @param loopRadius 回路半径
 * @param dFluxDt 磁通量变化率
 */
export function inducedEField2D(
  loopCenter: Vec2,
  loopRadius: number,
  dFluxDt: number
): Field2D {
  return (pos: Vec2) => {
    const r = pos.sub(loopCenter)
    const dist = r.norm()
    if (dist < 0.01) return Vec2.zero()
    // 感应电场沿切线方向，大小 = |dΦ/dt| / (2πr)（回路内部）
    // 方向由楞次定律决定：感应电场反抗磁通量变化
    const inside = dist < loopRadius
    if (!inside) return Vec2.zero()
    const tangent = new Vec2(-r.y, r.x).normalize()
    // ε = -dΦ/dt，负号表示反抗
    return tangent.scale(-dFluxDt * dist / (2 * Math.PI * loopRadius * loopRadius))
  }
}
