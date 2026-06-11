import { useEffect, useState } from 'react'
import type { QualityProfile } from '../../runtime/renderBudget'
import { useRuntimeStore, type ServiceWorkerStatus } from '../../store/useRuntimeStore'

const CACHE_LABELS: Record<ServiceWorkerStatus, string> = {
  disabled: '本地应用/开发模式',
  unsupported: '浏览器不支持离线缓存',
  installing: '缓存准备中',
  ready: '离线缓存可用',
  updated: '发现新版本',
  error: '缓存异常',
}

const QUALITY_LABELS: Record<QualityProfile, string> = {
  high: '高画质',
  balanced: '均衡',
  safe: '稳定',
}

const QUALITY_TITLES: Record<QualityProfile, string> = {
  high: '60fps、120 粒子、60 条场线、38 热图网格',
  balanced: '40fps、80 粒子、42 条场线、30 热图网格',
  safe: '24fps、48 粒子、26 条场线、24 热图网格，适合平板和长时间演示',
}

const QUALITY_OPTIONS: QualityProfile[] = ['high', 'balanced', 'safe']

export default function RuntimeDock() {
  const [isOpen, setIsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => (
    typeof navigator === 'undefined' ? true : navigator.onLine
  ))
  const isAnimationPaused = useRuntimeStore((state) => state.isAnimationPaused)
  const isPowerSave = useRuntimeStore((state) => state.isPowerSave)
  const qualityProfile = useRuntimeStore((state) => state.qualityProfile)
  const frameStats = useRuntimeStore((state) => state.frameStats)
  const serviceWorkerStatus = useRuntimeStore((state) => state.serviceWorkerStatus)
  const toggleAnimationPaused = useRuntimeStore((state) => state.toggleAnimationPaused)
  const togglePowerSave = useRuntimeStore((state) => state.togglePowerSave)
  const setQualityProfile = useRuntimeStore((state) => state.setQualityProfile)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fpsLabel = frameStats.fps > 0
    ? `${Math.round(frameStats.fps)}fps / ${frameStats.frameMs.toFixed(1)}ms`
    : '等待帧'
  const loadLabel = frameStats.load === 'overloaded'
    ? '负载过高'
    : frameStats.load === 'busy'
      ? '负载偏高'
      : frameStats.load === 'ok'
        ? '负载正常'
        : '等待统计'

  return (
    <aside className={`runtime-dock ${isOpen ? 'is-open' : ''}`} aria-label="运行设置">
      <button
        type="button"
        className="runtime-dock__toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>运行设置</span>
        <strong>{QUALITY_LABELS[qualityProfile]}</strong>
      </button>

      {isOpen && (
        <div className="runtime-dock__panel">
          <div className="runtime-dock__section">
            <span className="runtime-dock__label">质量档位</span>
            <div className="runtime-dock__quality" aria-label="渲染质量档位">
              {QUALITY_OPTIONS.map((profile) => (
                <button
                  type="button"
                  key={profile}
                  title={QUALITY_TITLES[profile]}
                  className={qualityProfile === profile ? 'is-active' : ''}
                  aria-pressed={qualityProfile === profile}
                  onClick={() => setQualityProfile(profile)}
                >
                  {QUALITY_LABELS[profile]}
                </button>
              ))}
            </div>
          </div>

          <div className="runtime-dock__section runtime-dock__section--grid">
            <span className={`runtime-dock__pill is-load-${frameStats.load}`} title="当前平均绘制负载">
              {fpsLabel}
            </span>
            <span className={`runtime-dock__pill is-load-${frameStats.load}`}>
              {loadLabel}
            </span>
          </div>

          <div className="runtime-dock__section runtime-dock__actions">
            <button
              type="button"
              className={isAnimationPaused ? 'is-active' : ''}
              aria-pressed={isAnimationPaused}
              onClick={toggleAnimationPaused}
            >
              {isAnimationPaused ? '继续动画' : '暂停动画'}
            </button>
            <button
              type="button"
              className={isPowerSave ? 'is-active' : ''}
              aria-pressed={isPowerSave}
              onClick={togglePowerSave}
            >
              稳定省电
            </button>
          </div>

          <div className="runtime-dock__diagnostics">
            <span className={`runtime-dock__pill ${isOnline ? 'is-online' : 'is-offline'}`}>
              {isOnline ? '网络在线' : '网络离线'}
            </span>
            <span className={`runtime-dock__pill is-cache-${serviceWorkerStatus}`}>
              {CACHE_LABELS[serviceWorkerStatus]}
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
