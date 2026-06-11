/**
 * 应用外壳 — 全页布局
 */
import { type ReactNode } from 'react'
import RuntimeDock from './RuntimeDock'

interface AppShellProps {
  topBar: ReactNode
  children: ReactNode
  navigation?: ReactNode
}

export default function AppShell({ topBar, children, navigation }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        {topBar}
      </header>
      <RuntimeDock />

      <div className="app-frame">
        {navigation && <aside className="app-navigation">{navigation}</aside>}
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
