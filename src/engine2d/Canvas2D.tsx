import { useCallback, useEffect, useRef, useState } from 'react'
import { Vec2 } from '../math/Vector2'
import type { Viewport } from '../store/useSceneStore'
import { useSceneStore } from '../store/useSceneStore'
import { useRuntimeStore } from '../store/useRuntimeStore'
import { nextLowerQuality } from '../runtime/renderBudget'
import { screenToWorld, type CanvasDrawSize } from './coordinates'

interface Canvas2DProps {
  viewport: Viewport
  onDraw: (ctx: CanvasRenderingContext2D, dt: number, size: CanvasDrawSize) => void
  onPointerDown?: (worldPos: Vec2, button: number) => boolean | void
  onPointerMove?: (worldPos: Vec2) => void
  onPointerUp?: (worldPos: Vec2) => void
  onWheel?: (worldPos: Vec2, delta: number) => void
  animate?: boolean
  allowPan?: boolean
  ariaLabel?: string
  cursor?: string
}

export default function Canvas2D({
  viewport,
  onDraw,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  animate = false,
  allowPan = true,
  ariaLabel = '二维向量场可视化画布',
  cursor = 'crosshair',
}: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const lastDrawRef = useRef<number>(0)
  const nextDrawTimeRef = useRef<number>(0)
  const overloadFramesRef = useRef<number>(0)
  const statsRef = useRef({
    windowStart: 0,
    frames: 0,
    totalFrameMs: 0,
    overBudgetFrames: 0,
  })
  const panRef = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const spacePressedRef = useRef(false)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [isPanning, setIsPanning] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => (
    typeof document === 'undefined' || document.visibilityState === 'visible'
  ))
  const pan = useSceneStore((state) => state.pan)
  const setViewport = useSceneStore((state) => state.setViewport)
  const isAnimationPaused = useRuntimeStore((state) => state.isAnimationPaused)
  const qualityProfile = useRuntimeStore((state) => state.qualityProfile)
  const renderBudget = useRuntimeStore((state) => state.renderBudget)
  const setQualityProfile = useRuntimeStore((state) => state.setQualityProfile)
  const setFrameStats = useRuntimeStore((state) => state.setFrameStats)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setSize({ w: Math.floor(width), h: Math.floor(height) })
        }
      }
    })
    observer.observe(container)

    // 初始尺寸
    const rect = container.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) })
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      setIsDocumentVisible(isVisible)
      if (isVisible) {
        lastTimeRef.current = 0
        lastDrawRef.current = 0
        nextDrawTimeRef.current = 0
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    overloadFramesRef.current = 0
  }, [qualityProfile])

  const getWorldPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement> | React.WheelEvent<HTMLCanvasElement>): Vec2 => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return Vec2.zero()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      return screenToWorld(sx, sy, viewport, size.w, size.h)
    },
    [viewport, size]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const pixelWidth = Math.max(1, Math.round(size.w * dpr))
    const pixelHeight = Math.max(1, Math.round(size.h * dpr))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    const drawSize = { width: size.w, height: size.h, dpr }

    const shouldKeepAnimating = animate && isDocumentVisible && !isAnimationPaused
    const frameInterval = renderBudget.frameBudgetMs

    const publishFrameStats = (time: number, frameMs: number, overBudget: boolean) => {
      const stats = statsRef.current
      if (stats.windowStart === 0) stats.windowStart = time
      stats.frames += 1
      stats.totalFrameMs += frameMs
      if (overBudget) stats.overBudgetFrames += 1

      const elapsed = time - stats.windowStart
      if (elapsed < 500) return

      const averageFrameMs = stats.totalFrameMs / Math.max(1, stats.frames)
      const fps = stats.frames * 1000 / elapsed
      const ratio = averageFrameMs / frameInterval
      const load = ratio > 1.15
        ? 'overloaded'
        : ratio > 0.8
          ? 'busy'
          : 'ok'

      setFrameStats({
        fps,
        frameMs: averageFrameMs,
        overBudgetFrames: stats.overBudgetFrames,
        load,
        lastUpdated: Date.now(),
      })

      statsRef.current = {
        windowStart: time,
        frames: 0,
        totalFrameMs: 0,
        overBudgetFrames: 0,
      }
    }

    const drawFrame = (time: number) => {
      const dt = lastTimeRef.current
        ? Math.min((time - lastTimeRef.current) / 1000, 0.05)
        : 0.016
      lastTimeRef.current = time
      lastDrawRef.current = time

      const start = performance.now()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size.w, size.h)
      ctx.save()
      onDraw(ctx, dt, drawSize)
      ctx.restore()

      const frameMs = performance.now() - start
      const overBudget = animate && frameMs > frameInterval * 1.1
      overloadFramesRef.current = overBudget
        ? overloadFramesRef.current + 1
        : Math.max(0, overloadFramesRef.current - 3)

      publishFrameStats(time, frameMs, overBudget)

      if (overloadFramesRef.current >= 90) {
        const nextProfile = nextLowerQuality(qualityProfile)
        if (nextProfile !== qualityProfile) {
          overloadFramesRef.current = 0
          setQualityProfile(nextProfile)
        } else {
          overloadFramesRef.current = 45
        }
      }
    }

    const loop = (time: number) => {
      const canDraw = !animate ||
        nextDrawTimeRef.current === 0 ||
        time + 1 >= nextDrawTimeRef.current
      if (canDraw) {
        drawFrame(time)
        if (animate) {
          if (nextDrawTimeRef.current === 0) {
            nextDrawTimeRef.current = time + frameInterval
          } else {
            do {
              nextDrawTimeRef.current += frameInterval
            } while (nextDrawTimeRef.current <= time)
          }
        }
      }

      if (shouldKeepAnimating) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }

    lastTimeRef.current = 0
    lastDrawRef.current = 0
    nextDrawTimeRef.current = 0
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [
    size,
    viewport,
    onDraw,
    animate,
    isDocumentVisible,
    isAnimationPaused,
    qualityProfile,
    renderBudget,
    setFrameStats,
    setQualityProfile,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') spacePressedRef.current = true
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') spacePressedRef.current = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const beginPan = (e: React.PointerEvent<HTMLCanvasElement>) => {
    panRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsPanning(true)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const shouldPan = allowPan && (e.button === 1 || e.button === 2 || spacePressedRef.current)
    if (shouldPan) {
      beginPan(e)
      return
    }

    const consumed = onPointerDown?.(getWorldPos(e), e.button) === true
    if (!consumed && allowPan && e.button === 0) {
      beginPan(e)
    } else {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panRef.current?.pointerId === e.pointerId) {
      const dx = e.clientX - panRef.current.x
      const dy = e.clientY - panRef.current.y
      panRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY }
      pan(dx, dy)
    }
    onPointerMove?.(getWorldPos(e))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panRef.current?.pointerId === e.pointerId) {
      panRef.current = null
      setIsPanning(false)
    }
    onPointerUp?.(getWorldPos(e))
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const preventScroll = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', preventScroll, { passive: false })
    return () => el.removeEventListener('wheel', preventScroll)
  }, [])

  return (
    <div ref={containerRef} className="canvas2d">
      <canvas
        ref={canvasRef}
        width={Math.max(1, size.w)}
        height={Math.max(1, size.h)}
        style={{ width: size.w, height: size.h, cursor: isPanning ? 'grabbing' : cursor }}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          e.preventDefault()
          const worldPos = getWorldPos(e)
          if (onWheel) {
            onWheel(worldPos, e.deltaY)
            return
          }
          const factor = e.deltaY > 0 ? 0.88 : 1.14
          const newScale = Math.max(8, Math.min(320, viewport.scale * factor))
          const actualFactor = newScale / viewport.scale
          const newCenter = worldPos.sub(worldPos.sub(viewport.center).scale(1 / actualFactor))
          setViewport({ center: newCenter, scale: newScale })
        }}
      />
    </div>
  )
}
