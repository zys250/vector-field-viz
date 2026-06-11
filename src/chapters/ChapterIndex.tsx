import type { CSSProperties } from 'react'
import { CHAPTERS, type ChapterKey } from '../config/chapters'
import Icon from '../components/ui/Icon'

interface ChapterIndexProps {
  onNavigate: (chapter: ChapterKey) => void
}

export default function ChapterIndex({ onNavigate }: ChapterIndexProps) {
  return (
    <div className="chapter-index">
      <section className="chapter-index__hero">
        <div className="chapter-index__hero-copy">
          <span className="chapter-index__kicker">INTERACTIVE MATHEMATICS LAB</span>
          <h1>
            看见场，<br />
            而不只是记住公式。
          </h1>
          <p>
            在同一套坐标、数值计算和交互语言中，连接向量场、线积分、微分算子、流体与电磁学直觉。
          </p>
          <div className="chapter-index__hero-actions">
            <button type="button" className="primary-action" onClick={() => onNavigate('ch1')}>
              <Icon name="play" size={15} />
              从向量场开始
            </button>
            <span>{CHAPTERS.length} 个实验 · 实时读数 · 可拖拽探针</span>
          </div>
        </div>

        <div className="field-orbit" aria-hidden="true">
          <div className="field-orbit__glow" />
          <div className="field-orbit__ring field-orbit__ring--one" />
          <div className="field-orbit__ring field-orbit__ring--two" />
          <div className="field-orbit__ring field-orbit__ring--three" />
          <div className="field-orbit__core"><Icon name="vector" size={30} /></div>
          <span className="field-orbit__label field-orbit__label--a">F(x, y)</span>
          <span className="field-orbit__label field-orbit__label--b">∇ · F</span>
          <span className="field-orbit__label field-orbit__label--c">∇ × F</span>
        </div>
      </section>

      <section className="chapter-index__catalog">
        <div className="chapter-index__catalog-header">
          <div>
            <span>EXPERIMENT CATALOG</span>
            <h2>选择一个观察尺度</h2>
          </div>
          <p>从单点向量，到曲线积分，再到局部微分、流体、物理场和三维投影。</p>
        </div>

        <div className="chapter-grid">
          {CHAPTERS.map((chapter) => (
            <button
              type="button"
              key={chapter.key}
              onClick={() => onNavigate(chapter.key)}
              className="chapter-card"
              style={{ '--card-accent': chapter.accent } as CSSProperties}
            >
              <div className="chapter-card__topline">
                <span className="chapter-card__icon"><Icon name={chapter.icon} size={21} /></span>
                <span className="chapter-card__number">{chapter.number}</span>
                <span className="chapter-card__category">{chapter.category}</span>
              </div>
              <h3>{chapter.title}</h3>
              <span className="chapter-card__english">{chapter.englishTitle}</span>
              <p>{chapter.description}</p>
              <span className="chapter-card__enter">
                进入实验 <Icon name="arrow-left" size={15} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
