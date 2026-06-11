import { useCallback, useEffect, useMemo, useRef } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import type { CanvasDrawSize } from '../../engine2d/coordinates'
import { createCirculationParticles, drawCirculationVisual } from '../../engine2d/drawCirculation'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFieldLines } from '../../engine2d/drawFieldLines'
import { drawGrid } from '../../engine2d/drawInteractors'
import { drawCachedLayer, makeLayerCacheKey, type CanvasLayerCache } from '../../engine2d/layerCache'
import { generateCircleLoop } from '../../engine2d/interactions'
import { computeCirculation } from '../../math/circulation'
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

const LOOP_ID = 'circulation-loop'

export default function Ch3Circulation() {
  const field2D = useFieldStore((state) => state.field2D)
  const activePreset = useFieldStore((state) => state.activePreset)
  const params = useFieldStore((state) => state.params)
  const viewport = useSceneStore((state) => state.viewport)
  const curves = useSceneStore((state) => state.curves)
  const setCurve = useSceneStore((state) => state.setCurve)
  const moveCurvePoint = useSceneStore((state) => state.moveCurvePoint)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const particlesRef = useRef<Array<{ pos: Vec2; t: number }>>([])
  const draggingPointRef = useRef<number | null>(null)
  const layerCacheRef = useRef<CanvasLayerCache | null>(null)

  const resetLoop = useCallback(() => {
    const circle = generateCircleLoop(Vec2.zero(), 2.5, 32)
    setCurve(LOOP_ID, circle, true)
    const budget = useRuntimeStore.getState().renderBudget
    particlesRef.current = createCirculationParticles(circle, Math.min(36, budget.particleCount))
  }, [setCurve])

  useEffect(() => {
    resetLoop()
  }, [resetLoop])

  const loop = useMemo(
    () => curves.find((item) => item.id === LOOP_ID)?.points ?? [],
    [curves]
  )
  const result = useMemo(() => computeCirculation(field2D, loop, 8), [field2D, loop])
  const contributionStats = useMemo(() => {
    let positive = 0
    let negative = 0
    for (const segment of result.segments) {
      if (segment.contribution >= 0) positive += segment.contribution
      else negative += segment.contribution
    }
    const gross = positive + Math.abs(negative)
    const cancelled = Math.min(positive, Math.abs(negative))
    return {
      positive,
      negative,
      cancellationRatio: gross > 0 ? cancelled / gross : 0,
    }
  }, [result.segments])
  const averageTangential = result.enclosedArea > 0
    ? result.total / Math.max(1, result.segments.reduce((sum, segment) => sum + segment.ds, 0))
    : 0

  useEffect(() => {
    if (loop.length >= 3) {
      particlesRef.current = createCirculationParticles(loop, Math.min(36, renderBudget.particleCount))
    }
  }, [loop, renderBudget.particleCount])

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, dt: number, size: CanvasDrawSize) => {
    const { width: w, height: h } = size
    const backgroundKey = makeLayerCacheKey([
      'ch3-background',
      activePreset.key,
      JSON.stringify(params),
      viewport.center.x.toFixed(3),
      viewport.center.y.toFixed(3),
      viewport.scale.toFixed(2),
      renderBudget.fieldLineCount,
      renderBudget.fieldLineSteps,
    ])
    drawCachedLayer(layerCacheRef, ctx, size, backgroundKey, (cachedCtx) => {
      drawGrid(cachedCtx, viewport, w, h)
      drawFieldLines(cachedCtx, field2D, viewport, w, h, {
        color: 'rgba(247, 200, 106, 0.09)',
        spacing: 1.5,
        maxSteps: renderBudget.fieldLineSteps,
        maxLines: renderBudget.fieldLineCount,
      })
      drawArrowGrid(cachedCtx, field2D, viewport, w, h, 0.75)
    })
    drawCirculationVisual(ctx, field2D, loop, viewport, w, h, particlesRef.current, dt)
  }, [activePreset.key, field2D, loop, params, renderBudget, viewport])

  const handlePointerDown = useCallback((pos: Vec2) => {
    for (let i = 0; i < loop.length; i++) {
      if (pos.sub(loop[i]).norm() < 0.32) {
        draggingPointRef.current = i
        return true
      }
    }
    return false
  }, [loop])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
    if (draggingPointRef.current === null) return
    moveCurvePoint(LOOP_ID, draggingPointRef.current, pos)
    const updated = useSceneStore.getState().curves.find((item) => item.id === LOOP_ID)?.points
    if (updated) particlesRef.current = createCirculationParticles(updated, Math.min(36, renderBudget.particleCount))
  }, [moveCurvePoint, renderBudget.particleCount, setMouseWorldPos])

  const handlePointerUp = useCallback(() => {
    draggingPointRef.current = null
  }, [])

  const direction = result.total > 0.03 ? '逆时针切向推动占优' : result.total < -0.03 ? '顺时针切向推动占优' : '正负贡献基本抵消'

  const panel = (
    <>
      <ParamPanel />

      <PanelSection title="环量读数" eyebrow="CLOSED LOOP" accent="#f7c86a">
        <div className="metric-grid">
          <MetricCard label="总环量 Γ" value={result.total.toFixed(4)} tone="amber" note={direction} />
          <MetricCard label="正向切向推动" value={contributionStats.positive.toFixed(4)} tone="green" note="沿回路方向累计" />
          <MetricCard label="反向切向抵消" value={contributionStats.negative.toFixed(4)} tone="red" note="逆回路方向累计" />
          <MetricCard label="抵消比例" value={`${(contributionStats.cancellationRatio * 100).toFixed(1)}%`} tone="neutral" note="正负贡献互相抵消" />
          <MetricCard label="包围面积" value={result.enclosedArea.toFixed(3)} tone="neutral" note="平方单位" />
          <MetricCard label="平均切向分量" value={averageTangential.toFixed(3)} tone="cyan" note="沿回路方向" />
          <MetricCard label="回路顶点" value={String(loop.length)} tone="neutral" note="可拖拽编辑" />
        </div>
        <div className="button-row" style={{ marginTop: 10 }}>
          <button type="button" className="secondary-action" onClick={resetLoop}>
            <Icon name="reset" size={14} />重置圆形回路
          </button>
        </div>
      </PanelSection>

      <PanelSection title="定义与联系" eyebrow="LINE INTEGRAL" accent="#f7c86a">
        <FormulaCard
          latex={String.raw`\Gamma = \oint_C \mathbf{F}\cdot d\mathbf{r}`}
          description="环量是沿闭合回路的切向线积分，任何向量场都能算；旋转场只是最容易看到非零结果的一类。回路采用逆时针方向。"
        />
        <FormulaCard
          latex={String.raw`\oint_C \mathbf{F}\cdot d\mathbf{r} = \iint_S (\nabla\times\mathbf{F})\,dS`}
          description="斯托克斯定理说明：总环量来自区域内旋度的面积累加。若正负旋度或正反切向贡献抵消，总环量可以接近零。"
        />
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="CIRCULATION / CLOSED LOOP"
        title="沿闭合回路累计切向推动"
        description={`当前场：${activePreset.name}。金色短线表示局部切向贡献；正向和反向推动会互相抵消，所以“有流动”不等于“总环量一定非零”。`}
        badge={<span className="stage-badge">Γ = {result.total.toFixed(3)}</span>}
        legend={<Legend items={[
          { color: '#f7c86a', label: '切向贡献' },
          { color: '#47c8ff', label: '沿回路' },
          { color: '#f59e0b', label: '逆回路' },
        ]} />}
        hint="拖拽回路控制点改变积分区域；拖拽空白处平移视口。"
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          animate
          ariaLabel="闭合回路上的向量场环量可视化"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
