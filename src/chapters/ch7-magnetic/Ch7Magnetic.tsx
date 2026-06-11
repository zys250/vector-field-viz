import { useCallback, useMemo, useRef, useState } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import { worldToScreen, type CanvasDrawSize } from '../../engine2d/coordinates'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFieldLines } from '../../engine2d/drawFieldLines'
import { drawGrid } from '../../engine2d/drawInteractors'
import { inducedEField2D, wireBField2D } from '../../math/electromagnetism'
import { Vec2 } from '../../math/Vector2'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import FormulaCard from '../../components/panels/FormulaCard'
import PanelSection from '../../components/ui/PanelSection'
import MetricCard from '../../components/ui/MetricCard'
import CanvasStage from '../../components/visualization/CanvasStage'
import Legend from '../../components/ui/Legend'
import ToggleGroup from '../../components/ui/ToggleGroup'
import Slider from '../../components/ui/Slider'

type MagneticMode = 'wire' | 'faraday'

export default function Ch7Magnetic() {
  const viewport = useSceneStore((state) => state.viewport)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const [mode, setMode] = useState<MagneticMode>('wire')
  const [current, setCurrent] = useState(1)
  const [wireX, setWireX] = useState(0)
  const [dFluxDt, setDFluxDt] = useState(0.8)
  const [loopRadius, setLoopRadius] = useState(2.2)
  const draggingWireRef = useRef(false)

  const wireField = useMemo(() => wireBField2D(new Vec2(wireX, 0), current), [current, wireX])
  const inducedField = useMemo(
    () => inducedEField2D(Vec2.zero(), loopRadius, dFluxDt),
    [dFluxDt, loopRadius]
  )

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, _dt: number, size: CanvasDrawSize) => {
    const { width: w, height: h } = size
    drawGrid(ctx, viewport, w, h)

    if (mode === 'wire') {
      drawFieldLines(ctx, wireField, viewport, w, h, {
        color: 'rgba(255, 111, 169, 0.32)',
        spacing: 0.75,
        drawArrows: true,
      })
      drawArrowGrid(ctx, wireField, viewport, w, h, 0.65)

      const screen = worldToScreen(new Vec2(wireX, 0), viewport, w, h)
      ctx.save()
      ctx.shadowColor = current >= 0 ? 'rgba(71, 200, 255, 0.65)' : 'rgba(247, 200, 106, 0.65)'
      ctx.shadowBlur = draggingWireRef.current ? 20 : 10
      ctx.fillStyle = current >= 0 ? '#47c8ff' : '#f7c86a'
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#eaf6ff'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#07101d'
      ctx.font = 'bold 15px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(current >= 0 ? '⊙' : '⊗', screen.x, screen.y + 0.5)
      ctx.restore()
    } else {
      drawFieldLines(ctx, inducedField, viewport, w, h, {
        color: 'rgba(247, 200, 106, 0.26)',
        spacing: 0.75,
        drawArrows: true,
      })
      drawArrowGrid(ctx, inducedField, viewport, w, h, 0.65)
      drawFaradayLoop(ctx, viewport, w, h, loopRadius, dFluxDt)
    }
  }, [dFluxDt, inducedField, loopRadius, mode, viewport, wireField, wireX, current])

  const handlePointerDown = useCallback((pos: Vec2) => {
    if (mode !== 'wire') return false
    if (pos.sub(new Vec2(wireX, 0)).norm() > 0.45) return false
    draggingWireRef.current = true
    return true
  }, [mode, wireX])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
    if (draggingWireRef.current) setWireX(pos.x)
  }, [setMouseWorldPos])

  const handlePointerUp = useCallback(() => {
    draggingWireRef.current = false
  }, [])

  const currentDirection = current >= 0 ? '出屏幕' : '入屏幕'
  const fieldDirection = current >= 0 ? '逆时针' : '顺时针'
  const inducedDirection = dFluxDt > 0 ? '顺时针' : dFluxDt < 0 ? '逆时针' : '无感应'
  const emf = -dFluxDt

  const panel = (
    <>
      <PanelSection title="实验模式" eyebrow="MAGNETIC LAB" accent="#ff6fa9">
        <ToggleGroup
          value={mode}
          onChange={(value) => setMode(value as MagneticMode)}
          options={[
            { value: 'wire', label: '载流导线' },
            { value: 'faraday', label: '电磁感应' },
          ]}
        />
      </PanelSection>

      {mode === 'wire' ? (
        <>
          <PanelSection title="导线参数" eyebrow="CURRENT WIRE" accent="#ff6fa9">
            <div className="control-stack">
              <Slider
                label="电流 I"
                value={current}
                min={-3}
                max={3}
                step={0.1}
                onChange={setCurrent}
                displayValue={`${current >= 0 ? '+' : ''}${current.toFixed(1)} · ${currentDirection}`}
              />
              <Slider
                label="导线位置 X"
                value={wireX}
                min={-4}
                max={4}
                step={0.1}
                onChange={setWireX}
              />
            </div>
            <div className="metric-grid" style={{ marginTop: 11 }}>
              <MetricCard label="电流方向" value={currentDirection} tone="cyan" note="⊙ 出 / ⊗ 入" />
              <MetricCard label="磁场方向" value={fieldDirection} tone="violet" note="右手定则" />
            </div>
          </PanelSection>

          <PanelSection title="毕奥-萨伐尔定律" eyebrow="MAGNETIC FIELD" accent="#ff6fa9">
            <FormulaCard
              latex={String.raw`B=\frac{\mu_0 I}{2\pi r}\hat{\boldsymbol{\phi}}`}
              description="无限长直导线的横截面磁场呈同心圆分布，方向由右手定则确定。"
            />
          </PanelSection>
        </>
      ) : (
        <>
          <PanelSection title="磁通量变化" eyebrow="FARADAY LOOP" accent="#ff6fa9">
            <div className="control-stack">
              <Slider
                label="dΦB / dt"
                value={dFluxDt}
                min={-2}
                max={2}
                step={0.1}
                onChange={setDFluxDt}
                displayValue={`${dFluxDt >= 0 ? '+' : ''}${dFluxDt.toFixed(1)}`}
              />
              <Slider
                label="回路半径"
                value={loopRadius}
                min={1}
                max={4}
                step={0.1}
                onChange={setLoopRadius}
              />
            </div>
            <div className="metric-grid" style={{ marginTop: 11 }}>
              <MetricCard label="感应电动势 ε" value={emf.toFixed(2)} tone="amber" note="ε = −dΦB/dt" />
              <MetricCard label="感应方向" value={inducedDirection} tone="violet" note="楞次定律" />
            </div>
          </PanelSection>

          <PanelSection title="法拉第定律" eyebrow="INDUCED ELECTRIC FIELD" accent="#ff6fa9">
            <FormulaCard
              latex={String.raw`\mathcal{E}=\oint_C\mathbf{E}\cdot d\mathbf{r}=-\frac{d\Phi_B}{dt}`}
              description="负号表示感应电场总是反抗磁通量的变化。"
            />
          </PanelSection>
        </>
      )}
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow={mode === 'wire' ? 'MAGNETIC FIELD / CURRENT WIRE' : 'FARADAY INDUCTION / LENZ LAW'}
        title={mode === 'wire' ? '载流直导线的环形磁场' : '变化磁通量产生感应电场'}
        description={mode === 'wire' ? '拖拽导线或调节电流，观察磁场方向和强度。' : '调节磁通量变化率，观察感应方向如何反抗变化。'}
        badge={<span className="stage-badge">{mode === 'wire' ? fieldDirection : inducedDirection}</span>}
        legend={<Legend items={mode === 'wire' ? [
          { color: '#47c8ff', label: '电流出屏幕' },
          { color: '#f7c86a', label: '电流入屏幕' },
          { color: '#ff6fa9', label: '磁场线' },
        ] : [
          { color: '#f7c86a', label: '感应电场' },
          { color: '#47c8ff', label: '磁通量变化区' },
        ]} />}
        hint={mode === 'wire' ? '拖拽中心导线改变位置；拖拽空白处平移。' : '调节右侧参数；拖拽空白处平移。'}
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ariaLabel={mode === 'wire' ? '载流导线磁场可视化' : '法拉第电磁感应可视化'}
        />
      </CanvasStage>
    </ChapterLayout>
  )
}

