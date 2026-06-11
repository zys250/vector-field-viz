import { Vec2 } from '../math/Vector2'
import type { Viewport } from '../store/useSceneStore'

export interface CanvasDrawSize {
  width: number
  height: number
  dpr: number
}

export function worldToScreen(
  pos: Vec2,
  viewport: Viewport,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: width / 2 + (pos.x - viewport.center.x) * viewport.scale,
    y: height / 2 - (pos.y - viewport.center.y) * viewport.scale,
  }
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  width: number,
  height: number
): Vec2 {
  return new Vec2(
    viewport.center.x + (screenX - width / 2) / viewport.scale,
    viewport.center.y - (screenY - height / 2) / viewport.scale
  )
}
