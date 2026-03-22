import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStocks } from '@/hooks/useStocks'
import { logout } from '@/hooks/useAuth'
import { exportStocksToCSV } from '@/lib/csv'
import CsvImport from '@/components/portfolio/CsvImport'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import type { Stock } from '@/types'

type ImportableStock = Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>

export default function SettingsPage() {
  const { stocks, loadStocks, createStock } = useStocks()

  useEffect(() => {
    loadStocks()
  }, [loadStocks])

  const handleImport = async (data: ImportableStock[]) => {
    for (const s of data) {
      await createStock({ ...s, currentPrice: 0 })
    }
    await loadStocks()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="設定" />
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">データ管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvImport onImport={handleImport} />
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => exportStocksToCSV(stocks)}
              disabled={stocks.length === 0}
            >
              CSVエクスポート（{stocks.length}件）
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Firebase設定はGitHub Secretsで管理されています
            </p>
            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={logout}
            >
              ログアウト
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}
