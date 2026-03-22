import type { Stock } from '@/types'

// SBI証券「保有証券一覧」CSVパーサー
// 株式列順: 銘柄コード(0), 銘柄名(1), 保有株数(2), 貸株株数(3-空), 取得単価(4), 現在値(5)...
// 投資信託列順: ファンド名(0), 保有口数(1), 取得単価(2-空), 基準価(3), 前日比(4), 取得総額(5)...
export function parseSbiCsv(
  csvText: string,
): Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>[] {
  const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean)
  const results: Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>[] = []
  let currentAccount: 'nisa' | 'specific' | 'general' = 'specific'

  for (const line of lines) {
    // セクションヘッダーから口座種別を判定
    if (line.includes('NISA')) {
      currentAccount = 'nisa'
    } else if (line.includes('特定口座') || line.includes('証券口座')) {
      currentAccount = 'specific'
    } else if (line.includes('一般口座')) {
      currentAccount = 'general'
    }

    const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''))

    // 国内株式行: cols[0]が銘柄コード（3〜4桁数字＋任意英字）
    if (/^\d{3,4}[A-Z0-9]?$/.test(cols[0])) {
      const shares = parseInt(cols[2] ?? '0', 10)
      const avgPrice = parseFloat(cols[4] ?? '0')
      if (shares > 0 && avgPrice > 0) {
        results.push({
          name: cols[1] ?? '',
          code: cols[0],
          type: 'jp_stock' as const,
          account: currentAccount,
          shares,
          avgPrice,
          purchaseDate: new Date().toISOString().split('T')[0],
          currency: 'JPY' as const,
          memo: 'SBI証券CSVよりインポート',
        })
      }
      continue
    }

    // 投資信託行: cols[1]に「口」が含まれる
    if (cols[1]?.includes('口')) {
      const totalCost = parseFloat(cols[5] ?? '0') // 取得総額
      if (totalCost > 0) {
        const fundIndex = results.filter((r) => r.type === 'index_fund').length + 1
        results.push({
          name: cols[0] ?? '',
          code: `FUND${fundIndex}`,
          type: 'index_fund' as const,
          account: currentAccount,
          shares: 1,
          avgPrice: totalCost,
          purchaseDate: new Date().toISOString().split('T')[0],
          currency: 'JPY' as const,
          memo: 'SBI証券CSVよりインポート（投資信託）',
        })
      }
    }
  }

  return results
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
