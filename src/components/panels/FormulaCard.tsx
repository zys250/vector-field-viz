/**
 * 公式卡片 — 使用 KaTeX 渲染 LaTeX 公式
 */
import { useEffect, useRef } from 'react'
import katex from 'katex'

interface FormulaCardProps {
  title?: string
  latex: string
  description?: string
}

export default function FormulaCard({ title, latex, description }: FormulaCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          throwOnError: false,
          displayMode: true,
        })
      } catch {
        ref.current.textContent = latex
      }
    }
  }, [latex])

  return (
    <div className="formula-card">
      {title && <h4>{title}</h4>}
      <div ref={ref} className="formula-card__math" />
      {description && (
        <p>{description}</p>
      )}
    </div>
  )
}
