import type { CanvasDrawSize } from './coordinates'

export interface CanvasLayerCache {
  canvas: HTMLCanvasElement
  key: string
  width: number
  height: number
  dpr: number
}

export function drawCachedLayer(
  cacheRef: { current: CanvasLayerCache | null },
  target: CanvasRenderingContext2D,
  size: CanvasDrawSize,
  key: string,
  render: (ctx: CanvasRenderingContext2D) => void
) {
  const pixelWidth = Math.max(1, Math.round(size.width * size.dpr))
  const pixelHeight = Math.max(1, Math.round(size.height * size.dpr))
  let cache = cacheRef.current

  if (!cache) {
    cache = {
      canvas: document.createElement('canvas'),
      key: '',
      width: 0,
      height: 0,
      dpr: 0,
    }
    cacheRef.current = cache
  }

  const isDirty = cache.key !== key ||
    cache.width !== pixelWidth ||
    cache.height !== pixelHeight ||
    cache.dpr !== size.dpr

  if (isDirty) {
    cache.canvas.width = pixelWidth
    cache.canvas.height = pixelHeight
    cache.width = pixelWidth
    cache.height = pixelHeight
    cache.dpr = size.dpr
    cache.key = key

    const ctx = cache.canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    ctx.clearRect(0, 0, size.width, size.height)
    render(ctx)
  }

  target.drawImage(cache.canvas, 0, 0, size.width, size.height)
}

export function makeLayerCacheKey(parts: Array<string | number | boolean | null | undefined>): string {
  return parts.map((part) => String(part ?? '')).join('|')
}
