import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatJPY } from '@/lib/utils'
import type { StockPnL } from '@/types'

interface Props {
  data: StockPnL[]
}

export default function PnLBarChart({ data }: Props) {
  const chartData = [...data]
    .sort((a, b) => b.pnlJPY - a.pnlJPY)
    .map((d) => ({
      name:
        d.stock.name.length > 6 ? d.stock.name.slice(0, 6) + '…' : d.stock.name,
      pnl: Math.round(d.pnlJPY),
    }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 10, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [formatJPY(Number(value ?? 0)), '損益']}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
