import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDividends } from '@/hooks/useDividends'
import { useStocks } from '@/hooks/useStocks'
import { formatJPY } from '@/lib/utils'
import DividendCalendar from '@/components/dividends/DividendCalendar'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}月` }))

export default function DividendsPage() {
  const { dividends, forecasts, loadDividends, createDividend, deleteDividend } = useDividends()
  const { stocks, loadStocks } = useStocks()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState({
    stockName: '',
    stockId: '',
    receivedDate: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'JPY' as 'JPY' | 'USD',
  })

  useEffect(() => {
    loadDividends()
    loadStocks()
  }, [loadDividends, loadStocks])

  const stocksMap = useMemo(
    () => Object.fromEntries(stocks.map((s) => [s.id, s.shares])),
    [stocks],
  )

  const totalThisYear = dividends
    .filter((d) => new Date(d.receivedDate).getFullYear() === new Date().getFullYear())
    .reduce((sum, d) => sum + d.amount, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createDividend({
      stockId: form.stockId,
      stockName: form.stockName,
      receivedDate: form.receivedDate,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
    })
    setSheetOpen(false)
    setForm({ stockName: '', stockId: '', receivedDate: new Date().toISOString().split('T')[0], amount: '', currency: 'JPY' })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="配当金管理" />

      <div className="p-4 space-y-4">
        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">今年の配当金合計</p>
            <p className="text-2xl font-bold mt-1">{formatJPY(totalThisYear)}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date().getFullYear()}年累計</p>
          </CardContent>
        </Card>

        <Button className="w-full h-12" onClick={() => setSheetOpen(true)}>
          ＋ 配当金を記録
        </Button>

        <Tabs defaultValue="calendar">
          <TabsList className="w-full">
            <TabsTrigger value="calendar" className="flex-1">カレンダー</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">履歴</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-3">
            <DividendCalendar dividends={dividends} forecasts={forecasts} stocksMap={stocksMap} />
          </TabsContent>
          <TabsContent value="history" className="mt-3">
            <div className="space-y-2">
              {dividends.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{d.stockName}</p>
                      <p className="text-xs text-muted-foreground">{d.receivedDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{formatJPY(d.amount)}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8 px-2"
                        onClick={() => deleteDividend(d.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dividends.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  配当金の記録がありません
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Dividend Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto overflow-y-auto pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>配当金を記録</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>銘柄を選択</Label>
              <Select
                value={form.stockId}
                onValueChange={(id) => {
                  const stock = stocks.find((s) => s.id === id)
                  setForm((f) => ({ ...f, stockId: id, stockName: stock?.name ?? '' }))
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="銘柄を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {stocks.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>受取日</Label>
              <Input
                type="date"
                value={form.receivedDate}
                onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>受取金額（税引後）</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="h-12"
                placeholder="0"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setSheetOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" className="flex-1 h-12">保存</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  )
}
