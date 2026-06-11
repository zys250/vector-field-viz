/**
 * 参数面板 — 根据当前场预设动态显示可调参数
 */
import Slider from '../ui/Slider'
import ToggleGroup from '../ui/ToggleGroup'
import Icon from '../ui/Icon'
import PanelSection from '../ui/PanelSection'
import { FIELD_PRESETS_2D } from '../../math/fields'
import { useFieldStore } from '../../store/useFieldStore'

interface ParamPanelProps {
  /** 额外选项（如显示模式切换） */
  extraOptions?: Array<{ value: string; label: string }>
  extraValue?: string
  onExtraChange?: (value: string) => void
  extraLabel?: string
}

export default function ParamPanel({ extraOptions, extraValue, onExtraChange, extraLabel }: ParamPanelProps) {
  const activePreset = useFieldStore((s) => s.activePreset)
  const params = useFieldStore((s) => s.params)
  const setPreset = useFieldStore((s) => s.setPreset)
  const setParam = useFieldStore((s) => s.setParam)
  const resetParams = useFieldStore((s) => s.resetParams)

  return (
    <PanelSection title="场模型" eyebrow="FIELD MODEL" accent="#59f2c3">
      <div className="field-model">
        <label className="control-label" htmlFor="field-preset">预设场</label>
        <select
          id="field-preset"
          value={activePreset.key}
          onChange={(e) => setPreset(e.target.value)}
          className="select-control"
        >
          {FIELD_PRESETS_2D.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>

        <div className="field-model__summary">
          <code>{activePreset.formula}</code>
          <p>{activePreset.description}</p>
          <div className="field-model__tags">
            {activePreset.characteristics.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>

        <div className="control-stack">
          {activePreset.paramDefs.map((def) => (
            <Slider
              key={def.key}
              label={def.name}
              value={params[def.key] ?? 0}
              min={def.min}
              max={def.max}
              step={def.step}
              onChange={(v) => setParam(def.key, v)}
            />
          ))}
        </div>

        {extraOptions && onExtraChange && (
          <ToggleGroup
            label={extraLabel}
            options={extraOptions}
            value={extraValue ?? ''}
            onChange={onExtraChange}
          />
        )}

        <button type="button" className="secondary-action secondary-action--small" onClick={resetParams}>
          <Icon name="reset" size={14} />
          恢复预设参数
        </button>
      </div>
    </PanelSection>
  )
}
