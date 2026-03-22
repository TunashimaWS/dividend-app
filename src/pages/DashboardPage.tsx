import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStocks } from '@/hooks/useStocks'
import { useDividends } from '@/hooks/useDividends'
import { getUsdJpyRate } from '@/api/exchangeRate'
import { fetchAllStockPrices } from '@/api/stockPrice'
import { formatJPY, formatPercent, pnlColorClass } from '@/lib/utils'
import PnLBarChart from '@/components/charts/PnLBarChart'
import AllocationPieChart from '@/components/charts/AllocationPieChart'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import type { StockPnL } from '@/types'

export default function DashboardPage() {
  const { stocks, loadStocks, editStock } = useStocks()
  const { dividends, loadDividends } = useDividends()
  const [usdJpy, setUsdJpy] = useState(150)

  useEffect(() => {
    loadStocks()
    loadDividends()
    getUsdJpyRate().then(setUsdJpy)
  }, [loadStocks, loadDividends])

  // Fetch prices after stocks load
  useEffect(() => {
    if (stocks.length === 0) return
    fetchAllStockPrices(stocks).then((prices) => {
      Object.entries(prices).forEach(([code, price]) => {
        if (price == null) return
        const stock = stocks.find((s) => s.code === code)
        if (stock && stock.currentPrice !== price) {
          editStock(stock.id, { currentPrice: price })
        }
      })
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

  const totalValueJPY = pnlList.reduce((s, d) => s + d.currentValueJPY, 0)
  const totalCostJPY = pnlList.reduce((s, d) => s + d.costBasisJPY, 0)
  const totalPnLJPY = totalValueJPY - totalCostJPY
  const totalPnLPercent = totalCostJPY > 0 ? (totalPnLJPY / totalCostJPY) * 100 : 0

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="ダッシュボード" />

      <div className="p-4 space-y-4">
        {/* Portfolio Summary */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">総評価額</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              {formatJPY(totalValueJPY)}
            </p>
            <p className={`text-lg font-semibold mt-1 tabular-nums ${pnlColorClass(totalPnLJPY)}`}>
              {formatJPY(totalPnLJPY)}{' '}
              <span className="text-base">({formatPercent(totalPnLPercent)})</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              USD/JPY: {usdJpy.toFixed(2)} · {stocks.length}銘柄
            </p>
          </CardContent>
        </Card>

        {/* Charts (only when we have data) */}
        {pnlList.length > 0 && (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">ポートフォリオ分析</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Tabs defaultValue="pnl">
                <TabsList className="w-full mb-3">
                  <TabsTrigger value="pnl" className="flex-1">損益</TabsTrigger>
                  <TabsTrigger value="alloc" className="flex-1">構成</TabsTrigger>
                </TabsList>
                <TabsContent value="pnl">
                  <PnLBarChart data={pnlList} />
                </TabsContent>
                <TabsContent value="alloc">
                  <AllocationPieChart data={pnlList} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {stocks.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-muted-foreground text-sm">
              「株」タブから銘柄を追加してください
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
