const CACHE_KEY = 'usd_jpy_rate'
const CACHE_DURATION = 3_600_000 // 1 hour

interface RateCache {
  rate: number
  timestamp: number
}

export async function getUsdJpyRate(): Promise<number> {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { rate, timestamp }: RateCache = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) return rate
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    const rate: number = data.rates.JPY
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }))
    return rate
  } catch {
    if (cached) return (JSON.parse(cached) as RateCache).rate
    return 150 // fallback
  }
}
