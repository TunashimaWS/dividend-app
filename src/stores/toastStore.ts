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

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'error') => {
    const id = Date.now().toString()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// React外から呼び出せるヘルパー
export const showToast = (message: string, type: 'error' | 'success' = 'error') =>
  useToastStore.getState().showToast(message, type)
