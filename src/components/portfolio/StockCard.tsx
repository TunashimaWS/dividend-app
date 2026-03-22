// src/components/portfolio/StockCard.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SwipeToDelete from '@/components/ui/SwipeToDelete'
import { formatJPY, formatUSD, formatPercent, pnlColorClass } from '@/lib/utils'
import type { Stock, StockPnL } from '@/types'

const ACCOUNT_LABELS: Record<string, string> = {
  nisa: 'NISA',
  specific: '特定',
  general: '一般',
}

const TYPE_LABELS: Record<string, string> = {
  jp_stock: '日本株',
  us_stock: '米国株',
  index_fund: 'インデックス',
}

interface Props {
  pnl: StockPnL
  onEdit: (stock: Stock) => void
  onDelete: (id: string) => void
}

export default function StockCard({ pnl, onEdit, onDelete }: Props) {
  const { stock, currentValueJPY, pnlJPY, pnlPercent, annualDividendJPY } = pnl
  const priceLabel =
    stock.currency === 'USD'
      ? formatUSD(stock.currentPrice)
      : formatJPY(stock.currentPrice)

  const yieldPercent =
    annualDividendJPY != null && currentValueJPY > 0
      ? (annualDividendJPY / currentValueJPY) * 100
      : null

  return (
    <SwipeToDelete onDelete={() => onDelete(stock.id)}>
      <Card className="rounded-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-base leading-tight">{stock.name}</p>
              <p className="text-sm text-muted-foreground">{stock.code}</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[stock.type]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {ACCOUNT_LABELS[stock.account]}
              </Badge>
              {stock.account === 'nisa' && (
                <Badge className="text-xs bg-green-600 text-white">非課税</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
            <div>
              <p className="text-muted-foreground text-xs">現在価格</p>
              <p className="font-medium">
                {stock.currentPrice > 0 ? priceLabel : '取得中...'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">評価額（円）</p>
              <p className="font-medium">{formatJPY(currentValueJPY)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">保有株数</p>
              <p className="font-medium">{stock.shares.toLocaleString()}株</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">損益</p>
              <p className={`font-semibold text-sm ${pnlColorClass(pnlJPY)}`}>
                {formatJPY(pnlJPY)}{' '}
                <span className="text-xs">({formatPercent(pnlPercent)})</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">配当利回り</p>
              <p className="font-medium text-amber-500">
                {yieldPercent != null ? `${yieldPercent.toFixed(2)}%` : '記録なし'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">年間配当（実績）</p>
              <p className="font-medium">
                {annualDividendJPY != null ? formatJPY(annualDividendJPY) : '記録なし'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-10"
            onClick={() => onEdit(stock)}
          >
            編集
          </Button>
        </CardContent>
      </Card>
    </SwipeToDelete>
  )
}
