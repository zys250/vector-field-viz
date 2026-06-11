import type { CSSProperties } from 'react'
import { CHAPTERS, type ChapterKey } from '../../config/chapters'
import Icon from '../ui/Icon'

interface BottomControlsProps {
  currentChapter: ChapterKey
  onNavigate: (chapter: ChapterKey) => void
}

export default function BottomControls({ currentChapter, onNavigate }: BottomControlsProps) {
  return (
    <nav className="chapter-nav" aria-label="实验章节">
      <div className="chapter-nav__label">EXPERIMENTS</div>
      <button
        type="button"
        onClick={() => onNavigate('index')}
        className={`chapter-nav__item ${currentChapter === 'index' ? 'is-active' : ''}`}
      >
        <span className="chapter-nav__icon"><Icon name="home" size={17} /></span>
        <span className="chapter-nav__number">00</span>
        <span className="chapter-nav__text">实验目录</span>
      </button>

      {CHAPTERS.map((chapter) => (
        <button
          type="button"
          key={chapter.key}
          onClick={() => onNavigate(chapter.key)}
          className={`chapter-nav__item ${currentChapter === chapter.key ? 'is-active' : ''}`}
          style={{ '--item-accent': chapter.accent } as CSSProperties}
        >
          <span className="chapter-nav__icon"><Icon name={chapter.icon} size={17} /></span>
          <span className="chapter-nav__number">{chapter.number}</span>
          <span className="chapter-nav__text">{chapter.shortTitle}</span>
        </button>
      ))}
    </nav>
  )
}
