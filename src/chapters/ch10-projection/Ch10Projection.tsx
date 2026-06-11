import { useCallback, useEffect, useMemo, useState } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import type { CanvasDrawSize } from '../../engine2d/coordinates'
import { worldToScreen } from '../../engine2d/coordinates'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFluxVisual } from '../../engine2d/drawFlux'
import { drawGrid } from '../../engine2d/drawInteractors'
import { drawScalarHeatmap, signedHeatColor, speedHeatColor } from '../../engine2d/drawScalar'
import { generateCircleLoop } from '../../engine2d/interactions'
import { divergence2D } from '../../math/divergence'
import { computeClosedFlux } from '../../math/flux'
import {
  compileExpression,
  compileVectorField3DWithParams,
  gradientProjectionField,
  scalarOnPlane,
  vectorProjectionField,
  type ProjectionParams,
} from '../../math/projection3d'
import { Vec2 } from '../../math/Vector2'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import CanvasStage from '../../components/visualization/CanvasStage'
import FormulaCard from '../../components/panels/FormulaCard'
import Legend from '../../components/ui/Legend'
import MetricCard from '../../components/ui/MetricCard'
import PanelSection from '../../components/ui/PanelSection'
import Slider from '../../components/ui/Slider'
import ToggleGroup from '../../components/ui/ToggleGroup'

type ProjectionMode = 'gradient' | 'vector'
type HeatMode = 'scalar' | 'divergence' | 'magnitude'

const PROBE_RADIUS = 0.85

