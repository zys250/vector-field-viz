import { useCallback, useEffect, useMemo, useRef } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import { worldToScreen, type CanvasDrawSize } from '../../engine2d/coordinates'
import { drawArrowGrid, scalarToColor } from '../../engine2d/drawField'
import { drawFluxVisual } from '../../engine2d/drawFlux'
import { drawGrid, drawObservationPoint } from '../../engine2d/drawInteractors'
import { generateCircleLoop } from '../../engine2d/interactions'
import { drawCachedLayer, makeLayerCacheKey, type CanvasLayerCache } from '../../engine2d/layerCache'
import { divergence2D, divergence2DGrid } from '../../math/divergence'
import { computeClosedFlux } from '../../math/flux'
import { Vec2 } from '../../math/Vector2'
import { useFieldStore } from '../../store/useFieldStore'
import { useRuntimeStore } from '../../store/useRuntimeStore'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import CanvasStage from '../../components/visualization/CanvasStage'
import FormulaCard from '../../components/panels/FormulaCard'
import Legend from '../../components/ui/Legend'
import MetricCard from '../../components/ui/MetricCard'
import PanelSection from '../../components/ui/PanelSection'
import ParamPanel from '../../components/panels/ParamPanel'

const PROBE_RADIUS = 0.65

export default function Ch4Divergence() {
  const field2D = useFieldStore((state) => state.field2D)
  const activePreset = useFieldStore((state) => state.activePreset)
  const params = useFieldStore((state) => state.params)
  const viewport = useSceneStore((state) => state.viewport)
  const observationPoint = useSceneStore((state) => state.observationPoint)
  const setObservationPoint = useSceneStore((state) => state.setObservationPoint)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const layerCacheRef = useRef<CanvasLayerCache | null>(null)

  useEffect(() => {
    setObservationPoint(Vec2.zero())
  }, [setObservationPoint])

  const probe = observationPoint ?? Vec2.zero()
  const probeLoop = useMemo(() => generateCircleLoop(probe, PROBE_RADIUS, 48), [probe])
  const divValue = useMemo(() => divergence2D(field2D, probe), [field2D, probe])
  const localFlux = useMemo(() => computeClosedFlux(field2D, probeLoop, 8).total, [field2D, probeLoop])
  const localArea = Math.PI * PROBE_RADIUS * PROBE_RADIUS
  const divIntegral = divValue * localArea
  const relativeError = Math.abs(localFlux - divIntegral) / Math.max(0.001, Math.abs(divIntegral))

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, _dt: number, size: CanvasDrawSize) => {
    const { width: w, height: h } = size
    const halfW = w / 2 / viewport.scale
    const halfH = h / 2 / viewport.scale
    const xMin = viewport.center.x - halfW
    const xMax = viewport.center.x + halfW
    const yMin = viewport.center.y - halfH
    const yMax = viewport.center.y + halfH
    const backgroundKey = makeLayerCacheKey([
      'ch4-background',
      activePreset.key,
      JSON.stringify(params),
      viewport.center.x.toFixed(3),
      viewport.center.y.toFixed(3),
      viewport.scale.toFixed(2),
      renderBudget.heatmapGrid,
    ])

    drawCachedLayer(layerCacheRef, ctx, size, backgroundKey, (cachedCtx) => {
      const gridRes = renderBudget.heatmapGrid
      const divGrid = divergence2DGrid(field2D, xMin, xMax, gridRes, yMin, yMax, gridRes)
      let maxAbs = 0.25
      for (const sample of divGrid) maxAbs = Math.max(maxAbs, Math.abs(sample.div))

      const cellW = w / (gridRes - 1)
      const cellH = h / (gridRes - 1)
      for (const sample of divGrid) {
        const screen = worldToScreen(new Vec2(sample.x, sample.y), viewport, w, h)
        cachedCtx.fillStyle = scalarToColor(sample.div, maxAbs)
        cachedCtx.fillRect(screen.x - cellW / 2, screen.y - cellH / 2, cellW + 1, cellH + 1)
      }

      drawGrid(cachedCtx, viewport, w, h)
      drawArrowGrid(cachedCtx, field2D, viewport, w, h, 0.8)
    })

    drawFluxVisual(ctx, field2D, probeLoop, viewport, w, h, {
      closed: true,
      drawPoints: false,
      lineWidth: 2,
    })
    drawObservationPoint(ctx, probe, viewport, w, h)
  }, [activePreset.key, field2D, params, probe, probeLoop, renderBudget.heatmapGrid, viewport])

  const handlePointerDown = useCallback((pos: Vec2) => {
    setObservationPoint(pos)
    return true
  }, [setObservationPoint])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
  }, [setMouseWorldPos])

  const classification = divValue > 0.03 ? '局部源' : divValue < -0.03 ? '局部汇' : '近似无源'
  const tone = divValue > 0.03 ? 'red' : divValue < -0.03 ? 'cyan' : 'neutral'

  const panel = (
    <>
      <ParamPanel />

      <PanelSection title="探针读数" eyebrow="LOCAL MEASURE" accent="#ff7b8f">
        <div className="metric-grid">
          <MetricCard label="散度 div F" value={divValue.toFixed(4)} tone={tone} note={classification} />
          <MetricCard label="小圆通量" value={localFlux.toFixed(4)} tone="cyan" note="闭合曲线积分" />
          <MetricCard label="div · 面积" value={divIntegral.toFixed(4)} tone="amber" note="局部高斯近似" />
          <MetricCard label="相对误差" value={`${(relativeError * 100).toFixed(1)}%`} tone="neutral" note="圆越小通常越准" />
        </div>
      </PanelSection>

      <PanelSection title="几何直觉" eyebrow="WHY GAUSS WORKS" accent="#ff7b8f">
        <ul className="hint-list">
          <li>散度看一点附近是否像“源”一样把流推出去，或像“汇”一样把流吸进去。</li>
          <li>把区域切成许多小格子，相邻格子的内部边界通量一正一负会互相抵消，最后只剩最外圈边界的净流出。</li>
          <li>所以闭合边界上的总通量，等于区域内部所有散度累加；三维时就是“闭合曲面通量 = 体积分散度”。</li>
        </ul>
      </PanelSection>

      <PanelSection title="散度与高斯定理" eyebrow="DIFFERENTIAL OPERATOR" accent="#ff7b8f">
        <FormulaCard
          latex={String.raw`\nabla\cdot\mathbf{F}=\frac{\partial F_x}{\partial x}+\frac{\partial F_y}{\partial y}`}
          description="散度衡量单位面积附近的净流出率。正散度像局部膨胀，负散度像局部压缩。"
        />
        <FormulaCard
          latex={String.raw`\oint_{\partial S}\mathbf{F}\cdot\hat{\mathbf{n}}\,ds=\iint_S\nabla\cdot\mathbf{F}\,dA`}
          description="在二维画布中，高斯定理把闭合曲线通量和区域内散度面积分联系起来；小圆探针显示的是这个关系的局部版本。"
        />
        <FormulaCard
          latex={String.raw`\iint_{\partial V}\mathbf{F}\cdot\hat{\mathbf{n}}\,dS=\iiint_V\nabla\cdot\mathbf{F}\,dV`}
          description="三维形式把闭合曲线换成闭合曲面，把面积累加换成体积累加：表面净流出只由体内源汇决定。"
        />
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="DIVERGENCE / LOCAL OUTFLOW"
        title="源、汇与单位面积通量"
        description={`当前场：${activePreset.name}。点击任意位置移动散度探针。`}
        badge={<span className="stage-badge">{classification}</span>}
        legend={<Legend items={[
          { color: '#ff5c7a', label: '正散度 / 源' },
          { color: '#3e8bff', label: '负散度 / 汇' },
          { color: '#47c8ff', label: '探针与通量' },
        ]} />}
        hint="点击移动探针；空格键或中键拖拽平移，滚轮缩放。"
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          ariaLabel="散度热力图、向量场和局部通量探针"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
