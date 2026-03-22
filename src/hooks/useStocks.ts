import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useStockStore } from '@/stores/stockStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import { showToast } from '@/stores/toastStore'
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
    } catch {
      showToast('株データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user, setStocks, setLoading])

  const createStock = useCallback(
    async (data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return
      try {
        const id = await addDocument(user.uid, 'stocks', data)
        addStock({
          ...data,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } catch {
        showToast('銘柄の追加に失敗しました')
      }
    },
    [user, addStock],
  )

  const editStock = useCallback(
    async (id: string, data: Partial<Stock>) => {
      if (!user) return
      try {
        await updateDocument(user.uid, 'stocks', id, data)
        updateStock(id, data)
      } catch {
        showToast('銘柄の更新に失敗しました')
      }
    },
    [user, updateStock],
  )

  const deleteStock = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await deleteDocument(user.uid, 'stocks', id)
        removeStock(id)
      } catch {
        showToast('銘柄の削除に失敗しました')
      }
    },
    [user, removeStock],
  )

  const clearAllStocks = useCallback(async () => {
    if (!user) return
    try {
      const current = useStockStore.getState().stocks
      await Promise.all(current.map((s) => deleteDocument(user.uid, 'stocks', s.id)))
      setStocks([])
    } catch {
      showToast('全銘柄の削除に失敗しました')
    }
  }, [user, setStocks])

  return { stocks, loading, loadStocks, createStock, editStock, deleteStock, clearAllStocks }
}
