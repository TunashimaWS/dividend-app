import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDividendStore } from '@/stores/dividendStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import type { Dividend, DividendForecast } from '@/types'

export function useDividends() {
  const { user } = useAuthStore()
  const { dividends, forecasts, setDividends, setForecasts, addDividend, removeDividend } =
    useDividendStore()

  const loadDividends = useCallback(async () => {
    if (!user) return
    const [divs, fcs] = await Promise.all([
      fetchCollection<Dividend>(user.uid, 'dividends'),
      fetchCollection<DividendForecast>(user.uid, 'dividendForecast'),
    ])
    setDividends(divs)
    setForecasts(fcs)
  }, [user, setDividends, setForecasts])

  const createDividend = useCallback(
    async (data: Omit<Dividend, 'id' | 'createdAt'>) => {
      if (!user) return
      const id = await addDocument(user.uid, 'dividends', data)
      addDividend({ ...data, id, createdAt: new Date().toISOString() })
    },
    [user, addDividend],
  )

  const deleteDividend = useCallback(
    async (id: string) => {
      if (!user) return
      await deleteDocument(user.uid, 'dividends', id)
      removeDividend(id)
    },
    [user, removeDividend],
  )

  const upsertForecast = useCallback(
    async (data: Omit<DividendForecast, 'updatedAt'> & { id?: string }) => {
      if (!user) return
      if (data.id) {
        await updateDocument(user.uid, 'dividendForecast', data.id, data)
      } else {
        await addDocument(user.uid, 'dividendForecast', data)
      }
      const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
      setForecasts(fcs)
    },
    [user, setForecasts],
  )

  const deleteForecast = useCallback(
    async (id: string) => {
      if (!user) return
      await deleteDocument(user.uid, 'dividendForecast', id)
      setForecasts(forecasts.filter((f) => f.id !== id))
    },
    [user, forecasts, setForecasts],
  )

  return {
    dividends,
    forecasts,
    loadDividends,
    createDividend,
    deleteDividend,
    upsertForecast,
    deleteForecast,
  }
}
