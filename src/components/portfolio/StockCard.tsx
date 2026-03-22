import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  const { stock, currentValueJPY, pnlJPY, pnlPercent } = pnl
  const priceLabel =
    stock.currency === 'USD'
      ? formatUSD(stock.currentPrice)
      : formatJPY(stock.currentPrice)

  const handleDelete = () => {
    if (confirm(`${stock.name}を削除しますか？`)) {
      onDelete(stock.id)
    }
  }

  return (
    <Card>
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
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10"
            onClick={() => onEdit(stock)}
          >
            編集
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 h-10"
            onClick={handleDelete}
          >
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
