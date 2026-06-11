interface LegendItem {
  color: string
  label: string
  style?: 'line' | 'dot'
}

interface LegendProps {
  items: LegendItem[]
}

export default function Legend({ items }: LegendProps) {
  return (
    <div className="legend">
      {items.map((item) => (
        <span className="legend__item" key={item.label}>
          <span
            className={`legend__swatch legend__swatch--${item.style ?? 'line'}`}
            style={{ '--legend-color': item.color } as CSSProperties}
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}
import type { CSSProperties } from 'react'
