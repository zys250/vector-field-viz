import { describe, expect, it } from 'vitest'
import { computeCirculation } from './circulation'
import { curl2D } from './curl'
import { divergence2D } from './divergence'
import { multiPlanarChargeField2D } from './electromagnetism'
import { gasVelocityField, waterVelocityField } from './fluidFields'
import { constantField2D, linearField2D, rotationalField2D, shearField2D } from './fields'
import { computeClosedFlux, computeFlux } from './flux'
import { compileExpression, gradientProjectionField } from './projection3d'
import { Vec2 } from './Vector2'

function circle(radius: number, segments = 256): Vec2[] {
  return Array.from({ length: segments }, (_, index) => {
    const angle = index / segments * Math.PI * 2
    return Vec2.fromPolar(radius, angle)
  })
}

describe('vector calculus regression checks', () => {
  it('uses the right-hand normal for an oriented open curve', () => {
    const field = constantField2D(new Vec2(0, 1))
    const curve = [new Vec2(-1, 0), new Vec2(1, 0)]

    expect(computeFlux(field, curve, 8).total).toBeCloseTo(-2, 8)
  })

  it('matches divergence theorem for a linear source field', () => {
    const sourceField = linearField2D(1, 0, 0, 0, 1, 0)
    const radius = 2

    expect(computeClosedFlux(sourceField, circle(radius), 4).total)
      .toBeCloseTo(2 * Math.PI * radius * radius, 2)
  })

  it('matches circulation of a rigid rotational field', () => {
    const rotational = rotationalField2D(Vec2.zero(), 1)
    const radius = 2

    expect(computeCirculation(rotational, circle(radius), 4).total)
      .toBeCloseTo(2 * Math.PI * radius * radius, 2)
  })

  it('computes divergence and curl of a general linear field', () => {
    const field = linearField2D(2, 3, 0, -4, 5, 0)
    const point = new Vec2(1.2, -0.7)

    expect(divergence2D(field, point)).toBeCloseTo(7, 8)
    expect(curl2D(field, point)).toBeCloseTo(-7, 8)
  })

  it('matches the 2D Gauss flux of a planar point charge', () => {
    const field = multiPlanarChargeField2D([{ pos: Vec2.zero(), q: 1 }])

    expect(computeClosedFlux(field, circle(3), 6).total).toBeCloseTo(2 * Math.PI, 3)
  })

  it('shows shear flow can have curl without rotating around a center', () => {
    const shear = shearField2D(1.5, 0.2)

    expect(divergence2D(shear, new Vec2(0.4, -0.8))).toBeCloseTo(0, 8)
    expect(curl2D(shear, new Vec2(0.4, -0.8))).toBeCloseTo(-1.5, 8)
  })

  it('keeps the water flow approximately incompressible', () => {
    const water = waterVelocityField({ speed: 1, wave: 0.8, swirl: 1.2, core: 1.1 })

    expect(divergence2D(water, new Vec2(0.7, -0.3))).toBeCloseTo(0, 4)
  })

  it('creates positive divergence in an expanding gas source', () => {
    const gas = gasVelocityField({ wind: 0, expansion: 1, sink: 0, swirl: 0, radius: 2 })

    expect(divergence2D(gas, Vec2.zero())).toBeGreaterThan(1.5)
  })

  it('projects a 3D scalar gradient onto a flat plane', () => {
    const scalar = compileExpression('x*x + y*y + z*z')
    const field = gradientProjectionField(scalar, {
      z0: 0,
      tiltX: 0,
      tiltY: 0,
      a: 1,
      b: 1,
      c: 1,
      t: 0,
    })

    const value = field(new Vec2(2, -3))
    expect(value.x).toBeCloseTo(4, 4)
    expect(value.y).toBeCloseTo(-6, 4)
  })
})
