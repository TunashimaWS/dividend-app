import { create } from 'zustand'
import type { Benefit } from '@/types'

interface BenefitState {
  benefits: Benefit[]
  setBenefits: (b: Benefit[]) => void
  addBenefit: (b: Benefit) => void
  updateBenefit: (id: string, data: Partial<Benefit>) => void
  removeBenefit: (id: string) => void
}

export const useBenefitStore = create<BenefitState>((set) => ({
  benefits: [],
  setBenefits: (benefits) => set({ benefits }),
  addBenefit: (b) => set((s) => ({ benefits: [b, ...s.benefits] })),
  updateBenefit: (id, data) =>
    set((s) => ({ benefits: s.benefits.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
  removeBenefit: (id) => set((s) => ({ benefits: s.benefits.filter((b) => b.id !== id) })),
}))
