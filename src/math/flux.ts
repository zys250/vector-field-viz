/**
 * 通量计算 — 通过 2D 曲线的通量（线积分）
 * Φ = ∫_C F · n̂ ds
 *
 * 对于折线：每段使用中点法近似
 *   Φ ≈ Σ F(中点_i) · n̂_i * Δs_i
 * 其中 n̂_i 是第 i 段的单位法向量（取曲线行进方向的右侧）
 * 对逆时针闭合曲线而言，该法向量指向外侧。
 */
import { Vec2 } from './Vector2'
import type { Field2D } from './fields'

/** 通量计算结果 */
export interface FluxResult {
  /** 总通量 */
  total: number
  /** 每段的贡献 */
  segments: Array<{
    start: Vec2
    end: Vec2
    midpoint: Vec2
    normal: Vec2       // 单位法向量
    fieldAtMid: Vec2
    contribution: number  // F·n * ds
    ds: number
  }>
}

/**
 * 计算通过折线的通量
 * @param field 向量场
 * @param curve 折线顶点数组（至少 2 个点）
 * @param subdivs 每段的细分数量（提高精度）
 */
export function computeFlux(
  field: Field2D,
  curve: Vec2[],
  subdivs: number = 1
): FluxResult {
  const segments: FluxResult['segments'] = []
  let total = 0

  for (let i = 0; i < curve.length - 1; i++) {
    const p0 = curve[i]
    const p1 = curve[i + 1]
    const seg = p1.sub(p0)
    const segLen = seg.norm()
    if (segLen < 1e-10) continue

    // 右法向量：对逆时针闭合曲线指向外侧
    const normal = new Vec2(seg.y, -seg.x).normalize()

    // 细分以提高精度
    const subLen = segLen / subdivs
    for (let s = 0; s < subdivs; s++) {
      const t = (s + 0.5) / subdivs
      const mid = Vec2.lerp(p0, p1, t)
      const f = field(mid)
      const contrib = f.dot(normal) * subLen
      total += contrib

      segments.push({
        start: s === 0 ? p0 : Vec2.lerp(p0, p1, s / subdivs),
        end: s === subdivs - 1 ? p1 : Vec2.lerp(p0, p1, (s + 1) / subdivs),
        midpoint: mid,
        normal,
        fieldAtMid: f,
        contribution: contrib,
        ds: subLen,
      })
    }
  }

  return { total, segments }
}

/**
 * 计算通过闭合曲线的通量（用于验证散度定理/高斯定理）
 */
export function computeClosedFlux(
  field: Field2D,
  curve: Vec2[],
  subdivs: number = 1
): FluxResult {
  // 确保曲线闭合
  const closed = curve.length >= 3
    ? [...curve, curve[0]]
    : curve
  return computeFlux(field, closed, subdivs)
}
