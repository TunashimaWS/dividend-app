// 株種別
export type StockType = 'jp_stock' | 'us_stock' | 'index_fund'

// 口座種別
export type AccountType = 'nisa' | 'specific' | 'general'

// 保有株
export interface Stock {
  id: string
  name: string
  code: string           // 日本株: 4桁 / 米国株: ティッカー
  type: StockType
  account: AccountType
  shares: number
  avgPrice: number       // 取得単価（円 or ドル）
  purchaseDate: string   // ISO 8601
  currentPrice: number   // 現在株価
  currency: 'JPY' | 'USD'
  memo: string
  createdAt: string
  updatedAt: string
}

// 配当金履歴
export interface Dividend {
  id: string
  stockId: string
  stockName: string
  receivedDate: string
  amount: number         // 受取金額（税引後）
  currency: 'JPY' | 'USD'
  createdAt: string
}

// 配当予想
export interface DividendForecast {
  id: string
  stockId: string
  stockName: string
  forecastPerShare: number  // 1株あたり予想配当（税引前）
  currency: 'JPY' | 'USD'
  confirmMonth: number      // 権利確定月 (1-12)
  payMonth: number          // 支払月 (1-12)
  updatedAt: string
}

// 株主優待
export interface Benefit {
  id: string
  stockId: string
  stockName: string
  description: string    // 優待内容
  confirmMonth: number   // 権利確定月 (1-12)
  minShares: number      // 最低保有株数
  estimatedValue: number // 優待概算価値（円）
  memo: string
  createdAt: string
  updatedAt: string
}

// 取引履歴
export interface Transaction {
  id: string
  stockId: string
  stockName: string
  type: 'buy' | 'sell'
  date: string
  price: number
  shares: number
  currency: 'JPY' | 'USD'
  createdAt: string
}

// 損益計算結果
export interface StockPnL {
  stock: Stock
  currentValueJPY: number
  costBasisJPY: number
  pnlJPY: number
  pnlPercent: number
  annualDividendJPY?: number  // 過去12ヶ月の受取配当合計（円）
}

// ポートフォリオサマリー
export interface PortfolioSummary {
  totalValueJPY: number
  totalCostJPY: number
  totalPnLJPY: number
  totalPnLPercent: number
  usdJpyRate: number
}
