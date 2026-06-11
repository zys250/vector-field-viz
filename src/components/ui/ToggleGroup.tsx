/**
 * 单选切换按钮组
 */
interface ToggleOption {
  value: string
  label: string
}

interface ToggleGroupProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function ToggleGroup({ options, value, onChange, label }: ToggleGroupProps) {
  return (
    <div className="toggle-control">
      {label && <span className="control-label">{label}</span>}
      <div className="toggle-control__group">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={value === opt.value ? 'is-active' : ''}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
