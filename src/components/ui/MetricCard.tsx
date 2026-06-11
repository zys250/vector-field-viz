interface MetricCardProps {
  label: string
  value: string
  note?: string
  tone?: 'cyan' | 'green' | 'amber' | 'red' | 'violet' | 'neutral'
}

export default function MetricCard({ label, value, note, tone = 'cyan' }: MetricCardProps) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      {note && <span className="metric-card__note">{note}</span>}
    </div>
  )
}
