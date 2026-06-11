/**
 * 场类型定义与预设场生成器
 * 每个场函数接收位置，返回该点的向量值
 */
import { Vec2 } from './Vector2'
import { Vec3 } from './Vector3'

/** 2D 向量场：位置 → 向量 */
export type Field2D = (pos: Vec2) => Vec2

/** 3D 向量场：位置 → 向量 */
export type Field3D = (pos: Vec3) => Vec3

/** 2D 标量场：位置 → 数值 */
export type ScalarField2D = (pos: Vec2) => number

/* ========== 2D 预设场 ========== */

/** 恒定场：所有位置相同向量 */
export function constantField2D(direction: Vec2): Field2D {
  return () => direction
}

/** 辐射场（源/汇）：从 center 向外辐射，strength > 0 为源，< 0 为汇 */
export function radialField2D(center: Vec2, strength: number): Field2D {
  return (pos: Vec2) => {
    const r = pos.sub(center)
    const dist = r.norm()
    if (dist < 1e-8) return Vec2.zero()
    return r.normalize().scale(strength / dist)
  }
}

/** 旋转场：绕 center 旋转，omega 为角速度 */
export function rotationalField2D(center: Vec2, omega: number): Field2D {
  return (pos: Vec2) => {
    const r = pos.sub(center)
    // 旋转 90°: (x, y) → (-y, x)（逆时针）
    return new Vec2(-r.y, r.x).scale(omega)
  }
}

/** 线性场：F(x, y) = (ax + by + cx, dx + ey + fy) */
export function shearField2D(rate: number, base: number): Field2D {
  return (pos: Vec2) => new Vec2(base + rate * pos.y, 0)
}

export function softVortexField2D(center: Vec2, strength: number, core: number): Field2D {
  const coreSq = Math.max(0.15, core) ** 2
  return (pos: Vec2) => {
    const r = pos.sub(center)
    const scale = strength / (r.dot(r) + coreSq)
    return new Vec2(-r.y, r.x).scale(scale)
  }
}

export function linearField2D(
  a: number, b: number, cx: number,
  d: number, e: number, fy: number
): Field2D {
  return (pos: Vec2) => new Vec2(
    a * pos.x + b * pos.y + cx,
    d * pos.x + e * pos.y + fy
  )
}

/** 偶极子场（2D）：正负电荷对 */
export function dipoleField2D(center: Vec2, moment: Vec2): Field2D {
  const half = moment.scale(0.5)
  const posQ = center.add(half)   // 正电荷位置
  const negQ = center.sub(half)   // 负电荷位置
  return (pos: Vec2) => {
    const r1 = pos.sub(posQ)
    const r2 = pos.sub(negQ)
    const d1 = r1.norm()
    const d2 = r2.norm()
    if (d1 < 1e-8 || d2 < 1e-8) return Vec2.zero()
    // E = q*r̂/r²，正电荷向外，负电荷向内
    return r1.normalize().scale(1 / (d1 * d1))
      .sub(r2.normalize().scale(1 / (d2 * d2)))
  }
}

/** 组合两个场 */
export function addFields2D(a: Field2D, b: Field2D): Field2D {
  return (pos: Vec2) => a(pos).add(b(pos))
}

/** 缩放场 */
export function scaleField2D(f: Field2D, s: number): Field2D {
  return (pos: Vec2) => f(pos).scale(s)
}

/* ========== 3D 预设场 ========== */

/** 恒定场 */
export function constantField3D(direction: Vec3): Field3D {
  return () => direction
}

/** 辐射场 */
export function radialField3D(center: Vec3, strength: number): Field3D {
  return (pos: Vec3) => {
    const r = pos.sub(center)
    const dist = r.norm()
    if (dist < 1e-8) return Vec3.zero()
    return r.normalize().scale(strength / (dist * dist))
  }
}

/** 绕 z 轴旋转场 */
export function rotationalField3D(omega: number): Field3D {
  return (pos: Vec3) => new Vec3(-pos.y * omega, pos.x * omega, 0)
}

