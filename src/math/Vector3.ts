/**
 * 3D 向量类 — 不可变设计
 * 用于 3D 向量场计算和 Three.js 坐标交互
 */
export class Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number

  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }

  /** 向量加法 */
  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z)
  }

  /** 向量减法 */
  sub(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z)
  }

  /** 标量乘法 */
  scale(s: number): Vec3 {
    return new Vec3(this.x * s, this.y * s, this.z * s)
  }

  /** 点积 */
  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  /** 3D 叉积 */
  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    )
  }

  /** 模长 */
  norm(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }

  /** 模长平方 */
  normSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z
  }

  /** 归一化 */
  normalize(): Vec3 {
    const n = this.norm()
    if (n < 1e-10) return Vec3.zero()
    return this.scale(1 / n)
  }

  /** 两点距离 */
  static distance(a: Vec3, b: Vec3): number {
    return a.sub(b).norm()
  }

  static zero(): Vec3 {
    return new Vec3(0, 0, 0)
  }

  /** 转换为普通对象 */
  toObject(): { x: number; y: number; z: number } {
    return { x: this.x, y: this.y, z: this.z }
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z)
  }
}
