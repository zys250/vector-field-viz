import { Vec2 } from './Vector2'
import { Vec3 } from './Vector3'
import type { Field2D, Field3D } from './fields'

export interface PlaneParams {
  z0: number
  tiltX: number
  tiltY: number
}

export interface ProjectionParams extends PlaneParams {
  a: number
  b: number
  c: number
  t: number
}

export interface CompiledExpression {
  expr: string
  valid: boolean
  error?: string
  evaluate: (x: number, y: number, z: number, params: ProjectionParams) => number
}

const ALLOWED_IDENTIFIERS = new Set([
  'x', 'y', 'z', 'a', 'b', 'c', 't',
  'pi', 'PI', 'e', 'E',
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sqrt', 'abs', 'exp', 'log', 'pow', 'min', 'max',
  'floor', 'ceil', 'round', 'sign',
])

const SCOPE = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  log: Math.log,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
}

export function compileExpression(expr: string, fallback = '0'): CompiledExpression {
  const source = expr.trim() || fallback
  const identifiers = source.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []
  const unknown = identifiers.find((identifier) => !ALLOWED_IDENTIFIERS.has(identifier))

  if (unknown || /[^0-9A-Za-z_+\-*/%^().,\s]/.test(source)) {
    return {
      expr: source,
      valid: false,
      error: unknown ? `Unsupported identifier: ${unknown}` : 'Unsupported character in expression',
      evaluate: () => 0,
    }
  }

  try {
    const normalized = source.replace(/\^/g, '**')
    const fn = new Function(
      'x', 'y', 'z', 'a', 'b', 'c', 't',
      ...Object.keys(SCOPE),
      `return Number(${normalized});`
    ) as (...args: unknown[]) => number

    return {
      expr: source,
      valid: true,
      evaluate: (x, y, z, params) => {
        const value = fn(
          x, y, z, params.a, params.b, params.c, params.t,
          ...Object.values(SCOPE)
        )
        return Number.isFinite(value) ? value : 0
      },
    }
  } catch (error) {
    return {
      expr: source,
      valid: false,
      error: error instanceof Error ? error.message : 'Expression compile failed',
      evaluate: () => 0,
    }
  }
}

export function zOnPlane(pos: Vec2, plane: PlaneParams): number {
  return plane.z0 + plane.tiltX * pos.x + plane.tiltY * pos.y
}

export function scalarOnPlane(
  scalar: CompiledExpression,
  pos: Vec2,
  params: ProjectionParams
): number {
  const z = zOnPlane(pos, params)
  return scalar.evaluate(pos.x, pos.y, z, params)
}

export function gradientProjectionField(
  scalar: CompiledExpression,
  params: ProjectionParams,
  h = 0.01
): Field2D {
  return (pos: Vec2) => {
    const right = scalarOnPlane(scalar, new Vec2(pos.x + h, pos.y), params)
    const left = scalarOnPlane(scalar, new Vec2(pos.x - h, pos.y), params)
    const top = scalarOnPlane(scalar, new Vec2(pos.x, pos.y + h), params)
    const bottom = scalarOnPlane(scalar, new Vec2(pos.x, pos.y - h), params)
    return new Vec2((right - left) / (2 * h), (top - bottom) / (2 * h))
  }
}

export function vectorProjectionField(
  field3D: Field3D,
  plane: PlaneParams
): Field2D {
  return (pos: Vec2) => {
    const z = zOnPlane(pos, plane)
    const vector = field3D(new Vec3(pos.x, pos.y, z))
    return new Vec2(
      vector.x + vector.z * plane.tiltX,
      vector.y + vector.z * plane.tiltY
    )
  }
}

export function compileVectorField3D(
  fxExpr: string,
  fyExpr: string,
  fzExpr: string,
  fallback: [string, string, string] = ['-y', 'x', '0']
): { field: Field3D; expressions: [CompiledExpression, CompiledExpression, CompiledExpression]; valid: boolean } {
  const expressions: [CompiledExpression, CompiledExpression, CompiledExpression] = [
    compileExpression(fxExpr, fallback[0]),
    compileExpression(fyExpr, fallback[1]),
    compileExpression(fzExpr, fallback[2]),
  ]

  return {
    expressions,
    valid: expressions.every((expr) => expr.valid),
    field: (pos: Vec3) => {
      const params: ProjectionParams = {
        z0: 0,
        tiltX: 0,
        tiltY: 0,
        a: 1,
        b: 1,
        c: 1,
        t: 0,
      }
      return new Vec3(
        expressions[0].evaluate(pos.x, pos.y, pos.z, params),
        expressions[1].evaluate(pos.x, pos.y, pos.z, params),
        expressions[2].evaluate(pos.x, pos.y, pos.z, params)
      )
    },
  }
}

export function compileVectorField3DWithParams(
  fxExpr: string,
  fyExpr: string,
  fzExpr: string,
  params: ProjectionParams
): { field: Field3D; valid: boolean; errors: string[] } {
  const expressions = [
    compileExpression(fxExpr, '-y'),
    compileExpression(fyExpr, 'x'),
    compileExpression(fzExpr, '0'),
  ] as const

  return {
    valid: expressions.every((expr) => expr.valid),
    errors: expressions.flatMap((expr) => expr.error ? [expr.error] : []),
    field: (pos: Vec3) => new Vec3(
      expressions[0].evaluate(pos.x, pos.y, pos.z, params),
      expressions[1].evaluate(pos.x, pos.y, pos.z, params),
      expressions[2].evaluate(pos.x, pos.y, pos.z, params)
    ),
  }
}
