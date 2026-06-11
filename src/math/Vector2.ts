/**
 * 2D 向量类 — 不可变设计，所有操作返回新实例
 * 用于所有 2D 向量场计算、渲染坐标变换等
 */
export class Vec2 {
  readonly x: number
  readonly y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  /** 向量加法 */
  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y)
  }

  /** 向量减法 */
  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y)
  }

  /** 标量乘法 */
  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s)
  }

  /** 点积（内积） */
  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y
  }

  /** 2D 叉积（标量）：x1*y2 - y1*x2 */
  cross(v: Vec2): number {
    return this.x * v.y - this.y * v.x
  }

  /** 向量模长 */
  norm(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  /** 模长的平方（避免开方，用于比较） */
  normSq(): number {
    return this.x * this.x + this.y * this.y
  }

  /** 归一化，零向量返回零向量 */
  normalize(): Vec2 {
    const n = this.norm()
    if (n < 1e-10) return Vec2.zero()
    return this.scale(1 / n)
  }

  /** 旋转 angle 弧度（逆时针为正） */
  rotate(angle: number): Vec2 {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c)
  }

  /** 与 x 轴正方向的夹角 */
  angle(): number {
    return Math.atan2(this.y, this.x)
  }

  /** 两点之间的距离 */
  static distance(a: Vec2, b: Vec2): number {
    return a.sub(b).norm()
  }

  /** 线性插值 */
  static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
    return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
  }

  static zero(): Vec2 {
    return new Vec2(0, 0)
  }

  /** 从极坐标创建 */
  static fromPolar(r: number, theta: number): Vec2 {
    return new Vec2(r * Math.cos(theta), r * Math.sin(theta))
  }

  /** 转换为普通对象 */
  toObject(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /** 克隆 */
  clone(): Vec2 {
    return new Vec2(this.x, this.y)
  }
}
