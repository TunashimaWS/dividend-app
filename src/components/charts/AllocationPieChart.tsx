import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatJPY } from '@/lib/utils'
import type { StockPnL } from '@/types'

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#14b8a6',
]

interface Props {
  data: StockPnL[]
}

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  name: string
}

const RADIAN = Math.PI / 180

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: CustomLabelProps) {
  if (percent < 0.05) return null // hide labels for tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight="bold"
    >
      {`${name.slice(0, 4)}`}
    </text>
  )
}

export default function AllocationPieChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.currentValueJPY > 0)
    .map((d) => ({
      name: d.stock.name,
      value: Math.round(d.currentValueJPY),
    }))

  if (chartData.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={110}
          labelLine={false}
          label={(props: unknown) => <CustomLabel {...(props as CustomLabelProps)} />}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [formatJPY(Number(value ?? 0)), '評価額']}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
