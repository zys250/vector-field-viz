import { useCallback, useEffect, useMemo, useRef } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import { worldToScreen, type CanvasDrawSize } from '../../engine2d/coordinates'
import { drawArrowGrid, scalarToColor } from '../../engine2d/drawField'
import { drawGrid, drawPaddleWheel } from '../../engine2d/drawInteractors'
import { generateCircleLoop } from '../../engine2d/interactions'
import { drawCachedLayer, makeLayerCacheKey, type CanvasLayerCache } from '../../engine2d/layerCache'
import { computeCirculation } from '../../math/circulation'
import { curl2D, curl2DGrid } from '../../math/curl'
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

export default function Ch5Curl() {
  const field2D = useFieldStore((state) => state.field2D)
  const activePreset = useFieldStore((state) => state.activePreset)
  const params = useFieldStore((state) => state.params)
  const setPreset = useFieldStore((state) => state.setPreset)
  const viewport = useSceneStore((state) => state.viewport)
  const observationPoint = useSceneStore((state) => state.observationPoint)
  const setObservationPoint = useSceneStore((state) => state.setObservationPoint)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const wheelAngleRef = useRef(0)
  const layerCacheRef = useRef<CanvasLayerCache | null>(null)

  useEffect(() => {
    setObservationPoint(Vec2.zero())
  }, [setObservationPoint])

  const probe = observationPoint ?? Vec2.zero()
  const probeLoop = useMemo(() => generateCircleLoop(probe, PROBE_RADIUS, 48), [probe])
  const curlValue = useMemo(() => curl2D(field2D, probe), [field2D, probe])
  const localCirculation = useMemo(() => computeCirculation(field2D, probeLoop, 8).total, [field2D, probeLoop])
  const localArea = Math.PI * PROBE_RADIUS * PROBE_RADIUS
  const curlIntegral = curlValue * localArea
  const wheelSpinRate = localCirculation / localArea
  const relativeError = Math.abs(localCirculation - curlIntegral) / Math.max(0.001, Math.abs(curlIntegral))

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, dt: number, size: CanvasDrawSize) => {
    const { width: w, height: h } = size
    const halfW = w / 2 / viewport.scale
    const halfH = h / 2 / viewport.scale
    const xMin = viewport.center.x - halfW
    const xMax = viewport.center.x + halfW
    const yMin = viewport.center.y - halfH
    const yMax = viewport.center.y + halfH
    const backgroundKey = makeLayerCacheKey([
      'ch5-background',
      activePreset.key,
      JSON.stringify(params),
      viewport.center.x.toFixed(3),
      viewport.center.y.toFixed(3),
      viewport.scale.toFixed(2),
      renderBudget.heatmapGrid,
    ])

    drawCachedLayer(layerCacheRef, ctx, size, backgroundKey, (cachedCtx) => {
      const gridRes = renderBudget.heatmapGrid
      const curlGrid = curl2DGrid(field2D, xMin, xMax, gridRes, yMin, yMax, gridRes)
      let maxAbs = 0.25
      for (const sample of curlGrid) maxAbs = Math.max(maxAbs, Math.abs(sample.curl))

      const cellW = w / (gridRes - 1)
      const cellH = h / (gridRes - 1)
      for (const sample of curlGrid) {
        const screen = worldToScreen(new Vec2(sample.x, sample.y), viewport, w, h)
        cachedCtx.fillStyle = scalarToColor(sample.curl, maxAbs)
        cachedCtx.fillRect(screen.x - cellW / 2, screen.y - cellH / 2, cellW + 1, cellH + 1)
      }

      drawGrid(cachedCtx, viewport, w, h)
      drawArrowGrid(cachedCtx, field2D, viewport, w, h, 0.8)
    })

    const probeScreen = worldToScreen(probe, viewport, w, h)
    ctx.save()
    ctx.beginPath()
    ctx.arc(probeScreen.x, probeScreen.y, PROBE_RADIUS * viewport.scale, 0, Math.PI * 2)
    ctx.strokeStyle = wheelSpinRate > 0.03
      ? 'rgba(255, 123, 143, 0.75)'
      : wheelSpinRate < -0.03
        ? 'rgba(71, 200, 255, 0.75)'
        : 'rgba(247, 200, 106, 0.5)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 6])
    ctx.stroke()
    ctx.restore()

    wheelAngleRef.current += wheelSpinRate * dt * 2.7
    drawPaddleWheel(ctx, probe, wheelSpinRate, viewport, w, h, wheelAngleRef.current)
  }, [activePreset.key, field2D, params, probe, renderBudget.heatmapGrid, viewport, wheelSpinRate])

  const handlePointerDown = useCallback((pos: Vec2) => {
    setObservationPoint(pos)
    return true
  }, [setObservationPoint])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
  }, [setMouseWorldPos])

  const applyCurlExample = useCallback((preset: string, pos = Vec2.zero()) => {
    setPreset(preset)
    setObservationPoint(pos)
  }, [setObservationPoint, setPreset])

  const classification = curlValue > 0.03
    ? '逆时针局部自转'
    : curlValue < -0.03
      ? '顺时针局部自转'
      : '近似无局部自转'
  const tone = curlValue > 0.03 ? 'red' : curlValue < -0.03 ? 'cyan' : 'neutral'
  const wheelNote = Math.abs(wheelSpinRate) > 0.03 ? '桨轮应持续转动' : '有速度也可能不自转'

  const panel = (
    <>
      <ParamPanel />

      <PanelSection title="旋度示例" eyebrow="TRY THESE" accent="#a98bff">
        <div className="button-row">
          <button type="button" className="secondary-action secondary-action--small" onClick={() => applyCurlExample('rotational', Vec2.zero())}>
            刚体旋转
          </button>
          <button type="button" className="secondary-action secondary-action--small" onClick={() => applyCurlExample('shear', new Vec2(0, 1.2))}>
            剪切流
          </button>
          <button type="button" className="secondary-action secondary-action--small" onClick={() => applyCurlExample('soft-vortex', new Vec2(0.45, 0.2))}>
            软涡核
          </button>
          <button type="button" className="secondary-action secondary-action--small" onClick={() => applyCurlExample('source', new Vec2(1.4, 0.8))}>
            无旋源流
          </button>
          <button type="button" className="secondary-action secondary-action--small" onClick={() => applyCurlExample('constant', new Vec2(-1.4, 0.9))}>
            常量场
          </button>
          <button type="button" className="secondary-action secondary-action--small" onClick={() => applyCurlExample('saddle', new Vec2(1.2, -1.2))}>
            鞍点场
          </button>
        </div>
        <p className="panel-copy" style={{ marginTop: 10 }}>
          小桨轮响应的是局部旋度，而不是“有没有速度”或“整体是否绕中心转”。剪切流上下层速度不同，会让桨轮自转；源流、常量场和鞍点场可以有明显流动，但 curl 接近 0 时不自转是正确结果。
        </p>
      </PanelSection>

      <PanelSection title="桨轮读数" eyebrow="LOCAL ROTATION" accent="#a98bff">
        <div className="metric-grid">
          <MetricCard label="旋度 curl F" value={curlValue.toFixed(4)} tone={tone} note={classification} />
          <MetricCard label="桨轮角速度" value={wheelSpinRate.toFixed(4)} tone={tone} note={wheelNote} />
          <MetricCard label="小圆环量" value={localCirculation.toFixed(4)} tone="amber" note="闭合回路线积分" />
          <MetricCard label="curl · 面积" value={curlIntegral.toFixed(4)} tone="violet" note="局部 Stokes 近似" />
          <MetricCard label="相对误差" value={`${(relativeError * 100).toFixed(1)}%`} tone="neutral" note="小圆越小通常越准" />
        </div>
      </PanelSection>

      <PanelSection title="旋度与 Stokes 定理" eyebrow="DIFFERENTIAL OPERATOR" accent="#a98bff">
        <FormulaCard
          latex={String.raw`\nabla\times\mathbf{F}=\frac{\partial F_y}{\partial x}-\frac{\partial F_x}{\partial y}`}
          description="二维旋度是标量：正值表示逆时针局部自转，负值表示顺时针局部自转。它测的是一点附近的速度差如何拧动物体。"
        />
        <FormulaCard
          latex={String.raw`\oint_{\partial S}\mathbf{F}\cdot d\mathbf{r}\approx(\nabla\times\mathbf{F})\,\mathrm{Area}(S)`}
          description="把探针小圆缩小看，边界上的总切向推动除以面积，就逼近中心点的旋度。小桨轮、小圆环量和热力图读数是在讲同一件事。"
        />
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="CURL / LOCAL ROTATION"
        title="小桨轮到底会不会转？"
        description={`当前场：${activePreset.name}。点击任意位置移动桨轮；试试剪切流，它不绕中心转，但仍有局部旋度。`}
        badge={<span className="stage-badge">{classification}</span>}
        legend={<Legend items={[
          { color: '#ff5c7a', label: '正旋度 / 逆时针' },
          { color: '#3e8bff', label: '负旋度 / 顺时针' },
          { color: '#f7c86a', label: '桨轮基准点' },
        ]} />}
        hint="点击移动桨轮；空间键或中键拖拽平移，滚轮缩放。"
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          animate
          ariaLabel="旋度热力图、向量场和可移动桨轮"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
