// src/api/dividendData.ts
import type { StockType } from '@/types'
import { toSymbol } from '@/api/stockPrice'  // Task 4 でエクスポートした共通ヘルパーを再利用

export interface YahooDividendEvent {
  amount: number   // 1株あたり配当額
  date: number     // UNIXタイムスタンプ（秒）
}

/**
 * Yahoo Finance から過去2年の配当履歴を取得する。
 * allorigins.win プロキシ経由（CORS対策）。
 * 失敗時は空配列を返す（エラーをthrowしない）。
 */
export async function fetchDividendHistory(
  code: string,
  type: StockType,
): Promise<YahooDividendEvent[]> {
  const symbol = toSymbol(code, type)
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?events=div&range=2y&interval=1d`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) return []
    const data = await res.json()
    const rawDivs = data?.chart?.result?.[0]?.events?.dividends as
      | Record<string, { amount: number; date: number }>
      | undefined
    if (!rawDivs) return []
    return Object.values(rawDivs).sort((a, b) => a.date - b.date)
  } catch {
    return []
  }
}
