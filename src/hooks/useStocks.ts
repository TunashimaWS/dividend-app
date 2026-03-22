import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useStockStore } from '@/stores/stockStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import type { Stock } from '@/types'

export function useStocks() {
  const { user } = useAuthStore()
  const { stocks, loading, setStocks, addStock, updateStock, removeStock, setLoading } =
    useStockStore()

  const loadStocks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await fetchCollection<Stock>(user.uid, 'stocks')
      setStocks(data)
    } finally {
      setLoading(false)
    }
  }, [user, setStocks, setLoading])

  const createStock = useCallback(
    async (data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return
      const id = await addDocument(user.uid, 'stocks', data)
      addStock({
        ...data,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    [user, addStock],
  )

  const editStock = useCallback(
    async (id: string, data: Partial<Stock>) => {
      if (!user) return
      await updateDocument(user.uid, 'stocks', id, data)
      updateStock(id, data)
    },
    [user, updateStock],
  )

  const deleteStock = useCallback(
    async (id: string) => {
      if (!user) return
      await deleteDocument(user.uid, 'stocks', id)
      removeStock(id)
    },
    [user, removeStock],
  )

  return { stocks, loading, loadStocks, createStock, editStock, deleteStock }
}
