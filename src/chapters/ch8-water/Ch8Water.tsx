import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import type { CanvasDrawSize } from '../../engine2d/coordinates'
import { worldToScreen } from '../../engine2d/coordinates'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFieldLines } from '../../engine2d/drawFieldLines'
import { drawGrid } from '../../engine2d/drawInteractors'
import { drawFluxVisual } from '../../engine2d/drawFlux'
import { drawCachedLayer, makeLayerCacheKey, type CanvasLayerCache } from '../../engine2d/layerCache'
import { drawScalarHeatmap, speedHeatColor } from '../../engine2d/drawScalar'
import { generateCircleLoop } from '../../engine2d/interactions'
import { computeClosedFlux } from '../../math/flux'
import { divergence2D } from '../../math/divergence'
import { curl2D } from '../../math/curl'
import { Vec2 } from '../../math/Vector2'
import { advectFlowParticles, createFlowParticles, waterVelocityField, type FlowParticle } from '../../math/fluidFields'
import { clampParticleList } from '../../runtime/renderBudget'
import { useRuntimeStore } from '../../store/useRuntimeStore'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import CanvasStage from '../../components/visualization/CanvasStage'
import PanelSection from '../../components/ui/PanelSection'
import MetricCard from '../../components/ui/MetricCard'
import Slider from '../../components/ui/Slider'
import FormulaCard from '../../components/panels/FormulaCard'
import Legend from '../../components/ui/Legend'

const PROBE_RADIUS = 0.8

export default function Ch8Water() {
  const viewport = useSceneStore((state) => state.viewport)
  const observationPoint = useSceneStore((state) => state.observationPoint)
  const setObservationPoint = useSceneStore((state) => state.setObservationPoint)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const [speed, setSpeed] = useState(1.1)
  const [wave, setWave] = useState(0.7)
  const [swirl, setSwirl] = useState(1.1)
  const [core, setCore] = useState(1.2)
  const particlesRef = useRef<FlowParticle[]>(createFlowParticles(renderBudget, 6))
  const layerCacheRef = useRef<CanvasLayerCache | null>(null)

  useEffect(() => {
    setObservationPoint(Vec2.zero())
  }, [setObservationPoint])

  useEffect(() => {
    particlesRef.current = createFlowParticles(renderBudget, 6)
  }, [renderBudget])

  const probe = observationPoint ?? Vec2.zero()
  const field = useMemo(() => waterVelocityField({ speed, wave, swirl, core }), [core, speed, swirl, wave])
  const probeLoop = useMemo(() => generateCircleLoop(probe, PROBE_RADIUS, 48), [probe])
  const speedAtProbe = field(probe).norm()
  const divergence = useMemo(() => divergence2D(field, probe), [field, probe])
  const curl = useMemo(() => curl2D(field, probe), [field, probe])
  const flux = useMemo(() => computeClosedFlux(field, probeLoop, 8).total, [field, probeLoop])

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, dt: number, size: CanvasDrawSize) => {
    const { width, height } = size
    const backgroundKey = makeLayerCacheKey([
      'ch8-background',
      speed,
      wave,
      swirl,
      core,
      viewport.center.x.toFixed(3),
      viewport.center.y.toFixed(3),
      viewport.scale.toFixed(2),
      renderBudget.heatmapGrid,
      renderBudget.fieldLineCount,
      renderBudget.fieldLineSteps,
    ])
    drawCachedLayer(layerCacheRef, ctx, size, backgroundKey, (cachedCtx) => {
      drawScalarHeatmap(cachedCtx, (pos) => field(pos).norm(), viewport, width, height, {
        grid: renderBudget.heatmapGrid,
        maxAbs: Math.max(1, speed + Math.abs(wave) + Math.abs(swirl)),
        color: speedHeatColor,
      })
      drawGrid(cachedCtx, viewport, width, height)
      drawFieldLines(cachedCtx, field, viewport, width, height, {
        color: 'rgba(125, 211, 252, 0.14)',
        spacing: 1.1,
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
    advectFlowParticles(particlesRef.current, field, dt, { x: 7, y: 5 })
    ctx.save()
    for (const particle of particlesRef.current) {
      const screen = worldToScreen(particle.pos, viewport, width, height)
      const alpha = Math.max(0.2, 1 - particle.age / 9)
      ctx.fillStyle = `rgba(164, 231, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }

    const probeScreen = worldToScreen(probe, viewport, width, height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(probeScreen.x, probeScreen.y, PROBE_RADIUS * viewport.scale, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }, [core, field, probe, probeLoop, renderBudget, speed, swirl, viewport, wave])

  const handlePointerDown = useCallback((pos: Vec2) => {
    setObservationPoint(pos)
    return true
  }, [setObservationPoint])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
  }, [setMouseWorldPos])

  const panel = (
    <>
      <PanelSection title="水流参数" eyebrow="LIQUID FLOW" accent="#7dd3fc">
        <div className="control-stack">
          <Slider label="主流速度" value={speed} min={0} max={2.5} step={0.1} onChange={setSpeed} />
          <Slider label="波动扰动" value={wave} min={0} max={2} step={0.1} onChange={setWave} />
          <Slider label="涡核强度" value={swirl} min={-3} max={3} step={0.1} onChange={setSwirl} />
          <Slider label="涡核尺度" value={core} min={0.3} max={3} step={0.1} onChange={setCore} />
        </div>
      </PanelSection>

      <PanelSection title="局部读数" eyebrow="PROBE" accent="#7dd3fc">
        <div className="metric-grid">
          <MetricCard label="速度 |u|" value={speedAtProbe.toFixed(3)} tone="cyan" note="探针处流速" />
          <MetricCard label="散度 div u" value={divergence.toFixed(4)} tone={Math.abs(divergence) < 0.03 ? 'green' : 'amber'} note="不可压水流应接近 0" />
          <MetricCard label="小圆通量" value={flux.toFixed(4)} tone="neutral" note="净流入/流出" />
          <MetricCard label="旋度 curl u" value={curl.toFixed(4)} tone={curl >= 0 ? 'violet' : 'cyan'} note="局部桨轮是否会转" />
        </div>
      </PanelSection>

      <PanelSection title="理解角度" eyebrow="WHY IT HELPS" accent="#7dd3fc">
        <FormulaCard
          latex={String.raw`\nabla\cdot\mathbf{u}\approx 0`}
          description="液态水常用不可压近似：小闭合区域的净通量接近 0，但内部仍然可以有剪切和涡旋。"
        />
        <FormulaCard
          latex={String.raw`\omega=\nabla\times\mathbf{u}`}
          description="水花绕着走不等于每一点都在自转；旋度读数才对应小桨轮的局部旋转。"
        />
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="LIQUID FLOW / INCOMPRESSIBLE INTUITION"
        title="水流：通量近零，但仍有剪切和涡旋"
        description="点击移动小圆探针，比较速度、散度、通量和旋度：水会流动，但不一定产生净流出。"
        badge={<span className="stage-badge">div ≈ {divergence.toFixed(3)}</span>}
        legend={<Legend items={[
          { color: '#7dd3fc', label: '水流速度' },
          { color: '#a4e7ff', label: '染料粒子' },
          { color: '#22c55e', label: '向外通量' },
          { color: '#ef4444', label: '向内通量' },
        ]} />}
        hint="点击移动探针；空间键或中键拖动画布；右上角可暂停动画或开启省电模式。"
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          animate
          ariaLabel="不可压缩水流速度场、染料粒子、通量与旋度可视化"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
