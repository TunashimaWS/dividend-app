import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatJPY } from '@/lib/utils'
import type { Dividend, DividendForecast } from '@/types'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  dividends: Dividend[]
  forecasts: DividendForecast[]
  stocksMap: Record<string, number> // stockId → shares
}

export default function DividendCalendar({ dividends, forecasts, stocksMap }: Props) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-2">
      {MONTHS.map((month, i) => {
        const monthNum = i + 1
        const received = dividends.filter((d) => {
          const date = new Date(d.receivedDate)
          return date.getFullYear() === currentYear && date.getMonth() + 1 === monthNum
        })
        const expected = forecasts.filter((f) => f.payMonth === monthNum)

        if (received.length === 0 && expected.length === 0) return null

        return (
          <Card key={i}>
            <CardContent className="p-3">
              <p className="font-semibold text-sm mb-2">{month}</p>
              {received.map((d) => (
                <div key={d.id} className="flex justify-between items-center text-sm py-1">
                  <span>{d.stockName}</span>
                  <Badge>{formatJPY(d.amount)} 受取済</Badge>
                </div>
              ))}
              {expected.map((f) => {
                const shares = stocksMap[f.stockId] ?? 0
                const est = f.forecastPerShare * shares * 0.8 // approximate 20% tax
                return (
                  <div key={f.id} className="flex justify-between items-center text-sm py-1">
                    <span>{f.stockName}</span>
                    <Badge variant="outline">予想 {formatJPY(est)}</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
      {dividends.length === 0 && forecasts.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">
          配当金データがありません
        </p>
      )}
    </div>
  )
}
