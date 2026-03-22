// src/stores/toastStore.ts
import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
  type: 'error' | 'success'
}

interface ToastState {
  toasts: ToastItem[]
  showToast: (message: string, type?: 'error' | 'success') => void
  removeToast: (id: string) => void
}

// Collision-safe incrementing counter (avoids duplicate IDs on rapid calls)
let _nextId = 0

// Timer handles stored outside the store to enable clearTimeout on early dismiss
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'error') => {
    const id = String(++_nextId)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    const timer = setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      timers.delete(id)
    }, 3000)
    timers.set(id, timer)
  },
  removeToast: (id) => {
    clearTimeout(timers.get(id))
    timers.delete(id)
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

// React外から呼び出せるヘルパー
export const showToast = (message: string, type: 'error' | 'success' = 'error') =>
  useToastStore.getState().showToast(message, type)
