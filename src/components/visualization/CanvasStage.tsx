import type { ReactNode } from 'react'
import ViewportControls from './ViewportControls'

interface CanvasStageProps {
  children: ReactNode
  eyebrow: string
  title: string
  description?: string
  badge?: ReactNode
  legend?: ReactNode
  hint?: ReactNode
}

export default function CanvasStage({
  children,
  eyebrow,
  title,
  description,
  badge,
  legend,
  hint,
}: CanvasStageProps) {
  return (
    <div className="canvas-stage">
      <div className="canvas-stage__surface">{children}</div>

      <div className="canvas-stage__hud">
        <span className="canvas-stage__eyebrow">{eyebrow}</span>
        <div className="canvas-stage__title-row">
          <h2>{title}</h2>
          {badge}
        </div>
        {description && <p>{description}</p>}
      </div>

      <ViewportControls />

      {legend && <div className="canvas-stage__legend">{legend}</div>}
      {hint && <div className="canvas-stage__hint">{hint}</div>}
    </div>
  )
}
