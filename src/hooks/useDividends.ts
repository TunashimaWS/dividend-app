import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDividendStore } from '@/stores/dividendStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import { fetchDividendHistory } from '@/api/dividendData'
import { showToast } from '@/stores/toastStore'
import type { Dividend, DividendForecast, Stock } from '@/types'

export function useDividends() {
  const { user } = useAuthStore()
  const {
    dividends, forecasts,
    setDividends, setForecasts,
    addDividend, removeDividend, updateDividend,
  } = useDividendStore()

  const loadDividends = useCallback(async () => {
    if (!user) return
    try {
      const [divs, fcs] = await Promise.all([
        fetchCollection<Dividend>(user.uid, 'dividends'),
        fetchCollection<DividendForecast>(user.uid, 'dividendForecast'),
      ])
      setDividends(divs)
      setForecasts(fcs)
    } catch {
      showToast('配当データの読み込みに失敗しました')
    }
  }, [user, setDividends, setForecasts])

  const createDividend = useCallback(
    async (data: Omit<Dividend, 'id' | 'createdAt'>) => {
      if (!user) return
      try {
        const id = await addDocument(user.uid, 'dividends', data)
        addDividend({ ...data, id, createdAt: new Date().toISOString() })
      } catch {
        showToast('配当金の記録に失敗しました')
      }
    },
    [user, addDividend],
  )

  const editDividend = useCallback(
    async (id: string, data: Partial<Omit<Dividend, 'id' | 'createdAt'>>) => {
      if (!user) return
      try {
        await updateDocument(user.uid, 'dividends', id, data)
        updateDividend(id, data)
      } catch {
        showToast('配当金の更新に失敗しました')
      }
    },
    [user, updateDividend],
  )

  const deleteDividend = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await deleteDocument(user.uid, 'dividends', id)
        removeDividend(id)
      } catch {
        showToast('配当金の削除に失敗しました')
      }
    },
    [user, removeDividend],
  )

  const upsertForecast = useCallback(
    async (data: Omit<DividendForecast, 'updatedAt'> & { id?: string }) => {
      if (!user) return
      try {
        if (data.id) {
          await updateDocument(user.uid, 'dividendForecast', data.id, data)
        } else {
          await addDocument(user.uid, 'dividendForecast', data)
        }
        const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
        setForecasts(fcs)
      } catch {
        showToast('予測の保存に失敗しました')
      }
    },
    [user, setForecasts],
  )

  const deleteForecast = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await deleteDocument(user.uid, 'dividendForecast', id)
        setForecasts(forecasts.filter((f) => f.id !== id))
      } catch {
        showToast('予測の削除に失敗しました')
      }
    },
    [user, forecasts, setForecasts],
  )

  /**
   * ⑦ Stage 1: 昨年の配当記録から今年の予測を自動生成する。
   * 同じ stockId + payMonth の予測が既に存在する場合はスキップ（上書きしない）。
   */
  const generateForecastsFromHistory = useCallback(async () => {
    if (!user) return
    try {
      const lastYear = new Date().getFullYear() - 1
      const lastYearDivs = dividends.filter(
        (d) => new Date(d.receivedDate).getFullYear() === lastYear,
      )
      // 銘柄 × 月 でグループ化して合計
      const grouped = new Map<string, { stockId: string; stockName: string; payMonth: number; total: number; count: number }>()
      for (const d of lastYearDivs) {
        const month = new Date(d.receivedDate).getMonth() + 1
        const key = `${d.stockId}_${month}`
        const existing = grouped.get(key)
        if (existing) {
          existing.total += d.amount
          existing.count += 1
        } else {
          grouped.set(key, { stockId: d.stockId, stockName: d.stockName, payMonth: month, total: d.amount, count: 1 })
        }
      }
      // 既存予測のキーセット（同じ stockId + payMonth はスキップ）
      const existingKeys = new Set(forecasts.map((f) => `${f.stockId}_${f.payMonth}`))
      let added = 0
      for (const [key, item] of grouped) {
        if (existingKeys.has(key)) continue
        // forecastPerShare = 合計金額（受取総額）として保存し、Calendar 側でそのまま表示する
        await addDocument(user.uid, 'dividendForecast', {
          stockId: item.stockId,
          stockName: item.stockName,
          forecastPerShare: item.total,
          currency: 'JPY',
          confirmMonth: item.payMonth,
          payMonth: item.payMonth,
          updatedAt: new Date().toISOString(),
        } satisfies Omit<DividendForecast, 'id'>)
        added++
      }
      if (added > 0) {
        const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
        setForecasts(fcs)
        showToast(`${added}件の予測を生成しました`, 'success')
      } else {
        showToast('生成できる予測がありません（昨年の記録を先に入力してください）')
      }
    } catch {
      showToast('予測の生成に失敗しました')
    }
  }, [user, dividends, forecasts, setForecasts])

  /**
   * ⑦ Stage 3: Yahoo Finance から配当履歴を取得して既存予測を更新する。
   */
  const refreshForecastsFromYahoo = useCallback(
    async (stocks: Stock[]) => {
      if (!user) return
      try {
        let updated = 0
        for (const stock of stocks) {
          if (stock.type === 'index_fund') continue
          const history = await fetchDividendHistory(stock.code, stock.type)
          if (history.length === 0) continue
          // 直近1年の配当を月別に集計
          const oneYearAgo = Date.now() / 1000 - 365 * 24 * 3600
          const recent = history.filter((h) => h.date > oneYearAgo)
          if (recent.length === 0) continue
          for (const event of recent) {
            const payMonth = new Date(event.date * 1000).getMonth() + 1
            const existing = forecasts.find(
              (f) => f.stockId === stock.id && f.payMonth === payMonth,
            )
            const totalAmount = event.amount * stock.shares
            if (existing) {
              await updateDocument(user.uid, 'dividendForecast', existing.id, {
                forecastPerShare: totalAmount,
                updatedAt: new Date().toISOString(),
              })
              updated++
            }
          }
        }
        if (updated > 0) {
          const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
          setForecasts(fcs)
          showToast(`${updated}件の予測を更新しました`, 'success')
        } else {
          showToast('Yahoo Financeから更新できる予測がありませんでした')
        }
      } catch {
        showToast('Yahoo Financeからの更新に失敗しました')
      }
    },
    [user, forecasts, setForecasts],
  )

  return {
    dividends, forecasts, loadDividends,
    createDividend, editDividend, deleteDividend,
    upsertForecast, deleteForecast,
    generateForecastsFromHistory, refreshForecastsFromYahoo,
  }
}
