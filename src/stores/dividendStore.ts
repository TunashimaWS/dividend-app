import { create } from 'zustand'
import type { Dividend, DividendForecast } from '@/types'

interface DividendState {
  dividends: Dividend[]
  forecasts: DividendForecast[]
  setDividends: (d: Dividend[]) => void
  setForecasts: (f: DividendForecast[]) => void
  addDividend: (d: Dividend) => void
  removeDividend: (id: string) => void
}

export const useDividendStore = create<DividendState>((set) => ({
  dividends: [],
  forecasts: [],
  setDividends: (dividends) => set({ dividends }),
  setForecasts: (forecasts) => set({ forecasts }),
  addDividend: (d) => set((s) => ({ dividends: [d, ...s.dividends] })),
  removeDividend: (id) => set((s) => ({ dividends: s.dividends.filter((d) => d.id !== id) })),
}))