export default function Ch10Projection() {
  const viewport = useSceneStore((state) => state.viewport)
  const observationPoint = useSceneStore((state) => state.observationPoint)
  const setObservationPoint = useSceneStore((state) => state.setObservationPoint)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const [mode, setMode] = useState<ProjectionMode>('gradient')
  const [heatMode, setHeatMode] = useState<HeatMode>('scalar')
  const [scalarExpr, setScalarExpr] = useState('sin(x) + cos(y) + 0.35*z*z')
  const [fxExpr, setFxExpr] = useState('-y + 0.4*z')
  const [fyExpr, setFyExpr] = useState('x')
  const [fzExpr, setFzExpr] = useState('0.6*sin(x*y)')
  const [z0, setZ0] = useState(0)
  const [tiltX, setTiltX] = useState(0.25)
  const [tiltY, setTiltY] = useState(-0.15)
  const [a, setA] = useState(1)
  const [b, setB] = useState(1)
  const [c, setC] = useState(1)
  const [t, setT] = useState(0)

  useEffect(() => {
    setObservationPoint(Vec2.zero())
  }, [setObservationPoint])

  const probe = observationPoint ?? Vec2.zero()
  const params: ProjectionParams = useMemo(() => ({
    z0,
    tiltX,
    tiltY,
    a,
    b,
    c,
    t,
  }), [a, b, c, t, tiltX, tiltY, z0])
  const scalar = useMemo(() => compileExpression(scalarExpr, 'sin(x)+cos(y)'), [scalarExpr])
  const vector3 = useMemo(
    () => compileVectorField3DWithParams(fxExpr, fyExpr, fzExpr, params),
    [fxExpr, fyExpr, fzExpr, params]
  )
  const projectedField = useMemo(() => (
    mode === 'gradient'
      ? gradientProjectionField(scalar, params)
      : vectorProjectionField(vector3.field, params)
  ), [mode, params, scalar, vector3.field])
  const probeLoop = useMemo(() => generateCircleLoop(probe, PROBE_RADIUS, 48), [probe])
  const scalarValue = useMemo(() => scalarOnPlane(scalar, probe, params), [params, probe, scalar])
  const fieldAtProbe = projectedField(probe)
  const divergence = useMemo(() => divergence2D(projectedField, probe), [probe, projectedField])
  const flux = useMemo(() => computeClosedFlux(projectedField, probeLoop, 8).total, [probeLoop, projectedField])
  const errors = [
    scalar.error,
    ...vector3.errors,
  ].filter(Boolean)

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, _dt: number, size: CanvasDrawSize) => {
    const { width, height } = size
    const sampler = heatMode === 'divergence'
      ? (pos: Vec2) => divergence2D(projectedField, pos)
      : heatMode === 'magnitude'
        ? (pos: Vec2) => projectedField(pos).norm()
        : (pos: Vec2) => scalarOnPlane(scalar, pos, params)

    drawScalarHeatmap(ctx, sampler, viewport, width, height, {
      grid: 36,
      color: heatMode === 'magnitude' ? speedHeatColor : signedHeatColor,
    })
    drawGrid(ctx, viewport, width, height)
    drawArrowGrid(ctx, projectedField, viewport, width, height, 0.72)
    drawFluxVisual(ctx, projectedField, probeLoop, viewport, width, height, {
      closed: true,
      drawPoints: false,
      lineWidth: 2,
    })

    const probeScreen = worldToScreen(probe, viewport, width, height)
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(probeScreen.x, probeScreen.y, PROBE_RADIUS * viewport.scale, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(probeScreen.x, probeScreen.y, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [heatMode, params, probe, probeLoop, projectedField, scalar, viewport])

  const handlePointerDown = useCallback((pos: Vec2) => {
    setObservationPoint(pos)
    return true
  }, [setObservationPoint])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
  }, [setMouseWorldPos])

  const panel = (
    <>
      <PanelSection title="投影模式" eyebrow="3D TO 2D" accent="#b8f06a">
        <ToggleGroup
          label="二维场来源"
          value={mode}
          onChange={(value) => setMode(value as ProjectionMode)}
          options={[
            { value: 'gradient', label: '平面梯度' },
            { value: 'vector', label: '向量投影' },
          ]}
        />
        <div style={{ marginTop: 10 }}>
          <ToggleGroup
            label="底图"
            value={heatMode}
            onChange={(value) => setHeatMode(value as HeatMode)}
            options={[
              { value: 'scalar', label: '标量高度' },
              { value: 'divergence', label: '散度' },
              { value: 'magnitude', label: '强度' },
            ]}
          />
        </div>
      </PanelSection>

      <PanelSection title="自定义函数" eyebrow="FUNCTION INPUT" accent="#b8f06a">
        <label className="control-label" htmlFor="scalar-expression">标量 φ(x,y,z)</label>
        <input id="scalar-expression" className="text-control" value={scalarExpr} onChange={(event) => setScalarExpr(event.target.value)} />
        <div className="projection-input-grid">
          <label>
            <span className="control-label">Fx</span>
            <input className="text-control" value={fxExpr} onChange={(event) => setFxExpr(event.target.value)} />
          </label>
          <label>
            <span className="control-label">Fy</span>
            <input className="text-control" value={fyExpr} onChange={(event) => setFyExpr(event.target.value)} />
          </label>
          <label>
            <span className="control-label">Fz</span>
            <input className="text-control" value={fzExpr} onChange={(event) => setFzExpr(event.target.value)} />
          </label>
        </div>
        <p className="field-model__hint">支持 x, y, z, a, b, c, t 与 sin/cos/exp/sqrt/pow/atan2 等常用函数。</p>
        {errors.length > 0 && <p className="field-model__warning">{errors.join('；')}</p>}
      </PanelSection>

      <PanelSection title="切片平面与参数" eyebrow="PLANE" accent="#b8f06a">
        <div className="control-stack">
          <Slider label="z0" value={z0} min={-3} max={3} step={0.1} onChange={setZ0} />
          <Slider label="x 方向倾斜" value={tiltX} min={-1.5} max={1.5} step={0.05} onChange={setTiltX} />
          <Slider label="y 方向倾斜" value={tiltY} min={-1.5} max={1.5} step={0.05} onChange={setTiltY} />
          <Slider label="参数 a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="参数 b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="参数 c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="参数 t" value={t} min={0} max={6.28} step={0.05} onChange={setT} />
        </div>
      </PanelSection>

      <PanelSection title="投影读数" eyebrow="LOCAL VALUES" accent="#b8f06a">
        <div className="metric-grid">
          <MetricCard label="φ on plane" value={scalarValue.toFixed(3)} tone="green" note="探针处标量值" />
          <MetricCard label="|F₂D|" value={fieldAtProbe.norm().toFixed(3)} tone="cyan" note={mode === 'gradient' ? '平面梯度强度' : '投影场强度'} />
          <MetricCard label="div F₂D" value={divergence.toFixed(4)} tone={divergence >= 0 ? 'red' : 'cyan'} note="二维投影场散度" />
          <MetricCard label="小圆通量" value={flux.toFixed(4)} tone="amber" note="闭合曲线积分" />
        </div>
      </PanelSection>

      <PanelSection title="数学关系" eyebrow="FORMULAS" accent="#b8f06a">
        <FormulaCard
          latex={String.raw`z=z_0+\alpha x+\beta y,\quad g(x,y)=\phi(x,y,z(x,y))`}
          description="先用一个可倾斜平面切 3D 标量函数，再在平面坐标中计算二维梯度。"
        />
        <FormulaCard
          latex={String.raw`\nabla_{xy}\cdot\mathbf{F}_{2D}\quad\mathrm{and}\quad\oint_C\mathbf{F}_{2D}\cdot\hat{\mathbf{n}}\,ds`}
          description="投影后的二维场继续可以观察散度、通量和局部强度。"
        />
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="3D FUNCTION / PLANE PROJECTION"
        title="三维函数投影到二维场"
        description="把 3D 标量或向量函数限制到一个平面上，观察平面梯度、投影场、散度与通量。"
        badge={<span className="stage-badge">{mode === 'gradient' ? '∇plane φ' : 'F3D → plane'}</span>}
        legend={<Legend items={[
          { color: '#b8f06a', label: '投影向量场' },
          { color: '#ff687f', label: '正散度/正标量' },
          { color: '#3e8bff', label: '负散度/负标量' },
        ]} />}
        hint="点击移动探针；修改函数表达式后会立即重新采样。"
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          ariaLabel="三维函数平面投影二维向量场、散度和通量可视化"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
