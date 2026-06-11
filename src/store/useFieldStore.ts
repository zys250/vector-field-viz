/**
 * 场状态管理 — 当前选择的场类型和参数
 */
import { create } from 'zustand'
import { FIELD_PRESETS_2D, type Field2D, type FieldPreset2D } from '../math/fields'

export interface FieldState {
  /** 当前场预设 */
  activePreset: FieldPreset2D
  /** 当前场参数 */
  params: Record<string, number>
  /** 编译后的 2D 场函数 */
  field2D: Field2D

  /** 设置场预设 */
  setPreset: (key: string) => void
  /** 更新参数 */
  setParam: (key: string, value: number) => void
  /** 设置所有参数 */
  setParams: (params: Record<string, number>) => void
  /** 恢复当前预设的默认参数 */
  resetParams: () => void
}

const defaultPreset = FIELD_PRESETS_2D[0]

export const useFieldStore = create<FieldState>((set, get) => ({
  activePreset: defaultPreset,
  params: { ...defaultPreset.defaultParams },
  field2D: defaultPreset.create(defaultPreset.defaultParams),

  setPreset: (key: string) => {
    const preset = FIELD_PRESETS_2D.find((p) => p.key === key)
    if (!preset) return
    const params = { ...preset.defaultParams }
    set({
      activePreset: preset,
      params,
      field2D: preset.create(params),
    })
  },

  setParam: (key: string, value: number) => {
    const { activePreset, params } = get()
    const newParams = { ...params, [key]: value }
    set({
      params: newParams,
      field2D: activePreset.create(newParams),
    })
  },

  setParams: (newParams: Record<string, number>) => {
    const { activePreset } = get()
    const merged = { ...get().params, ...newParams }
    set({
      params: merged,
      field2D: activePreset.create(merged),
    })
  },

  resetParams: () => {
    const { activePreset } = get()
    const params = { ...activePreset.defaultParams }
    set({ params, field2D: activePreset.create(params) })
  },
}))
