import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Canvas2D from '../../engine2d/Canvas2D'
import type { CanvasDrawSize } from '../../engine2d/coordinates'
import { drawArrowGrid } from '../../engine2d/drawField'
import { drawFieldLines } from '../../engine2d/drawFieldLines'
import { drawFluxVisual } from '../../engine2d/drawFlux'
import { drawCharge, drawGrid } from '../../engine2d/drawInteractors'
import { generateCircleLoop } from '../../engine2d/interactions'
import { multiPlanarChargeField2D } from '../../math/electromagnetism'
import { computeClosedFlux } from '../../math/flux'
import { Vec2 } from '../../math/Vector2'
import { useRuntimeStore } from '../../store/useRuntimeStore'
import { useSceneStore } from '../../store/useSceneStore'
import ChapterLayout from '../ChapterLayout'
import CanvasStage from '../../components/visualization/CanvasStage'
import FormulaCard from '../../components/panels/FormulaCard'
import Icon from '../../components/ui/Icon'
import Legend from '../../components/ui/Legend'
import MetricCard from '../../components/ui/MetricCard'
import PanelSection from '../../components/ui/PanelSection'
import Slider from '../../components/ui/Slider'
import ToggleGroup from '../../components/ui/ToggleGroup'

type ChargeTool = 'move' | 'positive' | 'negative' | 'delete'

const DEFAULT_CHARGES = [
  { id: 'q-positive', pos: new Vec2(-1.6, 0), q: 1 },
  { id: 'q-negative', pos: new Vec2(1.6, 0), q: -1 },
]

