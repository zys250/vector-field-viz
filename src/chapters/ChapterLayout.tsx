/**
 * 章节共享布局 — canvas 区域 + 侧边面板
 */
import { type ReactNode } from 'react'
import { useAppStore } from '../store/useAppStore'
import Icon from '../components/ui/Icon'

interface ChapterLayoutProps {
  /** 主可视化区域（canvas 或 3D scene） */
  children: ReactNode
  /** 侧边面板 */
  panel?: ReactNode
  /** 底部信息条 */
  infoBar?: ReactNode
}

export default function ChapterLayout({ children, panel, infoBar }: ChapterLayoutProps) {
  const isPanelOpen = useAppStore((state) => state.isPanelOpen)
  const setPanelOpen = useAppStore((state) => state.setPanelOpen)

  return (
    <div className="chapter-layout">
      <div className="chapter-layout__visual">{children}</div>

      {panel && isPanelOpen && (
        <>
          <button
            type="button"
            className="chapter-layout__scrim"
            onClick={() => setPanelOpen(false)}
            aria-label="关闭实验面板"
          />
          <aside className="chapter-inspector">
            <div className="chapter-inspector__content">
              <button
                type="button"
                className="chapter-inspector__close"
                onClick={() => setPanelOpen(false)}
              >
                <Icon name="panel" size={14} />
                收起面板
              </button>
              {panel}
            </div>
          </aside>
        </>
      )}

      {infoBar && (
        <div className="chapter-layout__info">{infoBar}</div>
      )}
    </div>
  )
}
