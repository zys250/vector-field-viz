import { Vec2 } from './Vector2'
import type { Field2D } from './fields'
import type { RenderBudget } from '../runtime/renderBudget'

export interface WaterFlowParams {
  speed: number
  wave: number
  swirl: number
  core: number
}

export interface GasFlowParams {
  wind: number
  expansion: number
  sink: number
  swirl: number
  radius: number
}

export interface FlowParticle {
  pos: Vec2
  age: number
  seed: number
}

export function waterVelocityField({
  speed,
  wave,
  swirl,
  core,
}: WaterFlowParams): Field2D {
  const waveX = 1.15
  const waveY = 0.85
  const coreSq = Math.max(0.2, core) ** 2

  return (pos: Vec2) => {
    const gaussian = Math.exp(-pos.dot(pos) / (2 * coreSq))
    const vx = speed
      + wave * waveY * Math.sin(waveX * pos.x) * Math.cos(waveY * pos.y)
      - swirl * pos.y * gaussian / coreSq
    const vy = -wave * waveX * Math.cos(waveX * pos.x) * Math.sin(waveY * pos.y)
      + swirl * pos.x * gaussian / coreSq
    return new Vec2(vx, vy)
  }
}

export function gasVelocityField({
  wind,
  expansion,
  sink,
  swirl,
  radius,
}: GasFlowParams): Field2D {
  const sigmaSq = Math.max(0.5, radius) ** 2

  return (pos: Vec2) => {
    const sourceFalloff = Math.exp(-pos.dot(pos) / (2 * sigmaSq))
    const sinkPos = new Vec2(2.4, -1.2)
    const sinkR = pos.sub(sinkPos)
    const sinkFalloff = Math.exp(-sinkR.dot(sinkR) / (2 * sigmaSq))
    const source = pos.scale(expansion * sourceFalloff)
    const compression = sinkR.scale(-sink * sinkFalloff)
    const circulation = new Vec2(-pos.y, pos.x).scale(swirl * sourceFalloff)
    return new Vec2(wind, 0).add(source).add(compression).add(circulation)
  }
}

export function createFlowParticles(countOrBudget: number | Pick<RenderBudget, 'particleCount'>, spread: number): FlowParticle[] {
  const count = typeof countOrBudget === 'number' ? countOrBudget : countOrBudget.particleCount
  return Array.from({ length: count }, (_, index) => {
    const t = index / count
    const lane = (index * 37) % count / count
    return {
      pos: new Vec2((t - 0.5) * spread * 2, (lane - 0.5) * spread * 1.5),
      age: t * 4,
      seed: index,
    }
  })
}

export function advectFlowParticles(
  particles: FlowParticle[],
  field: Field2D,
  dt: number,
  bounds: { x: number; y: number }
) {
  const maxX = bounds.x
  const maxY = bounds.y

  for (const particle of particles) {
    const velocity = field(particle.pos)
    particle.pos = particle.pos.add(velocity.scale(dt))
    particle.age += dt

    if (
      particle.pos.x > maxX ||
      particle.pos.x < -maxX ||
      particle.pos.y > maxY ||
      particle.pos.y < -maxY ||
      particle.age > 9
    ) {
      const lane = ((particle.seed * 37 + Math.floor(particle.age * 11)) % 100) / 100
      particle.pos = new Vec2(-maxX, (lane - 0.5) * maxY * 1.6)
      particle.age = 0
    }
  }
}
