/**
 * 场景状态管理 — 视口、电荷、曲线等交互对象
 */
import { create } from 'zustand'
import { Vec2 } from '../math/Vector2'

export interface ChargeItem {
  id: string
  pos: Vec2
  q: number
}

export interface CurveItem {
  id: string
  points: Vec2[]
  closed: boolean
}

export interface Viewport {
  /** 视口中心在世界坐标中的位置 */
  center: Vec2
  /** 缩放比例（世界单位 → 像素） */
  scale: number
}

export interface SceneState {
  /** 2D 视口 */
  viewport: Viewport
  /** 电荷列表 */
  charges: ChargeItem[]
  /** 曲线/回路列表 */
  curves: CurveItem[]
  /** 观测点 */
  observationPoint: Vec2 | null
  /** 当前拖拽对象 ID */
  activeDragId: string | null
  /** 鼠标在世界坐标中的位置 */
  mouseWorldPos: Vec2

  /** 设置视口 */
  setViewport: (vp: Partial<Viewport>) => void
  /** 重置视口 */
  resetViewport: () => void
  /** 平移视口 */
  pan: (dx: number, dy: number) => void
  /** 缩放到某点 */
  zoom: (factor: number, anchor: Vec2) => void

  /** 添加电荷 */
  setCharges: (charges: ChargeItem[]) => void
  addCharge: (pos: Vec2, q: number) => void
  /** 移动电荷 */
  moveCharge: (id: string, pos: Vec2) => void
  /** 删除电荷 */
  removeCharge: (id: string) => void
  /** 清空电荷 */
  clearCharges: () => void

  /** 设置曲线 */
  setCurve: (id: string, points: Vec2[], closed?: boolean) => void
  /** 添加曲线顶点 */
  addCurvePoint: (id: string, point: Vec2) => void
  /** 移动曲线顶点 */
  moveCurvePoint: (curveId: string, pointIndex: number, pos: Vec2) => void
  /** 删除曲线 */
  removeCurve: (id: string) => void

  /** 设置观测点 */
  setObservationPoint: (pos: Vec2 | null) => void
  /** 设置拖拽 */
  setDrag: (id: string | null) => void
  /** 设置鼠标位置 */
  setMouseWorldPos: (pos: Vec2) => void
  /** 清理章节间共享的交互对象 */
  resetSceneObjects: () => void
}

let chargeIdCounter = 0

const DEFAULT_VIEWPORT: Viewport = {
  center: Vec2.zero(),
  scale: 56,
}

function syncChargeCounter(charges: ChargeItem[]) {
  chargeIdCounter = charges.reduce((maxId, charge) => {
    const match = /^charge-(\d+)$/.exec(charge.id)
    return match ? Math.max(maxId, Number(match[1])) : maxId
  }, 0)
}

export const useSceneStore = create<SceneState>((set) => ({
  viewport: DEFAULT_VIEWPORT,
  charges: [],
  curves: [],
  observationPoint: null,
  activeDragId: null,
  mouseWorldPos: Vec2.zero(),

  setViewport: (vp) =>
    set((s) => ({ viewport: { ...s.viewport, ...vp } })),

  resetViewport: () =>
    set({ viewport: { center: Vec2.zero(), scale: DEFAULT_VIEWPORT.scale } }),

  pan: (dx, dy) =>
    set((s) => ({
      viewport: {
        ...s.viewport,
        center: s.viewport.center.add(new Vec2(-dx / s.viewport.scale, dy / s.viewport.scale)),
      },
    })),

  zoom: (factor, anchor) =>
    set((s) => {
      const newScale = Math.max(8, Math.min(320, s.viewport.scale * factor))
      const actualFactor = newScale / s.viewport.scale
      const newCenter = anchor.sub(
        anchor.sub(s.viewport.center).scale(1 / actualFactor)
      )
      return {
        viewport: {
          center: newCenter,
          scale: newScale,
        },
      }
    }),

  setCharges: (charges) => {
    syncChargeCounter(charges)
    set({ charges: charges.map((charge) => ({ ...charge })) })
  },

  addCharge: (pos, q) =>
    set((s) => ({
      charges: [
        ...s.charges,
        { id: `charge-${++chargeIdCounter}`, pos, q },
      ],
    })),

  moveCharge: (id, pos) =>
    set((s) => ({
      charges: s.charges.map((c) => (c.id === id ? { ...c, pos } : c)),
    })),

  removeCharge: (id) =>
    set((s) => ({
      charges: s.charges.filter((c) => c.id !== id),
    })),

  clearCharges: () => {
    chargeIdCounter = 0
    set({ charges: [] })
  },

  setCurve: (id, points, closed = false) =>
    set((s) => {
      const existing = s.curves.find((c) => c.id === id)
      if (existing) {
        return {
          curves: s.curves.map((c) =>
            c.id === id ? { ...c, points, closed } : c
          ),
        }
      }
      return {
        curves: [...s.curves, { id, points, closed }],
      }
    }),

  addCurvePoint: (id, point) =>
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id === id ? { ...c, points: [...c.points, point] } : c
      ),
    })),

  moveCurvePoint: (curveId, pointIndex, pos) =>
    set((s) => ({
      curves: s.curves.map((c) => {
        if (c.id !== curveId) return c
        const newPoints = [...c.points]
        newPoints[pointIndex] = pos
        return { ...c, points: newPoints }
      }),
    })),

  removeCurve: (id) =>
    set((s) => ({
      curves: s.curves.filter((c) => c.id !== id),
    })),

  setObservationPoint: (pos) => set({ observationPoint: pos }),
  setDrag: (id) => set({ activeDragId: id }),
  setMouseWorldPos: (pos) => set({ mouseWorldPos: pos }),
  resetSceneObjects: () => set({
    curves: [],
    observationPoint: null,
    activeDragId: null,
    mouseWorldPos: Vec2.zero(),
  }),
}))
