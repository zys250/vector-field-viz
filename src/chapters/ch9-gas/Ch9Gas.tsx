import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import type { CanvasDrawSize } from '../../engine2d/coordinates'
import { worldToScreen } from '../../engine2d/coordinates'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFieldLines } from '../../engine2d/drawFieldLines'
import { drawFluxVisual } from '../../engine2d/drawFlux'
import { drawGrid } from '../../engine2d/drawInteractors'
import { drawCachedLayer, makeLayerCacheKey, type CanvasLayerCache } from '../../engine2d/layerCache'
import { drawScalarHeatmap } from '../../engine2d/drawScalar'
import { generateCircleLoop } from '../../engine2d/interactions'
import { curl2D } from '../../math/curl'
import { divergence2D } from '../../math/divergence'
import { computeClosedFlux } from '../../math/flux'
import { advectFlowParticles, createFlowParticles, gasVelocityField, type FlowParticle } from '../../math/fluidFields'
import { Vec2 } from '../../math/Vector2'
import { clampParticleList } from '../../runtime/renderBudget'
import { useRuntimeStore } from '../../store/useRuntimeStore'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import CanvasStage from '../../components/visualization/CanvasStage'
import FormulaCard from '../../components/panels/FormulaCard'
import Legend from '../../components/ui/Legend'
import MetricCard from '../../components/ui/MetricCard'
import PanelSection from '../../components/ui/PanelSection'
import Slider from '../../components/ui/Slider'

const PROBE_RADIUS = 0.85