export default function Ch6Electric() {
  const viewport = useSceneStore((state) => state.viewport)
  const charges = useSceneStore((state) => state.charges)
  const setCharges = useSceneStore((state) => state.setCharges)
  const addCharge = useSceneStore((state) => state.addCharge)
  const moveCharge = useSceneStore((state) => state.moveCharge)
  const removeCharge = useSceneStore((state) => state.removeCharge)
  const clearCharges = useSceneStore((state) => state.clearCharges)
  const setMouseWorldPos = useSceneStore((state) => state.setMouseWorldPos)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const [tool, setTool] = useState<ChargeTool>('move')
  const [chargeMagnitude, setChargeMagnitude] = useState(1)
  const [gaussRadius, setGaussRadius] = useState(3)
  const dragRef = useRef<{ id: string; offset: Vec2 } | null>(null)

  useEffect(() => {
    if (useSceneStore.getState().charges.length === 0) {
      setCharges(DEFAULT_CHARGES)
    }
  }, [setCharges])

  const field = useMemo(() => multiPlanarChargeField2D(charges), [charges])
  const gaussLoop = useMemo(() => generateCircleLoop(Vec2.zero(), gaussRadius, 72), [gaussRadius])
  const enclosedCharge = useMemo(
    () => charges.reduce((sum, charge) => (
      charge.pos.norm() < gaussRadius ? sum + charge.q : sum
    ), 0),
    [charges, gaussRadius]
  )
  const measuredFlux = useMemo(() => computeClosedFlux(field, gaussLoop, 10).total, [field, gaussLoop])
  const expectedFlux = 2 * Math.PI * enclosedCharge
  const absoluteError = Math.abs(measuredFlux - expectedFlux)

  const onDraw = useCallback((ctx: CanvasRenderingContext2D, _dt: number, size: CanvasDrawSize) => {
    const { width: w, height: h } = size
    drawGrid(ctx, viewport, w, h)
    drawFieldLines(ctx, field, viewport, w, h, {
      color: 'rgba(255, 159, 90, 0.12)',
      spacing: 1.25,
      maxSteps: renderBudget.fieldLineSteps,
      maxLines: renderBudget.fieldLineCount,
    })
    drawArrowGrid(ctx, field, viewport, w, h, 0.55)
    drawFluxVisual(ctx, field, gaussLoop, viewport, w, h, {
      closed: true,
      drawPoints: false,
      lineWidth: 2.2,
    })
    for (const charge of charges) {
      drawCharge(ctx, charge.pos, charge.q, viewport, w, h, {
        hovered: dragRef.current?.id === charge.id,
        dragging: dragRef.current?.id === charge.id,
      })
    }
  }, [charges, field, gaussLoop, renderBudget, viewport])

  const findCharge = useCallback((pos: Vec2) => (
    charges.find((charge) => pos.sub(charge.pos).norm() < 0.42)
  ), [charges])

  const handlePointerDown = useCallback((pos: Vec2) => {
    const hit = findCharge(pos)
    if (tool === 'move') {
      if (!hit) return false
      dragRef.current = { id: hit.id, offset: hit.pos.sub(pos) }
      return true
    }
    if (tool === 'delete') {
      if (!hit) return false
      removeCharge(hit.id)
      return true
    }
    addCharge(pos, tool === 'positive' ? chargeMagnitude : -chargeMagnitude)
    return true
  }, [addCharge, chargeMagnitude, findCharge, removeCharge, tool])

  const handlePointerMove = useCallback((pos: Vec2) => {
    setMouseWorldPos(pos)
    if (dragRef.current) {
      moveCharge(dragRef.current.id, pos.add(dragRef.current.offset))
    }
  }, [moveCharge, setMouseWorldPos])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const resetCharges = () => setCharges(DEFAULT_CHARGES)
  const status = enclosedCharge > 0
    ? '包围正净电荷'
    : enclosedCharge < 0
      ? '包围负净电荷'
      : '包围净电荷为零'

  const panel = (
    <>
      <PanelSection title="电荷工具" eyebrow="CHARGE EDITOR" accent="#ff9f5a">
        <ToggleGroup
          label="点击画布时"
          value={tool}
          onChange={(value) => setTool(value as ChargeTool)}
          options={[
            { value: 'move', label: '移动' },
            { value: 'positive', label: '+ 电荷' },
            { value: 'negative', label: '- 电荷' },
            { value: 'delete', label: '删除' },
          ]}
        />
        <div style={{ marginTop: 11 }}>
          <Slider
            label="新电荷量 |Q|"
            value={chargeMagnitude}
            min={0.25}
            max={3}
            step={0.25}
            onChange={setChargeMagnitude}
          />
        </div>
        <div className="button-row" style={{ marginTop: 11 }}>
          <button type="button" className="secondary-action" onClick={resetCharges}>
            <Icon name="reset" size={14} />重置偶极子
          </button>
          <button type="button" className="secondary-action" onClick={clearCharges}>
            <Icon name="trash" size={14} />清空
          </button>
        </div>
      </PanelSection>

      <PanelSection title="二维高斯圈" eyebrow="GAUSS LOOP" accent="#ff9f5a">
        <Slider
          label="高斯圆半径"
          value={gaussRadius}
          min={0.8}
          max={5}
          step={0.1}
          onChange={setGaussRadius}
        />
        <div className="metric-grid" style={{ marginTop: 11 }}>
          <MetricCard label="包围净电荷" value={enclosedCharge.toFixed(2)} tone="cyan" note={status} />
          <MetricCard label="实测通量" value={measuredFlux.toFixed(3)} tone="amber" note="闭合曲线积分" />
          <MetricCard label="理论值 2πQ" value={expectedFlux.toFixed(3)} tone="green" note="二维高斯关系" />
          <MetricCard label="绝对误差" value={absoluteError.toFixed(3)} tone="neutral" note="数值积分误差" />
        </div>
      </PanelSection>

      <PanelSection title="高斯几何解释" eyebrow="GEOMETRIC VIEW" accent="#ff9f5a">
        <ul className="hint-list">
          <li>高斯圈只关心边界上电场穿出多少；圆外电荷会在圆周上制造进出相抵的贡献。</li>
          <li>圆内净正电荷提供净向外通量，净负电荷提供净向内通量；移动电荷但不穿过边界时，总通量不变。</li>
          <li>这里是二维教学模型：闭合曲线通量对应包围电荷。真实三维静电学使用闭合曲面和 1/r² 衰减。</li>
        </ul>
      </PanelSection>

      <PanelSection title="模型说明" eyebrow="PLANAR ELECTROSTATICS" accent="#ff9f5a">
        <FormulaCard
          latex={String.raw`\mathbf{E}=\frac{kQ}{r}\hat{\mathbf{r}}`}
          description="这里使用二维静电类比：点电荷场强按 1/r 衰减，而不是三维空间中的 1/r²。这样闭合曲线通量不会随半径改变。"
        />
        <FormulaCard
          latex={String.raw`\oint_C\mathbf{E}\cdot\hat{\mathbf{n}}\,ds=2\pi kQ_{\mathrm{enc}}`}
          description="因此闭合曲线通量只由曲线包围的净电荷决定；外部电荷只改变局部形状，不改变总通量。"
        />
      </PanelSection>
    </>
  )

  return (
    <ChapterLayout panel={panel}>
      <CanvasStage
        eyebrow="ELECTRIC FIELD / 2D GAUSS LAW"
        title="点电荷叠加与闭合通量"
        description="把电荷移入或移出高斯圆，观察通量只随包围净电荷变化。"
        badge={<span className="stage-badge">Φ = {measuredFlux.toFixed(3)}</span>}
        legend={<Legend items={[
          { color: '#ef4444', label: '正电荷' },
          { color: '#3b82f6', label: '负电荷' },
          { color: '#22c55e', label: '向外通量' },
          { color: '#ef4444', label: '向内通量' },
        ]} />}
        hint={tool === 'move' ? '拖拽电荷；拖拽空白处平移。' : '点击画布应用当前电荷工具。'}
      >
        <Canvas2D
          viewport={viewport}
          onDraw={onDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ariaLabel="二维点电荷电场与高斯定理可视化"
        />
      </CanvasStage>
    </ChapterLayout>
  )
}
