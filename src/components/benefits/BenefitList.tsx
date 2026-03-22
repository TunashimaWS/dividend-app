import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SwipeToDelete from '@/components/ui/SwipeToDelete'
import type { Benefit } from '@/types'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  benefits: Benefit[]
  onEdit: (b: Benefit) => void
  onDelete: (id: string) => void
}

export default function BenefitList({ benefits, onEdit, onDelete }: Props) {
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="space-y-3">
      {benefits.map((b) => {
        const monthsUntil = ((b.confirmMonth - currentMonth + 12) % 12) || 12
        const isAlert = monthsUntil <= 2
        return (
          <SwipeToDelete onDelete={() => onDelete(b.id)}>
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold">{b.stockName}</p>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {isAlert && <Badge variant="destructive">もうすぐ権利確定</Badge>}
                    <Badge variant="outline">{MONTHS[b.confirmMonth - 1]}権利確定</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{b.description}</p>
                <p className="text-sm">
                  最低 {b.minShares}株 ·{' '}
                  概算価値 ¥{b.estimatedValue.toLocaleString()}
                </p>
                {b.memo && <p className="text-xs text-muted-foreground mt-1">{b.memo}</p>}
                <Button variant="outline" size="sm" className="w-full h-10 mt-3" onClick={() => onEdit(b)}>
                  編集
                </Button>
              </CardContent>
            </Card>
          </SwipeToDelete>
        )
      })}
      {benefits.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">
          株主優待データがありません
        </p>
      )}
    </div>
  )
}
