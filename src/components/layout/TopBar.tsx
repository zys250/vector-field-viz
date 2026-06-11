import type { CSSProperties } from 'react'
import Icon, { type IconName } from '../ui/Icon'

interface TopBarProps {
  title: string
  subtitle?: string
  icon: IconName
  accent: string
  onBack?: () => void
  onPanelToggle?: () => void
  isPanelOpen?: boolean
}

export default function TopBar({
  title,
  subtitle,
  icon,
  accent,
  onBack,
  onPanelToggle,
  isPanelOpen,
}: TopBarProps) {
  return (
    <div className="topbar" style={{ '--chapter-accent': accent } as CSSProperties}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="topbar__back"
          aria-label="返回实验目录"
        >
          <Icon name="arrow-left" size={18} />
        </button>
      )}

      <div className="topbar__mark">
        <Icon name={icon} size={20} />
      </div>

      <div className="topbar__titles">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>

      <div className="topbar__spacer" />
      <div className="topbar__brand">
        <span className="topbar__brand-dot" />
        Vector Field Lab
      </div>

      {onPanelToggle && (
        <button
          type="button"
          onClick={onPanelToggle}
          className={`topbar__panel-toggle ${isPanelOpen ? 'is-active' : ''}`}
          aria-label={isPanelOpen ? '收起实验面板' : '展开实验面板'}
          aria-pressed={isPanelOpen}
        >
          <Icon name="panel" size={18} />
          <span>实验面板</span>
        </button>
      )}
    </div>
  )
}
