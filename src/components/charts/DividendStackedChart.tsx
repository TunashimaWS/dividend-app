// src/components/charts/DividendStackedChart.tsx
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatJPY } from '@/lib/utils'
import type { Dividend } from '@/types'

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  dividends: Dividend[]
}

export default function DividendStackedChart({ dividends }: Props) {
  const currentYear = new Date().getFullYear()

  // 月別データ（現在年）: [{ month: '1月', 'トヨタ': 5000, ... }]
  const monthlyData = useMemo(() => {
    const thisYearDivs = dividends.filter(
      (d) => new Date(d.receivedDate).getFullYear() === currentYear,
    )
    return MONTH_LABELS.map((label, i) => {
      const monthDivs = thisYearDivs.filter(
        (d) => new Date(d.receivedDate).getMonth() === i,
      )
      const entry: Record<string, number | string> = { month: label }
      for (const d of monthDivs) {
        entry[d.stockName] = ((entry[d.stockName] as number) || 0) + d.amount
      }
      return entry
    })
  }, [dividends, currentYear])

  // 月別に登場する銘柄名一覧
  const stockNames = useMemo(() => {
    const names = new Set<string>()
    dividends
      .filter((d) => new Date(d.receivedDate).getFullYear() === currentYear)
      .forEach((d) => names.add(d.stockName))
    return Array.from(names)
  }, [dividends, currentYear])

  // 年別データ
  const yearlyData = useMemo(() => {
    const years = new Map<number, number>()
    for (const d of dividends) {
      const y = new Date(d.receivedDate).getFullYear()
      years.set(y, (years.get(y) || 0) + d.amount)
    }
    return Array.from(years.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, total]) => ({ year: String(year), total }))
  }, [dividends])

  if (dividends.length === 0) return null

  return (
    <Tabs defaultValue="monthly">
      <TabsList className="w-full mb-3">
        <TabsTrigger value="monthly" className="flex-1">月別</TabsTrigger>
        <TabsTrigger value="yearly" className="flex-1">年別</TabsTrigger>
      </TabsList>

      <TabsContent value="monthly">
        <p className="text-xs text-muted-foreground mb-2">{currentYear}年 月別配当（会社別）</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatJPY(Number(value))} />
            {stockNames.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
            {stockNames.map((name, i) => (
              <Bar key={name} dataKey={name} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="yearly">
        <p className="text-xs text-muted-foreground mb-2">年間配当合計</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yearlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatJPY(Number(value))} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {yearlyData.map((entry) => (
                <Cell
                  key={entry.year}
                  fill={entry.year === String(currentYear) ? '#3b82f6' : '#64748b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  )
}