/** 3D 偶极子 */
export function dipoleField3D(center: Vec3, moment: Vec3): Field3D {
  const half = moment.scale(0.5)
  const posQ = center.add(half)
  const negQ = center.sub(half)
  return (pos: Vec3) => {
    const r1 = pos.sub(posQ)
    const r2 = pos.sub(negQ)
    const d1 = r1.norm()
    const d2 = r2.norm()
    if (d1 < 1e-8 || d2 < 1e-8) return Vec3.zero()
    return r1.normalize().scale(1 / (d1 * d1))
      .sub(r2.normalize().scale(1 / (d2 * d2)))
  }
}

/* ========== 场元数据（用于 UI 展示） ========== */

/** 2D 场预设列表 */
export interface FieldPreset2D {
  key: string
  name: string
  description: string
  formula: string
  characteristics: string[]
  create: (params: Record<string, number>) => Field2D
  defaultParams: Record<string, number>
  paramDefs: Array<{ key: string; name: string; min: number; max: number; step: number }>
}

export const FIELD_PRESETS_2D: FieldPreset2D[] = [
  {
    key: 'constant',
    name: '恒定场',
    description: '所有位置的向量都相同，大小和方向均不随位置变化',
    formula: 'F = (v_x, v_y)',
    characteristics: ['div = 0', 'curl = 0'],
    create: (p) => constantField2D(new Vec2(p.vx, p.vy)),
    defaultParams: { vx: 1, vy: 0.5 },
    paramDefs: [
      { key: 'vx', name: 'X 分量', min: -3, max: 3, step: 0.1 },
      { key: 'vy', name: 'Y 分量', min: -3, max: 3, step: 0.1 },
    ],
  },
  {
    key: 'source',
    name: '线性源 / 汇',
    description: '从中心均匀向外发散或向内汇聚，适合观察常量散度',
    formula: 'F = s(x-c_x, y-c_y)',
    characteristics: ['div = 2s', 'curl = 0'],
    create: (p) => (pos: Vec2) => pos.sub(new Vec2(p.cx, p.cy)).scale(p.strength),
    defaultParams: { cx: 0, cy: 0, strength: 0.7 },
    paramDefs: [
      { key: 'cx', name: '中心 X', min: -5, max: 5, step: 0.1 },
      { key: 'cy', name: '中心 Y', min: -5, max: 5, step: 0.1 },
      { key: 'strength', name: '发散强度 s', min: -2, max: 2, step: 0.1 },
    ],
  },
  {
    key: 'radial',
    name: '点源场（1/r）',
    description: '从中心点向外或向内辐射，强度随距离衰减，除奇点外散度为零',
    formula: 'F = s r̂ / r',
    characteristics: ['奇点源', 'curl = 0'],
    create: (p) => radialField2D(new Vec2(p.cx, p.cy), p.strength),
    defaultParams: { cx: 0, cy: 0, strength: 1 },
    paramDefs: [
      { key: 'cx', name: '中心 X', min: -5, max: 5, step: 0.1 },
      { key: 'cy', name: '中心 Y', min: -5, max: 5, step: 0.1 },
      { key: 'strength', name: '强度', min: -3, max: 3, step: 0.1 },
    ],
  },
  {
    key: 'rotational',
    name: '旋转场',
    description: '绕中心点旋转，速度与到中心的距离成正比（刚体旋转）',
    formula: 'F = ω(-y, x)',
    characteristics: ['div = 0', 'curl = 2ω'],
    create: (p) => rotationalField2D(new Vec2(p.cx, p.cy), p.omega),
    defaultParams: { cx: 0, cy: 0, omega: 1 },
    paramDefs: [
      { key: 'cx', name: '中心 X', min: -5, max: 5, step: 0.1 },
      { key: 'cy', name: '中心 Y', min: -5, max: 5, step: 0.1 },
      { key: 'omega', name: '角速度', min: -3, max: 3, step: 0.1 },
    ],
  },
  {
    key: 'shear',
    name: '剪切流',
    description: '上下层流速不同，整体不绕中心打转，但小桨轮会因为局部速度梯度而旋转',
    formula: 'F = (u + ky, 0)',
    characteristics: ['div = 0', 'curl = -k', '流体剪切'],
    create: (p) => shearField2D(p.rate, p.base),
    defaultParams: { rate: 1.2, base: 0.6 },
    paramDefs: [
      { key: 'rate', name: '剪切率 k', min: -3, max: 3, step: 0.1 },
      { key: 'base', name: '基础流速 u', min: -2, max: 2, step: 0.1 },
    ],
  },
  {
    key: 'soft-vortex',
    name: '软涡核',
    description: '旋转集中在涡核附近，离开核心后旋度快速减弱，适合理解“哪里真的在转”',
    formula: 'F = s(-y, x)/(r²+c²)',
    characteristics: ['局部 curl', 'div ≈ 0', '涡核'],
    create: (p) => softVortexField2D(new Vec2(p.cx, p.cy), p.strength, p.core),
    defaultParams: { cx: 0, cy: 0, strength: 1.4, core: 1 },
    paramDefs: [
      { key: 'cx', name: '中心 X', min: -5, max: 5, step: 0.1 },
      { key: 'cy', name: '中心 Y', min: -5, max: 5, step: 0.1 },
      { key: 'strength', name: '涡强 s', min: -4, max: 4, step: 0.1 },
      { key: 'core', name: '涡核半径 c', min: 0.2, max: 3, step: 0.1 },
    ],
  },
  {
    key: 'saddle',
    name: '鞍点场',
    description: '沿 x 方向发散、沿 y 方向汇聚，总散度与旋度都为零',
    formula: 'F = s(x, -y)',
    characteristics: ['div = 0', 'curl = 0'],
    create: (p) => (pos: Vec2) => new Vec2(pos.x, -pos.y).scale(p.strength),
    defaultParams: { strength: 0.8 },
    paramDefs: [
      { key: 'strength', name: '强度 s', min: -2, max: 2, step: 0.1 },
    ],
  },
  {
    key: 'linear',
    name: '线性场',
    description: 'F(x,y) = (ax+by+c, dx+ey+f)，最一般的线性向量场',
    formula: 'F = (ax+by+c, dx+ey+f)',
    characteristics: ['div = a + e', 'curl = d - b'],
    create: (p) => linearField2D(p.a, p.b, p.c, p.d, p.e, p.f),
    defaultParams: { a: 0, b: 1, c: 0, d: -1, e: 0, f: 0 },
    paramDefs: [
      { key: 'a', name: 'a (∂Fx/∂x)', min: -3, max: 3, step: 0.1 },
      { key: 'b', name: 'b (∂Fx/∂y)', min: -3, max: 3, step: 0.1 },
      { key: 'c', name: 'c (Fx偏置)', min: -3, max: 3, step: 0.1 },
      { key: 'd', name: 'd (∂Fy/∂x)', min: -3, max: 3, step: 0.1 },
      { key: 'e', name: 'e (∂Fy/∂y)', min: -3, max: 3, step: 0.1 },
      { key: 'f', name: 'f (Fy偏置)', min: -3, max: 3, step: 0.1 },
    ],
  },
  {
    key: 'dipole',
    name: '偶极子场',
    description: '正负电荷对的电场，远处呈偶极子特征',
    formula: 'F = F₊ + F₋',
    characteristics: ['叠加场', '含奇点'],
    create: (p) => dipoleField2D(new Vec2(p.cx, p.cy), new Vec2(p.mx, p.my)),
    defaultParams: { cx: 0, cy: 0, mx: 1, my: 0 },
    paramDefs: [
      { key: 'cx', name: '中心 X', min: -5, max: 5, step: 0.1 },
      { key: 'cy', name: '中心 Y', min: -5, max: 5, step: 0.1 },
      { key: 'mx', name: '偶极矩 X', min: -3, max: 3, step: 0.1 },
      { key: 'my', name: '偶极矩 Y', min: -3, max: 3, step: 0.1 },
    ],
  },
]
