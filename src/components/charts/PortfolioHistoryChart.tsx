import { useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { PortfolioSnapshot } from '@/types'

type Period = '1M' | '6M' | '1Y' | '3Y' | '5Y'

const PERIODS: { label: string; days: number; value: Period }[] = [
  { label: '1ヶ月', days: 30,   value: '1M' },
  { label: '6ヶ月', days: 180,  value: '6M' },
  { label: '1年',   days: 365,  value: '1Y' },
  { label: '3年',   days: 1095, value: '3Y' },
  { label: '5年',   days: 1825, value: '5Y' },
]

interface Props {
  snapshots: PortfolioSnapshot[]
}

export default function PortfolioHistoryChart({ snapshots }: Props) {
  const [period, setPeriod] = useState<Period>('1Y')

  const filtered = useMemo(() => {
    const days = PERIODS.find(p => p.value === period)!.days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return snapshots.filter(s => s.date >= cutoffStr)
  }, [snapshots, period])

  const formatXAxis = (dateStr: string) => {
    const d = new Date(dateStr)
    if (period === '1M' || period === '6M') {
      return `${d.getMonth() + 1}/${d.getDate()}`
    }
    return `${String(d.getFullYear()).slice(2)}/${d.getMonth() + 1}`
  }

  const formatYAxis = (value: number) => {
    if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}億`
    if (value >= 10_000)     return `${Math.round(value / 10_000)}万`
    return String(value)
  }

  if (snapshots.length === 0) {
    return (
      <p className="h-32 flex items-center justify-center text-xs text-muted-foreground text-center px-4">
        データ蓄積中です。アプリを開くたびに資産額が記録されます。
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* 期間セレクター */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1.5 text-xs rounded transition-colors ${
              period === p.value
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filtered.length < 2 ? (
        <p className="h-32 flex items-center justify-center text-xs text-muted-foreground">
          この期間のデータがまだありません
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={filtered} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
            <Tooltip
              formatter={(value) => [
                new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(value)),
                '評価額',
              ]}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="totalValueJPY"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#portfolioGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
