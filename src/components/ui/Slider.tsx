import { useId } from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  displayValue?: string
}

export default function Slider({ label, value, min, max, step, onChange, displayValue }: SliderProps) {
  const id = useId()

  return (
    <div className="slider-control">
      <div className="slider-control__header">
        <label htmlFor={id}>{label}</label>
        <span>{displayValue ?? value.toFixed(1)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-control__input"
      />
    </div>
  )
}
