import type { Stock } from '@/types'

// SBI証券「保有株式」CSVパーサー
// 列順: 銘柄名, 銘柄コード, 市場, 保有株数, 平均取得単価, 現在値, ...
export function parseSbiCsv(
  csvText: string,
): Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>[] {
  const lines = csvText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('銘柄') && !l.startsWith('#'))

  return lines
    .map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''))
      const code = cols[1] ?? ''
      return {
        name: cols[0] ?? '',
        code,
        type: 'jp_stock' as const,      // SBI国内株CSV → 日本株固定
        account: 'specific' as const,   // デフォルト: 特定口座（後から手動変更可）
        shares: parseFloat(cols[3] ?? '0') || 0,
        avgPrice: parseFloat(cols[4] ?? '0') || 0,
        purchaseDate: new Date().toISOString().split('T')[0], // CSVに取得日なし → 今日
        currency: 'JPY' as const,
        memo: 'SBI証券CSVよりインポート',
      }
    })
    .filter((s) => s.name && s.code)
}

// CSVエクスポート（BOM付きUTF-8でExcel対応）
export function exportStocksToCSV(stocks: Stock[]): void {
  const headers = ['銘柄名', 'コード', '種別', '口座', '保有株数', '取得単価', '現在価格', '取得日', 'メモ']
  const rows = stocks.map((s) => [
    s.name,
    s.code,
    s.type,
    s.account,
    s.shares,
    s.avgPrice,
    s.currentPrice,
    s.purchaseDate,
    s.memo,
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
