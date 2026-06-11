import type { CSSProperties, ReactNode } from 'react'

interface PanelSectionProps {
  title?: string
  eyebrow?: string
  children: ReactNode
  accent?: string
  className?: string
}

export default function PanelSection({
  title,
  eyebrow,
  children,
  accent,
  className = '',
}: PanelSectionProps) {
  return (
    <section
      className={`panel-section ${className}`}
      style={accent ? { '--section-accent': accent } as CSSProperties : undefined}
    >
      {(eyebrow || title) && (
        <header className="panel-section__header">
          {eyebrow && <span className="panel-section__eyebrow">{eyebrow}</span>}
          {title && <h3>{title}</h3>}
        </header>
      )}
      {children}
    </section>
  )
}
