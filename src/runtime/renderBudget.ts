export type QualityProfile = 'high' | 'balanced' | 'safe'

export interface RenderBudget {
  targetFps: number
  frameBudgetMs: number
  particleCount: number
  fieldLineCount: number
  fieldLineSteps: number
  heatmapGrid: number
  trailLength: number
}

const PROFILE_ORDER: QualityProfile[] = ['safe', 'balanced', 'high']

const RENDER_BUDGETS: Record<QualityProfile, Omit<RenderBudget, 'frameBudgetMs'>> = {
  high: {
    targetFps: 60,
    particleCount: 120,
    fieldLineCount: 60,
    fieldLineSteps: 360,
    heatmapGrid: 38,
    trailLength: 32,
  },
  balanced: {
    targetFps: 40,
    particleCount: 80,
    fieldLineCount: 42,
    fieldLineSteps: 260,
    heatmapGrid: 30,
    trailLength: 24,
  },
  safe: {
    targetFps: 24,
    particleCount: 48,
    fieldLineCount: 26,
    fieldLineSteps: 180,
    heatmapGrid: 24,
    trailLength: 16,
  },
}

export function isQualityProfile(value: unknown): value is QualityProfile {
  return value === 'high' || value === 'balanced' || value === 'safe'
}

export function resolveRenderBudget(profile: QualityProfile): RenderBudget {
  const budget = RENDER_BUDGETS[profile]
  return {
    ...budget,
    frameBudgetMs: 1000 / budget.targetFps,
  }
}

export function nextLowerQuality(profile: QualityProfile): QualityProfile {
  const index = PROFILE_ORDER.indexOf(profile)
  return PROFILE_ORDER[Math.max(0, index - 1)]
}

export function clampParticleList<T>(
  particles: T[],
  budgetOrCount: RenderBudget | number,
  maxTrailLength?: number
): T[] {
  const maxParticles = typeof budgetOrCount === 'number'
    ? budgetOrCount
    : budgetOrCount.particleCount
  const trailLimit = maxTrailLength ?? (
    typeof budgetOrCount === 'number' ? undefined : budgetOrCount.trailLength
  )

  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles)
  }

  if (typeof trailLimit === 'number') {
    for (const particle of particles) {
      const trail = (particle as { trail?: unknown[] }).trail
      if (Array.isArray(trail) && trail.length > trailLimit) {
        trail.splice(0, trail.length - trailLimit)
      }
    }
  }

  return particles
}
