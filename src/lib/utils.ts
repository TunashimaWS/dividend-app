import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 円フォーマット: 1234567 → "¥1,234,567"
export function formatJPY(value: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value)
}

// ドルフォーマット: 1234.5 → "$1,234.50"
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// 損益率フォーマット: 12.345 → "+12.3%"
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// 損益の色クラス
export function pnlColorClass(value: number): string {
  if (value > 0) return 'text-blue-600 dark:text-blue-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-muted-foreground'
}