function drawFaradayLoop(
  ctx: CanvasRenderingContext2D,
  viewport: ReturnType<typeof useSceneStore.getState>['viewport'],
  width: number,
  height: number,
  radius: number,
  dFluxDt: number
) {
  const center = worldToScreen(Vec2.zero(), viewport, width, height)
  const pixelRadius = radius * viewport.scale

  ctx.save()
  ctx.fillStyle = dFluxDt >= 0 ? 'rgba(71, 200, 255, 0.055)' : 'rgba(169, 139, 255, 0.055)'
  ctx.beginPath()
  ctx.arc(center.x, center.y, pixelRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(71, 200, 255, 0.75)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.arc(center.x, center.y, pixelRadius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = 'rgba(142, 190, 225, 0.6)'
  ctx.font = '11px ui-monospace, SFMono-Regular, Consolas, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`dΦB/dt = ${dFluxDt >= 0 ? '+' : ''}${dFluxDt.toFixed(1)}`, center.x, center.y - 9)
  ctx.fillText(`ε = ${(-dFluxDt).toFixed(1)}`, center.x, center.y + 9)

  const symbol = dFluxDt >= 0 ? '×' : '•'
  ctx.fillStyle = dFluxDt >= 0 ? 'rgba(71, 200, 255, 0.5)' : 'rgba(169, 139, 255, 0.55)'
  ctx.font = '12px sans-serif'
  for (let x = -radius * 0.7; x <= radius * 0.7; x += 0.55) {
    for (let y = -radius * 0.7; y <= radius * 0.7; y += 0.55) {
      if (x * x + y * y > radius * radius * 0.52) continue
      const point = worldToScreen(new Vec2(x, y), viewport, width, height)
      ctx.fillText(symbol, point.x, point.y)
    }
  }
  ctx.restore()
}