export default function Ch9Gas() {
  const viewport = useSceneStore((state) => state.viewport)
  const observationPoint = useSceneStore((state) => state.observationPoint)
  const setObservationPoint = useSceneStore((state) => state.setObservationPoint)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const [wind, setWind] = useState(0.45)
  const [expansion, setExpansion] = useState(0.9)
  const [sink, setSink] = useState(0.55)
  const [swirl, setSwirl] = useState(0.45)
  const [radius, setRadius] = useState(2)
  const particlesRef = useRef<FlowParticle[]>(createFlowParticles(renderBudget, 6.5))
  const layerCacheRef = useRef<CanvasLayerCache | null>(null)

  useEffect(() => {
    setObservationPoint(Vec2.zero())
  }, [setObservationPoint])

  useEffect(() => {
    particlesRef.current = createFlowParticles(renderBudget, 6.5)
  }, [renderBudget])

  const probe = observationPoint ?? Vec2.zero()
  const field = useMemo(() => gasVelocityField({ wind, expansion, sink, swirl, radius }), [expansion, radius, sink, swirl, wind])
  const probeLoop = useMemo(() => generateCircleLoop(probe, PROBE_RADIUS, 48), [probe])
  const divergence = useMemo(() => divergence2D(field, probe), [field, probe])
  const curl = useMemo(() => curl2D(field, probe), [field, probe])
  const flux = useMemo(() => computeClosedFlux(field, probeLoop, 8).total, [field, probeLoop])
  const speed = field(probe).norm()
  const mode = divergence > 0.04 ? '膨胀源区' : divergence < -0.04 ? '压缩汇区' : '近似等密度输运'

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, dt: number, size: CanvasDrawSize) => {
    const { width, height } = size
    const backgroundKey = makeLayerCacheKey([
      'ch9-background',
      wind,
      expansion,
      sink,
      swirl,
      radius,
      viewport.center.x.toFixed(3),
      viewport.center.y.toFixed(3),
      viewport.scale.toFixed(2),
      renderBudget.heatmapGrid,
      renderBudget.fieldLineCount,
      renderBudget.fieldLineSteps,
    ])
    drawCachedLayer(layerCacheRef, ctx, size, backgroundKey, (cachedCtx) => {
      drawScalarHeatmap(cachedCtx, (pos) => divergence2D(field, pos), viewport, width, height, {
        grid: renderBudget.heatmapGrid,
        maxAbs: Math.max(0.4, Math.abs(expansion) + Math.abs(sink)),
      })
      drawGrid(cachedCtx, viewport, width, height)
      drawFieldLines(cachedCtx, field, viewport, width, height, {
        color: 'rgba(255, 196, 124, 0.13)',
        spacing: 1.15,
        maxSteps: renderBudget.fieldLineSteps,
        maxLines: renderBudget.fieldLineCount,
      })
      drawArrowGrid(cachedCtx, field, viewport, width, height, 0.72)
    })
    drawFluxVisual(ctx, field, probeLoop, viewport, width, height, {
      closed: true,
      drawPoints: false,
      lineWidth: 2,
    })

    clampParticleList(particlesRef.current, renderBudget)
    advectFlowParticles(particlesRef.current, field, dt, { x: 7, y: 5.2 })
    ctx.save()
    for (const particle of particlesRef.current) {
      const screen = worldToScreen(particle.pos, viewport, width, height)
      const localDiv = divergence2D(field, particle.pos)
      const alpha = Math.max(0.18, 1 - particle.age / 9)
      ctx.fillStyle = localDiv >= 0
        ? `rgba(255, 191, 112, ${alpha})`
        : `rgba(125, 211, 252, ${alpha})`
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, localDiv >= 0 ? 2.4 : 2.9, 0, Math.PI * 2)
      ctx.fill()
    }

    const probeScreen = worldToScreen(probe, viewport, width, height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(probeScreen.x, probeScreen.y, PROBE_RADIUS * viewport.scale, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }, [expansion, field, probe, probeLoop, radius, renderBudget, sink, swirl, viewport, wind])

  const handlePointerDown = useCallback((pos: Vec2) => {
    setObservationPoint(pos)
    return true
  }, [setObservationPoint])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
  }, [setMouseWorldPos])

  const panel = (
    <>
      <PanelSection title="气体参数" eyebrow="COMPRESSIBLE FLOW" accent="#ffbf70">
        <div className="control-stack">
          <Slider label="背景风速" value={wind} min={-1.5} max={1.5} step={0.1} onChange={setWind} />
          <Slider label="中心膨胀" value={expansion} min={-2} max={2} step={0.1} onChange={setExpansion} />
          <Slider label="右下压缩汇" value={sink} min={0} max={2} step={0.1} onChange={setSink} />
          <Slider label="旋流扰动" value={swirl} min={-2} max={2} step={0.1} onChange={setSwirl} />
          <Slider label="影响半径" value={radius} min={0.7} max={4} step={0.1} onChange={setRadius} />
        </div>
      </PanelSection>

      <PanelSection title="压缩性读数" eyebrow="DENSITY INTUITION" accent="#ffbf70">
        <div className="metric-grid">
          <MetricCard label="状态" value={mode} tone={divergence >= 0 ? 'amber' : 'cyan'} note="由 div u 判定" />
          <MetricCard label="速度 |u|" value={speed.toFixed(3)} tone="neutral" note="探针处流速" />
          <MetricCard label="散度 div u" value={divergence.toFixed(4)} tone={divergence >= 0 ? 'red' : 'cyan'} note="正值膨胀，负值压缩" />
          <MetricCard label="小圆通量" value={flux.toFixed(4)} tone="amber" note="气体净流出/流入" />
          <MetricCard label="旋度 curl u" value={curl.toFixed(4)} tone="violet" note="旋流只是一部分" />
        </div>
      </PanelSection>

      <PanelSection title="理解角度" eyebrow="WHY IT HELPS" accent="#ffbf70">
        <FormulaCard
          latex={String.raw`\nabla\cdot\mathbf{u}>0`}
          description="气体可压缩时，局部正散度对应膨胀和密度降低；负散度对应压缩和汇聚。"
        />
        <FormulaCard
          latex={String.raw`\Phi=\oint_C\mathbf{u}\cdot\hat{\mathbf{n}}\,ds`}
          description="小圆通量是散度的可视化窗口：看净流出/流入，比只看箭头方向更可靠。"
        />
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="GAS FLOW / COMPRESSIBLE INTUITION"
        title="气体：膨胀、压缩与密度直觉"
        description="红色区域表示膨胀，蓝色区域表示压缩；拖动探针观察通量和散度如何对应。"
        badge={<span className="stage-badge">{mode}</span>}
        legend={<Legend items={[
          { color: '#ff687f', label: '膨胀 / 正散度' },
          { color: '#3e8bff', label: '压缩 / 负散度' },
          { color: '#ffbf70', label: '气体粒子' },
        ]} />}
        hint="点击移动探针；调高中心膨胀或压缩汇，观察通量如何从近零变成明显正/负。"
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          animate
          ariaLabel="可压缩气体速度场、散度热力图、粒子与通量可视化"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
