import { useCallback, useEffect, useMemo, useRef } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import type { CanvasDrawSize } from '../../engine2d/coordinates'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFieldLines } from '../../engine2d/drawFieldLines'
import { drawFluxVisual } from '../../engine2d/drawFlux'
import { drawGrid } from '../../engine2d/drawInteractors'
import { computeFlux } from '../../math/flux'
import { Vec2 } from '../../math/Vector2'
import { useFieldStore } from '../../store/useFieldStore'
import { useRuntimeStore } from '../../store/useRuntimeStore'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import ParamPanel from '../../components/panels/ParamPanel'
import FormulaCard from '../../components/panels/FormulaCard'
import PanelSection from '../../components/ui/PanelSection'
import MetricCard from '../../components/ui/MetricCard'
import CanvasStage from '../../components/visualization/CanvasStage'
import Legend from '../../components/ui/Legend'
import Icon from '../../components/ui/Icon'

const CURVE_ID = 'flux-curve'
const DEFAULT_CURVE = [
  new Vec2(-3.2, -1.2),
  new Vec2(-1.6, 0.6),
  new Vec2(0, 0),
  new Vec2(1.6, -0.6),
  new Vec2(3.2, 1.2),
]

export default function Ch2Flux() {
  const field2D = useFieldStore((state) => state.field2D)
  const activePreset = useFieldStore((state) => state.activePreset)
  const viewport = useSceneStore((state) => state.viewport)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const curves = useSceneStore((state) => state.curves)
  const setCurve = useSceneStore((state) => state.setCurve)
  const addCurvePoint = useSceneStore((state) => state.addCurvePoint)
  const moveCurvePoint = useSceneStore((state) => state.moveCurvePoint)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const draggingPointRef = useRef<number | null>(null)

  useEffect(() => {
    setCurve(CURVE_ID, DEFAULT_CURVE)
  }, [setCurve])

  const curve = useMemo(
    () => curves.find((item) => item.id === CURVE_ID)?.points ?? [],
    [curves]
  )
  const fluxResult = useMemo(() => computeFlux(field2D, curve, 8), [curve, field2D])
  const positive = fluxResult.segments.reduce((sum, segment) => sum + Math.max(0, segment.contribution), 0)
  const negative = fluxResult.segments.reduce((sum, segment) => sum + Math.min(0, segment.contribution), 0)

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, _dt: number, size: CanvasDrawSize) => {
    const { width: w, height: h } = size
    drawGrid(ctx, viewport, w, h)
    drawFieldLines(ctx, field2D, viewport, w, h, {
      color: 'rgba(71, 200, 255, 0.1)',
      spacing: 1.5,
      maxSteps: renderBudget.fieldLineSteps,
      maxLines: renderBudget.fieldLineCount,
    })
    drawArrowGrid(ctx, field2D, viewport, w, h, 0.75)
    drawFluxVisual(ctx, field2D, curve, viewport, w, h)
  }, [curve, field2D, renderBudget, viewport])

  const handlePointerDown = useCallback((pos: Vec2) => {
    for (let i = 0; i < curve.length; i++) {
      if (pos.sub(curve[i]).norm() < 0.32) {
        draggingPointRef.current = i
        return true
      }
    }
    addCurvePoint(CURVE_ID, pos)
    return true
  }, [addCurvePoint, curve])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
    if (draggingPointRef.current !== null) {
      moveCurvePoint(CURVE_ID, draggingPointRef.current, pos)
    }
  }, [moveCurvePoint, setMouseWorldPos])

  const handlePointerUp = useCallback(() => {
    draggingPointRef.current = null
  }, [])

  const resetCurve = () => setCurve(CURVE_ID, DEFAULT_CURVE)
  const direction = fluxResult.total > 0.03 ? '净穿出' : fluxResult.total < -0.03 ? '净穿入' : '近似平衡'

  const panel = (
    <>
      <ParamPanel />

      <PanelSection title="通量读数" eyebrow="LIVE INTEGRAL" accent="#47c8ff">
        <div className="metric-grid">
          <MetricCard label="总通量 Φ" value={fluxResult.total.toFixed(4)} tone="cyan" note={direction} />
          <MetricCard label="采样段数" value={String(fluxResult.segments.length)} tone="neutral" note="中点法积分" />
          <MetricCard label="正贡献" value={`+${positive.toFixed(3)}`} tone="green" note="沿右法向穿出" />
          <MetricCard label="负贡献" value={negative.toFixed(3)} tone="red" note="逆右法向穿入" />
        </div>
        <div className="button-row" style={{ marginTop: 10 }}>
          <button type="button" className="secondary-action" onClick={resetCurve}>
            <Icon name="reset" size={14} />重置曲线
          </button>
        </div>
      </PanelSection>

      <PanelSection title="定义与方向" eyebrow="LINE INTEGRAL" accent="#47c8ff">
        <FormulaCard
          latex={String.raw`\Phi = \int_C \mathbf{F} \cdot \hat{\mathbf{n}}\,ds`}
          description="本实验使用曲线行进方向的右法向量。交换起点和终点会让通量符号翻转。"
        />
        <ul className="hint-list">
          <li>点击空白处添加顶点，拖拽控制点改变曲线。</li>
          <li>让曲线与场平行时，法向分量接近零。</li>
          <li>按住空格或使用中键拖拽可平移视口。</li>
        </ul>
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="FLUX / ORIENTED CURVE"
        title="曲线上的法向分量"
        description={`当前场：${activePreset.name}。每一段颜色代表它对总通量的正负贡献。`}
        badge={<span className="stage-badge">Φ = {fluxResult.total.toFixed(3)}</span>}
        legend={<Legend items={[
          { color: '#22c55e', label: '正贡献' },
          { color: '#ef4444', label: '负贡献' },
          { color: '#ffffff', label: '法向分量' },
        ]} />}
        hint="点击添加顶点，拖拽控制点编辑曲线；空格或中键拖拽平移。"
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ariaLabel="向量场穿过可编辑曲线的通量可视化"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
