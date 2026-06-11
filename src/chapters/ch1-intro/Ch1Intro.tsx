import { useCallback, useRef, useState } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import { worldToScreen, type CanvasDrawSize } from '../../engine2d/coordinates'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFieldLines } from '../../engine2d/drawFieldLines'
import { drawGrid } from '../../engine2d/drawInteractors'
import { drawCachedLayer, makeLayerCacheKey, type CanvasLayerCache } from '../../engine2d/layerCache'
import { Vec2 } from '../../math/Vector2'
import { rk4StepAdaptive } from '../../math/numerical'
import { clampParticleList } from '../../runtime/renderBudget'
import { useFieldStore } from '../../store/useFieldStore'
import { useRuntimeStore } from '../../store/useRuntimeStore'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import ParamPanel from '../../components/panels/ParamPanel'
import FormulaCard from '../../components/panels/FormulaCard'
import PanelSection from '../../components/ui/PanelSection'
import CanvasStage from '../../components/visualization/CanvasStage'
import Legend from '../../components/ui/Legend'

interface ParticleTrail {
  pos: Vec2
  trail: Vec2[]
  hue: number
  life: number
}

type DisplayMode = 'arrows' | 'lines' | 'particles'

export default function Ch1Intro() {
  const field2D = useFieldStore((state) => state.field2D)
  const activePreset = useFieldStore((state) => state.activePreset)
  const params = useFieldStore((state) => state.params)
  const viewport = useSceneStore((state) => state.viewport)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const [mode, setMode] = useState<DisplayMode>('arrows')
  const particlesRef = useRef<ParticleTrail[]>([])
  const layerCacheRef = useRef<CanvasLayerCache | null>(null)

  const onDraw = useCallback(
    (ctx: CanvasRenderingContext2D, dt: number, size: CanvasDrawSize) => {
      const { width: w, height: h } = size
      if (mode !== 'particles') {
        drawGrid(ctx, viewport, w, h)
      }

      if (mode === 'arrows') {
        drawArrowGrid(ctx, field2D, viewport, w, h, viewport.scale < 34 ? 1 : 0.6)
      }

      if (mode === 'lines') {
        drawFieldLines(ctx, field2D, viewport, w, h, {
          color: 'rgba(89, 242, 195, 0.46)',
          lineWidth: 1.1,
          spacing: 1.25,
          maxSteps: renderBudget.fieldLineSteps,
          maxLines: renderBudget.fieldLineCount,
          drawArrows: true,
        })
      }

      if (mode === 'particles') {
        const backgroundKey = makeLayerCacheKey([
          'ch1-particles',
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
            color: 'rgba(71, 200, 255, 0.08)',
            lineWidth: 0.8,
            spacing: 1.6,
            maxSteps: renderBudget.fieldLineSteps,
            maxLines: renderBudget.fieldLineCount,
          })
        })
        clampParticleList(particlesRef.current, renderBudget)
        for (const particle of particlesRef.current) {
          const next = rk4StepAdaptive(field2D, particle.pos, 0.065, true, 0.001, 20)
          particle.pos = next
          particle.trail.push(next)
          if (particle.trail.length > renderBudget.trailLength) {
            particle.trail.splice(0, particle.trail.length - renderBudget.trailLength)
          }
          particle.life -= dt

          const halfW = w / 2 / viewport.scale + 1
          const halfH = h / 2 / viewport.scale + 1
          const outOfBounds =
            Math.abs(particle.pos.x - viewport.center.x) > halfW ||
            Math.abs(particle.pos.y - viewport.center.y) > halfH
          if (outOfBounds || particle.life <= 0) {
            particle.pos = useSceneStore.getState().mouseWorldPos
            particle.trail = []
            particle.life = 8
            continue
          }

          ctx.save()
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          for (let i = 1; i < particle.trail.length; i++) {
            const alpha = (i / particle.trail.length) * 0.55
            const width = (i / particle.trail.length) * 2.4
            const a = worldToScreen(particle.trail[i - 1], viewport, w, h)
            const b = worldToScreen(particle.trail[i], viewport, w, h)
            ctx.strokeStyle = `hsla(${particle.hue}, 88%, 66%, ${alpha})`
            ctx.lineWidth = width
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
          ctx.restore()

          const screen = worldToScreen(particle.pos, viewport, w, h)
          const glow = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, 8)
          glow.addColorStop(0, `hsla(${particle.hue}, 100%, 80%, 0.95)`)
          glow.addColorStop(0.5, `hsla(${particle.hue}, 100%, 58%, 0.35)`)
          glow.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`)
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const mousePos = useSceneStore.getState().mouseWorldPos
      const fieldAtMouse = field2D(mousePos)
      const magnitude = fieldAtMouse.norm()
      if (magnitude > 0.001) {
        const screen = worldToScreen(mousePos, viewport, w, h)
        const text = `F = (${fieldAtMouse.x.toFixed(2)}, ${fieldAtMouse.y.toFixed(2)})   |F| = ${magnitude.toFixed(2)}`
        ctx.font = '10px ui-monospace, SFMono-Regular, Consolas, monospace'
        const metrics = ctx.measureText(text)
        ctx.fillStyle = 'rgba(5, 13, 24, 0.82)'
        ctx.fillRect(screen.x + 10, screen.y - 18, metrics.width + 12, 19)
        ctx.fillStyle = 'rgba(226, 242, 255, 0.88)'
        ctx.fillText(text, screen.x + 16, screen.y - 5)
      }
    },
    [activePreset.key, field2D, mode, params, renderBudget, viewport]
  )

  const handlePointerDown = useCallback((pos: Vec2) => {
    if (mode !== 'particles') return false
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        pos: pos.add(new Vec2((Math.random() - 0.5) * 0.28, (Math.random() - 0.5) * 0.28)),
        trail: [],
        hue: 160 + Math.random() * 80,
        life: 8,
      })
    }
    clampParticleList(particlesRef.current, renderBudget)
    return true
  }, [mode, renderBudget])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
  }, [setMouseWorldPos])

  const panel = (
    <>
      <ParamPanel
        extraOptions={[
          { value: 'arrows', label: '箭头' },
          { value: 'lines', label: '场线' },
          { value: 'particles', label: '粒子' },
        ]}
        extraValue={mode}
        onExtraChange={(value) => setMode(value as DisplayMode)}
        extraLabel="显示方式"
      />

      <PanelSection title="表示方法" eyebrow="READ THE FIELD" accent="#59f2c3">
        <FormulaCard
          title="向量场"
          latex={String.raw`\mathbf{F}(x,y) = (F_x(x,y),\; F_y(x,y))`}
          description="场为平面上的每个位置分配一个向量。方向表示趋势，模长表示强度。"
        />
        <ul className="hint-list">
          <li>箭头是离散采样，适合读取局部方向和强度。</li>
          <li>场线处处与向量相切，适合观察整体拓扑。</li>
          <li>示踪粒子沿场积分，适合感受运动趋势。</li>
        </ul>
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="VECTOR FIELD / LOCAL SAMPLE"
        title={activePreset.name}
        description={activePreset.description}
        badge={<span className="stage-badge">{activePreset.formula}</span>}
        legend={<Legend items={[
          { color: '#47c8ff', label: '弱场' },
          { color: '#59f2c3', label: '中等场' },
          { color: '#f7c86a', label: '强场' },
        ]} />}
        hint={mode === 'particles' ? '点击画布释放示踪粒子；拖拽空白处平移，滚轮缩放。' : '悬停读取精确向量；拖拽空白处平移，滚轮缩放。'}
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          animate={mode === 'particles'}
          ariaLabel="向量场箭头、场线与粒子可视化"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
