/**
 * 环量计算 — 绕闭合回路的环量（环路积分）
 * Γ = ∮_C F · dr = ∮_C F · t̂ ds
 *
 * 对于闭合多边形：每段使用中点法近似
 *   Γ ≈ Σ F(中点_i) · t̂_i * Δs_i
 * 其中 t̂_i 是第 i 段的单位切向量（沿积分方向）
 */
import { Vec2 } from './Vector2'
import type { Field2D } from './fields'

/** 环量计算结果 */
export interface CirculationResult {
  /** 总环量 */
  total: number
  /** 每段的贡献 */
  segments: Array<{
    start: Vec2
    end: Vec2
    midpoint: Vec2
    tangent: Vec2      // 单位切向量
    fieldAtMid: Vec2
    contribution: number  // F·t * ds
    ds: number
  }>
  /** 回路包围的面积（用鞋带公式） */
  enclosedArea: number
}

/**
 * 计算绕闭合多边形的环量
 * @param field 向量场
 * @param loop 闭合回路顶点数组（自动闭合，不需重复首点）
 * @param subdivs 每段细分数量
 */
export function computeCirculation(
  field: Field2D,
  loop: Vec2[],
  subdivs: number = 1
): CirculationResult {
  const segments: CirculationResult['segments'] = []
  let total = 0

  // 闭合回路
  const n = loop.length
  if (n < 3) {
    return { total: 0, segments: [], enclosedArea: 0 }
  }

  for (let i = 0; i < n; i++) {
    const p0 = loop[i]
    const p1 = loop[(i + 1) % n]
    const seg = p1.sub(p0)
    const segLen = seg.norm()
    if (segLen < 1e-10) continue

    // 切向量（沿回路方向）
    const tangent = seg.normalize()

    // 细分
    const subLen = segLen / subdivs
    for (let s = 0; s < subdivs; s++) {
      const t = (s + 0.5) / subdivs
      const mid = Vec2.lerp(p0, p1, t)
      const f = field(mid)
      const contrib = f.dot(tangent) * subLen
      total += contrib

      segments.push({
        start: s === 0 ? p0 : Vec2.lerp(p0, p1, s / subdivs),
        end: s === subdivs - 1 ? p1 : Vec2.lerp(p0, p1, (s + 1) / subdivs),
        midpoint: mid,
        tangent,
        fieldAtMid: f,
        contribution: contrib,
        ds: subLen,
      })
    }
  }

  // 计算包围面积（鞋带公式）
  let area = 0
  for (let i = 0; i < n; i++) {
    const p0 = loop[i]
    const p1 = loop[(i + 1) % n]
    area += p0.cross(p1)
  }
  const enclosedArea = Math.abs(area) / 2

  return { total, segments, enclosedArea }
}
