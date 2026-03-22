// src/api/dividendData.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchDividendHistory } from './dividendData'

describe('fetchDividendHistory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('配当データを正しくパースして返す', async () => {
    const mockResponse = {
      chart: {
        result: [{
          events: {
            dividends: {
              '1700000000': { amount: 25, date: 1700000000 },
              '1710000000': { amount: 30, date: 1710000000 },
            }
          }
        }]
      }
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await fetchDividendHistory('7203', 'jp_stock')
    expect(result).toHaveLength(2)
    expect(result[0].amount).toBe(25)
    expect(result[1].amount).toBe(30)
  })

  it('APIエラー時は空配列を返す', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network error'))
    const result = await fetchDividendHistory('7203', 'jp_stock')
    expect(result).toEqual([])
  })

  it('配当データなしの場合は空配列を返す', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ chart: { result: [{ meta: {} }] } }),
    } as Response)
    const result = await fetchDividendHistory('7203', 'jp_stock')
    expect(result).toEqual([])
  })
})
