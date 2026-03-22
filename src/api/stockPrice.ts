import type { StockType } from '@/types'

const CACHE_PREFIX = 'stock_price_'
const CACHE_DURATION = 900_000 // 15 minutes

interface PriceCache {
  price: number
  timestamp: number
}

export function toSymbol(code: string, type: StockType): string {
  return type === 'jp_stock' ? `${code}.T` : code
}

export async function fetchStockPrice(
  code: string,
  type: StockType,
): Promise<number | null> {
  const symbol = toSymbol(code, type)
  const cacheKey = `${CACHE_PREFIX}${symbol}`

  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    const { price, timestamp }: PriceCache = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) return price
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice as number | undefined
    if (price == null) return null
    localStorage.setItem(cacheKey, JSON.stringify({ price, timestamp: Date.now() }))
    return price
  } catch {
    if (cached) return (JSON.parse(cached) as PriceCache).price
    return null
  }
}

export async function fetchAllStockPrices(
  stocks: Array<{ code: string; type: StockType }>,
): Promise<Record<string, number | null>> {
  const results = await Promise.allSettled(
    stocks.map((s) => fetchStockPrice(s.code, s.type)),
  )
  return Object.fromEntries(
    stocks.map((s, i) => [
      s.code,
      results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<number | null>).value : null,
    ]),
  )
}

export async function fetchStockName(code: string, type: StockType): Promise<string | null> {
  const symbol = toSymbol(code, type)
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    return (meta?.shortName ?? meta?.longName ?? null) as string | null
  } catch {
    return null
  }
}
