import { create } from 'zustand'
import type { Stock } from '@/types'

interface StockState {
  stocks: Stock[]
  loading: boolean
  setStocks: (stocks: Stock[]) => void
  addStock: (stock: Stock) => void
  updateStock: (id: string, data: Partial<Stock>) => void
  removeStock: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useStockStore = create<StockState>((set) => ({
  stocks: [],
  loading: false,
  setStocks: (stocks) => set({ stocks }),
  addStock: (stock) => set((s) => ({ stocks: [stock, ...s.stocks] })),
  updateStock: (id, data) =>
    set((s) => ({
      stocks: s.stocks.map((st) => (st.id === id ? { ...st, ...data } : st)),
    })),
  removeStock: (id) => set((s) => ({ stocks: s.stocks.filter((st) => st.id !== id) })),
  setLoading: (loading) => set({ loading }),
}))
