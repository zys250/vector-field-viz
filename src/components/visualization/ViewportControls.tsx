import Icon from '../ui/Icon'
import { Vec2 } from '../../math/Vector2'
import { useSceneStore } from '../../store/useSceneStore'

export default function ViewportControls() {
  const viewport = useSceneStore((state) => state.viewport)
  const zoom = useSceneStore((state) => state.zoom)
  const setViewport = useSceneStore((state) => state.setViewport)

  const reset = () => setViewport({ center: Vec2.zero(), scale: 56 })

  return (
    <div className="viewport-controls" aria-label="视口控制">
      <button type="button" onClick={() => zoom(1.25, viewport.center)} aria-label="放大">
        <Icon name="zoom-in" size={16} />
      </button>
      <button type="button" onClick={() => zoom(0.8, viewport.center)} aria-label="缩小">
        <Icon name="zoom-out" size={16} />
      </button>
      <span className="viewport-controls__scale">{Math.round(viewport.scale)} px/u</span>
      <button type="button" onClick={reset} aria-label="重置视口">
        <Icon name="reset" size={16} />
      </button>
    </div>
  )
}
