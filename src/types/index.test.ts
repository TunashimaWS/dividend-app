import { describe, it, expect } from 'vitest'
import type { Stock, Dividend, Benefit } from './index'

describe('型定義の確認', () => {
  it('Stock型が正しく定義されている', () => {
    const stock: Stock = {
      id: 'test-id',
      name: 'トヨタ自動車',
      code: '7203',
      type: 'jp_stock',
      account: 'nisa',
      shares: 100,
      avgPrice: 2500,
      purchaseDate: '2024-01-15',
      currentPrice: 2800,
      currency: 'JPY',
      memo: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(stock.name).toBe('トヨタ自動車')
    expect(stock.type).toBe('jp_stock')
  })

  it('Dividend型が正しく定義されている', () => {
    const dividend: Dividend = {
      id: 'div-1',
      stockId: 'stock-1',
      stockName: 'トヨタ自動車',
      receivedDate: '2024-06-30',
      amount: 5000,
      currency: 'JPY',
      createdAt: new Date().toISOString(),
    }
    expect(dividend.amount).toBe(5000)
  })

  it('Benefit型が正しく定義されている', () => {
    const benefit: Benefit = {
      id: 'benefit-1',
      stockId: 'stock-1',
      stockName: 'イオン',
      description: 'オーナーズカード 3%キャッシュバック',
      confirmMonth: 2,
      minShares: 100,
      estimatedValue: 3000,
      memo: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(benefit.confirmMonth).toBe(2)
  })
})
