import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useStocks } from '@/hooks/useStocks'
import { useDividends } from '@/hooks/useDividends'
import { fetchAllStockPrices } from '@/api/stockPrice'
import { getUsdJpyRate } from '@/api/exchangeRate'
import StockCard from '@/components/portfolio/StockCard'
import StockForm from '@/components/portfolio/StockForm'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import type { Stock, StockPnL, StockType, AccountType } from '@/types'

type StockFormData = {
  name: string
  code: string
  type: StockType
  account: AccountType
  shares: number
  avgPrice: number
  purchaseDate: string
  currency: 'JPY' | 'USD'
  memo: string
}

export default function PortfolioPage() {
  const { stocks, loading, loadStocks, createStock, editStock, deleteStock } = useStocks()
  const { dividends, loadDividends } = useDividends()
  const [usdJpy, setUsdJpy] = useState(150)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [fetchingPrices, setFetchingPrices] = useState(false)

  useEffect(() => {
    loadStocks()
    loadDividends()
    getUsdJpyRate().then(setUsdJpy)
  }, [loadStocks, loadDividends])

  // Fetch prices after stocks load
  useEffect(() => {
    if (stocks.length === 0 || fetchingPrices) return
    setFetchingPrices(true)
    fetchAllStockPrices(stocks).then((prices) => {
      Object.entries(prices).forEach(([code, price]) => {
        if (price == null) return
        const stock = stocks.find((s) => s.code === code)
        if (stock && stock.currentPrice !== price) {
          editStock(stock.id, { currentPrice: price })
        }
      })
      setFetchingPrices(false)
    })
  }, [stocks.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const annualDividendMap = useMemo(() => {
    const map = new Map<string, number>()
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)
    for (const d of dividends) {
      if (new Date(d.receivedDate) < cutoff) continue
      const jpyAmount = d.currency === 'USD' ? d.amount * usdJpy : d.amount
      map.set(d.stockId, (map.get(d.stockId) ?? 0) + jpyAmount)
    }
    return map
  }, [dividends, usdJpy])

  const pnlList = useMemo((): StockPnL[] =>
    stocks.map((stock) => {
      const rate = stock.currency === 'USD' ? usdJpy : 1
      const currentValueJPY = stock.currentPrice * stock.shares * rate
      const costBasisJPY = stock.avgPrice * stock.shares * rate
      const pnlJPY = currentValueJPY - costBasisJPY
      const pnlPercent = costBasisJPY > 0 ? (pnlJPY / costBasisJPY) * 100 : 0
      return { stock, currentValueJPY, costBasisJPY, pnlJPY, pnlPercent, annualDividendJPY: annualDividendMap.get(stock.id) }
    }), [stocks, usdJpy, annualDividendMap])

  const handleOpenAdd = () => {
    setEditingStock(null)
    setSheetOpen(true)
  }

  const handleOpenEdit = (stock: Stock) => {
    setEditingStock(stock)
    setSheetOpen(true)
  }

  const handleSubmit = async (data: StockFormData) => {
    if (editingStock) {
      await editStock(editingStock.id, data)
    } else {
      await createStock({ ...data, currentPrice: 0 })
    }
    setSheetOpen(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="ポートフォリオ"
        action={
          fetchingPrices ? (
            <span className="text-xs text-muted-foreground">株価取得中...</span>
          ) : undefined
        }
      />

      <div className="p-4 space-y-3">
        <Button className="w-full h-12 text-base" onClick={handleOpenAdd}>
          ＋ 銘柄を追加
        </Button>

        {loading && (
          <p className="text-center text-muted-foreground py-8">読み込み中...</p>
        )}

        {pnlList.map((pnl) => (
          <StockCard
            key={pnl.stock.id}
            pnl={pnl}
            onEdit={handleOpenEdit}
            onDelete={deleteStock}
          />
        ))}

        {!loading && stocks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            銘柄を追加してください
          </p>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingStock ? '銘柄を編集' : '銘柄を追加'}</SheetTitle>
          </SheetHeader>
          <StockForm
            initial={editingStock ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  )
}
