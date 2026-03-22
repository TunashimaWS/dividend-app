# 配当金管理Webアプリ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** iPhoneで快適に使える個人投資家向け配当金・ポートフォリオ管理Webアプリを構築し、GitHub Pagesで無料公開する。

**Architecture:** React 18 + TypeScript + Vite のSPAとしてブラウザ上で動作。Firebase AuthenticationとFirestoreでご夫婦2名のデータを分離管理。Yahoo Finance非公式APIとExchangeRate-APIで株価・為替を自動取得。GitHub Actionsで自動ビルド・GitHub Pagesにデプロイ。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Firebase v10, Recharts, Vitest, React Testing Library

**Spec:** `配当金管理アプリ_仕様書.docx`（プロジェクトルート）

---

## ファイル構造

```
配当金アプリ/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: ビルド & GitHub Pagesデプロイ
├── docs/
│   └── superpowers/
│       └── plans/
│           └── 2026-03-22-dividend-app.md
├── public/
│   └── vite.svg
├── src/
│   ├── main.tsx                # エントリーポイント
│   ├── App.tsx                 # ルーティング設定
│   ├── vite-env.d.ts
│   │
│   ├── lib/
│   │   ├── firebase.ts         # Firebase初期化
│   │   ├── firestore.ts        # Firestoreのヘルパー関数
│   │   └── utils.ts            # 共通ユーティリティ（数値フォーマット等）
│   │
│   ├── api/
│   │   ├── stockPrice.ts       # Yahoo Finance API呼び出し
│   │   └── exchangeRate.ts     # ExchangeRate-API呼び出し
│   │
│   ├── types/
│   │   └── index.ts            # 全型定義（Stock, Dividend, Benefit等）
│   │
│   ├── stores/
│   │   ├── authStore.ts        # 認証状態（Zustand）
│   │   ├── stockStore.ts       # 保有株データ
│   │   ├── dividendStore.ts    # 配当金データ
│   │   └── benefitStore.ts     # 株主優待データ
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # 認証フック
│   │   ├── useStocks.ts        # 株データ取得・操作フック
│   │   ├── useDividends.ts     # 配当金フック
│   │   └── useBenefits.ts      # 優待フック
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/uiコンポーネント（自動生成）
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx   # ボトムナビゲーションバー
│   │   │   ├── PageHeader.tsx  # ページヘッダー
│   │   │   └── ProtectedRoute.tsx  # 認証ガード
│   │   ├── portfolio/
│   │   │   ├── StockCard.tsx       # 銘柄カード
│   │   │   ├── StockForm.tsx       # 銘柄追加・編集フォーム
│   │   │   └── CsvImport.tsx       # CSVインポートコンポーネント
│   │   ├── charts/
│   │   │   ├── PnLBarChart.tsx     # 損益棒グラフ
│   │   │   ├── AllocationPieChart.tsx  # 構成比円グラフ
│   │   │   └── DividendBarChart.tsx    # 配当金棒グラフ
│   │   ├── dividends/
│   │   │   ├── DividendCalendar.tsx    # 配当金カレンダー
│   │   │   ├── DividendList.tsx        # 配当履歴一覧
│   │   │   └── DividendForm.tsx        # 配当金記録フォーム
│   │   └── benefits/
│   │       ├── BenefitList.tsx         # 優待一覧
│   │       └── BenefitForm.tsx         # 優待追加フォーム
│   │
│   └── pages/
│       ├── LoginPage.tsx       # ログイン画面
│       ├── DashboardPage.tsx   # ダッシュボード（トップ）
│       ├── PortfolioPage.tsx   # ポートフォリオ管理
│       ├── DividendsPage.tsx   # 配当金管理
│       ├── BenefitsPage.tsx    # 株主優待管理
│       └── SettingsPage.tsx    # 設定・CSVインポート/エクスポート
│
├── firestore.rules             # Firestoreセキュリティルール
├── .env.example                # 環境変数テンプレート（.envはgitignore）
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Task 1: プロジェクトセットアップ

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- Create: `.gitignore`, `.env.example`

- [ ] **Step 1: Vite + React + TypeScript プロジェクトを初期化**

```bash
cd "C:\Users\Tomioka\Desktop\Tsunashima_Works\迂回生産\配当金アプリ"
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: 依存パッケージをインストール**

```bash
npm install firebase zustand react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer @types/node vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npx tailwindcss init -p
```

- [ ] **Step 3: shadcn/ui をセットアップ**

```bash
npx shadcn@latest init
```

プロンプトでの選択:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 4: shadcn/ui コンポーネントを追加**

```bash
npx shadcn@latest add button card input label select dialog sheet tabs badge alert
```

- [ ] **Step 5: `vite.config.ts` を更新（GitHub Pages対応・テスト設定）**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/配当金アプリ/',  // ← GitHubリポジトリ名に合わせて変更すること
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 6: `src/test-setup.ts` を作成**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 7: `tailwind.config.ts` を更新**

```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
```

- [ ] **Step 8: `.env.example` を作成**

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

- [ ] **Step 9: `.gitignore` に `.env` を追加（既存に追記）**

```
.env
.env.local
```

- [ ] **Step 10: 動作確認**

```bash
npm run dev
```

ブラウザで `http://localhost:5173/配当金アプリ/` にアクセスして画面が表示されることを確認。

- [ ] **Step 11: git初期化・初回コミット**

```bash
git init
git add .
git commit -m "feat: initial project setup with Vite + React + TypeScript + Tailwind + shadcn/ui"
```

---

## Task 2: 型定義

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: テストを書く**

```typescript
// src/types/index.test.ts
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
      memo: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(stock.name).toBe('トヨタ自動車')
    expect(stock.type).toBe('jp_stock')
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx vitest run src/types/index.test.ts
```

- [ ] **Step 3: `src/types/index.ts` を実装**

```typescript
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
  currentPrice: number   // 現在株価（自動取得 or 手動）
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
  currentValueJPY: number  // 現在評価額（円換算）
  costBasisJPY: number      // 取得総額（円換算）
  pnlJPY: number            // 損益金額（円）
  pnlPercent: number        // 損益率（%）
}

// ポートフォリオサマリー
export interface PortfolioSummary {
  totalValueJPY: number
  totalCostJPY: number
  totalPnLJPY: number
  totalPnLPercent: number
  usdJpyRate: number
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx vitest run src/types/index.test.ts
```

- [ ] **Step 5: コミット**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: Firebase セットアップ

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `firestore.rules`

> **前提:** Firebaseプロジェクトを事前に作成すること。
> 1. https://console.firebase.google.com/ でプロジェクト作成
> 2. Authentication → ログイン方法 → メール/パスワード を有効化
> 3. Firestore Database → データベースを作成（本番モード）
> 4. プロジェクト設定 → Webアプリを追加 → 設定値をコピー

- [ ] **Step 1: `.env` を作成して Firebase 設定値を入力**

```bash
cp .env.example .env
# .envを開いて実際のFirebase設定値を入力
```

- [ ] **Step 2: `src/lib/firebase.ts` を作成**

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

- [ ] **Step 3: `firestore.rules` を作成（セキュリティルール）**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ログインユーザーは自分のデータのみ読み書き可能
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> Firestoreコンソールの「ルール」タブに上記を貼り付けて公開すること。

- [ ] **Step 4: `src/lib/firestore.ts` を作成（Firestoreヘルパー）**

```typescript
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// ユーザーのコレクション参照を返すユーティリティ
export const userCollection = (userId: string, collectionName: string) =>
  collection(db, 'users', userId, collectionName)

export const userDoc = (userId: string, collectionName: string, docId: string) =>
  doc(db, 'users', userId, collectionName, docId)

// 汎用CRUD
export async function fetchCollection<T>(userId: string, name: string): Promise<T[]> {
  const q = query(userCollection(userId, name), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
}

export async function addDocument<T extends object>(
  userId: string, collectionName: string, data: T
): Promise<string> {
  const ref = await addDoc(userCollection(userId, collectionName), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return ref.id
}

export async function updateDocument<T extends object>(
  userId: string, collectionName: string, docId: string, data: Partial<T>
): Promise<void> {
  await updateDoc(userDoc(userId, collectionName, docId), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteDocument(
  userId: string, collectionName: string, docId: string
): Promise<void> {
  await deleteDoc(userDoc(userId, collectionName, docId))
}
```

- [ ] **Step 5: コミット**

```bash
git add src/lib/ firestore.rules .env.example
git commit -m "feat: add Firebase setup and Firestore helpers"
```

---

## Task 4: 認証機能

**Files:**
- Create: `src/stores/authStore.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/components/layout/ProtectedRoute.tsx`

- [ ] **Step 1: `src/stores/authStore.ts` を作成**

```typescript
import { create } from 'zustand'
import type { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
```

- [ ] **Step 2: `src/hooks/useAuth.ts` を作成**

```typescript
import { useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore()
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [setUser, setLoading])
}

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  await signOut(auth)
}
```

- [ ] **Step 3: `src/pages/LoginPage.tsx` を作成**

```tsx
import { useState } from 'react'
import { login } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">配当金管理アプリ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: `src/components/layout/ProtectedRoute.tsx` を作成**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 5: `src/App.tsx` を実装（ルーティング）**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PortfolioPage from '@/pages/PortfolioPage'
import DividendsPage from '@/pages/DividendsPage'
import BenefitsPage from '@/pages/BenefitsPage'
import SettingsPage from '@/pages/SettingsPage'

function AppRoutes() {
  useAuthInit()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
      <Route path="/dividends" element={<ProtectedRoute><DividendsPage /></ProtectedRoute>} />
      <Route path="/benefits" element={<ProtectedRoute><BenefitsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/配当金アプリ">
      <AppRoutes />
    </BrowserRouter>
  )
}
```

> ⚠️ `basename` は GitHubリポジトリ名に合わせて変更すること。

- [ ] **Step 6: 各ページのスタブを作成（後で実装する）**

```bash
# 以下のファイルをそれぞれ作成（最小限のスタブ）
```

`src/pages/DashboardPage.tsx`:
```tsx
export default function DashboardPage() { return <div>ダッシュボード（実装予定）</div> }
```
同様に `PortfolioPage.tsx`, `DividendsPage.tsx`, `BenefitsPage.tsx`, `SettingsPage.tsx` を作成。

- [ ] **Step 7: 動作確認**

```bash
npm run dev
```

`http://localhost:5173/配当金アプリ/` にアクセスしてログイン画面が表示されること。Firebaseに登録したメール/パスでログインできること。

- [ ] **Step 8: コミット**

```bash
git add src/
git commit -m "feat: add authentication with Firebase Auth"
```

---

## Task 5: 株価・為替API

**Files:**
- Create: `src/api/stockPrice.ts`
- Create: `src/api/exchangeRate.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: `src/api/exchangeRate.ts` を作成**

```typescript
// USD/JPY 為替レートを取得
// ExchangeRate-API 無料プランを使用
const CACHE_KEY = 'usd_jpy_rate'
const CACHE_DURATION = 3600000 // 1時間キャッシュ

interface RateCache {
  rate: number
  timestamp: number
}

export async function getUsdJpyRate(): Promise<number> {
  // キャッシュ確認
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { rate, timestamp }: RateCache = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) return rate
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json()
    const rate: number = data.rates.JPY
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }))
    return rate
  } catch {
    // キャッシュが古くてもフォールバックとして使用
    if (cached) return JSON.parse(cached).rate
    return 150 // 最終フォールバック
  }
}
```

- [ ] **Step 2: `src/api/stockPrice.ts` を作成**

```typescript
// Yahoo Finance 非公式API（CORS プロキシ経由）
// ⚠️ 非公式APIのため不安定な場合がある。エラー時は手動価格にフォールバック。

const CACHE_PREFIX = 'stock_price_'
const CACHE_DURATION = 900000 // 15分キャッシュ

interface PriceCache {
  price: number
  timestamp: number
}

export async function fetchStockPrice(code: string, type: 'jp_stock' | 'us_stock' | 'index_fund'): Promise<number | null> {
  // 日本株はコード.T 形式
  const symbol = type === 'jp_stock' ? `${code}.T` : code

  const cacheKey = `${CACHE_PREFIX}${symbol}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    const { price, timestamp }: PriceCache = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) return price
  }

  try {
    // Yahoo Finance 非公式API（allorigins プロキシ経由でCORS回避）
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl)
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice as number | undefined
    if (!price) return null
    localStorage.setItem(cacheKey, JSON.stringify({ price, timestamp: Date.now() }))
    return price
  } catch {
    if (cached) return JSON.parse(cached).price
    return null
  }
}

// 複数銘柄を並列取得
export async function fetchAllStockPrices(
  stocks: Array<{ code: string; type: 'jp_stock' | 'us_stock' | 'index_fund' }>
): Promise<Record<string, number | null>> {
  const results = await Promise.allSettled(
    stocks.map(s => fetchStockPrice(s.code, s.type))
  )
  return Object.fromEntries(
    stocks.map((s, i) => [
      s.code,
      results[i].status === 'fulfilled' ? results[i].value : null
    ])
  )
}
```

- [ ] **Step 3: `src/lib/utils.ts` を作成（数値フォーマット）**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
```

- [ ] **Step 4: コミット**

```bash
git add src/api/ src/lib/utils.ts
git commit -m "feat: add stock price and exchange rate API integrations"
```

---

## Task 6: ポートフォリオ管理（CRUD）

**Files:**
- Create: `src/stores/stockStore.ts`
- Create: `src/hooks/useStocks.ts`
- Create: `src/components/portfolio/StockForm.tsx`
- Create: `src/components/portfolio/StockCard.tsx`
- Create: `src/components/portfolio/StockList.tsx`
- Modify: `src/pages/PortfolioPage.tsx`

- [ ] **Step 1: `src/stores/stockStore.ts` を作成**

```typescript
import { create } from 'zustand'
import type { Stock } from '@/types'

interface StockState {
  stocks: Stock[]
  loading: boolean
  setStocks: (stocks: Stock[]) => void
  addStock: (stock: Stock) => void
  updateStock: (id: string, stock: Partial<Stock>) => void
  removeStock: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useStockStore = create<StockState>((set) => ({
  stocks: [],
  loading: false,
  setStocks: (stocks) => set({ stocks }),
  addStock: (stock) => set((s) => ({ stocks: [stock, ...s.stocks] })),
  updateStock: (id, data) => set((s) => ({
    stocks: s.stocks.map(st => st.id === id ? { ...st, ...data } : st)
  })),
  removeStock: (id) => set((s) => ({ stocks: s.stocks.filter(st => st.id !== id) })),
  setLoading: (loading) => set({ loading }),
}))
```

- [ ] **Step 2: `src/hooks/useStocks.ts` を作成**

```typescript
import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useStockStore } from '@/stores/stockStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import type { Stock } from '@/types'

export function useStocks() {
  const { user } = useAuthStore()
  const { stocks, loading, setStocks, addStock, updateStock, removeStock, setLoading } = useStockStore()

  const loadStocks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await fetchCollection<Stock>(user.uid, 'stocks')
      setStocks(data)
    } finally {
      setLoading(false)
    }
  }, [user, setStocks, setLoading])

  const createStock = useCallback(async (data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return
    const id = await addDocument(user.uid, 'stocks', data)
    addStock({ ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }, [user, addStock])

  const editStock = useCallback(async (id: string, data: Partial<Stock>) => {
    if (!user) return
    await updateDocument(user.uid, 'stocks', id, data)
    updateStock(id, data)
  }, [user, updateStock])

  const deleteStock = useCallback(async (id: string) => {
    if (!user) return
    await deleteDocument(user.uid, 'stocks', id)
    removeStock(id)
  }, [user, removeStock])

  return { stocks, loading, loadStocks, createStock, editStock, deleteStock }
}
```

- [ ] **Step 3: `src/components/portfolio/StockForm.tsx` を作成**

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Stock, StockType, AccountType } from '@/types'

type StockFormData = Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>

interface Props {
  initial?: Partial<StockFormData>
  onSubmit: (data: StockFormData) => Promise<void>
  onCancel: () => void
}

const STOCK_TYPE_LABELS: Record<StockType, string> = {
  jp_stock: '日本株',
  us_stock: '米国株',
  index_fund: 'インデックスファンド',
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  nisa: 'NISA口座',
  specific: '特定口座',
  general: '一般口座',
}

export default function StockForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<StockFormData>({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    type: initial?.type ?? 'jp_stock',
    account: initial?.account ?? 'nisa',
    shares: initial?.shares ?? 0,
    avgPrice: initial?.avgPrice ?? 0,
    purchaseDate: initial?.purchaseDate ?? new Date().toISOString().split('T')[0],
    currency: initial?.currency ?? 'JPY',
    memo: initial?.memo ?? '',
  })
  const [loading, setLoading] = useState(false)

  const handleTypeChange = (type: StockType) => {
    setForm(f => ({
      ...f,
      type,
      currency: type === 'us_stock' ? 'USD' : 'JPY',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { await onSubmit(form) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>銘柄名</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label>証券コード / ティッカー</Label>
        <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>株種別</Label>
          <Select value={form.type} onValueChange={(v) => handleTypeChange(v as StockType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STOCK_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>口座種別</Label>
          <Select value={form.account} onValueChange={(v) => setForm(f => ({ ...f, account: v as AccountType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>保有株数</Label>
          <Input type="number" min="0" step="0.001" value={form.shares}
            onChange={e => setForm(f => ({ ...f, shares: parseFloat(e.target.value) }))} required />
        </div>
        <div className="space-y-2">
          <Label>取得単価（{form.currency}）</Label>
          <Input type="number" min="0" step="0.01" value={form.avgPrice}
            onChange={e => setForm(f => ({ ...f, avgPrice: parseFloat(e.target.value) }))} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>取得日</Label>
        <Input type="date" value={form.purchaseDate}
          onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label>メモ（任意）</Label>
        <Input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1 h-12" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" className="flex-1 h-12" disabled={loading}>
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: `src/components/portfolio/StockCard.tsx` を作成**

```tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatJPY, formatUSD, formatPercent, pnlColorClass } from '@/lib/utils'
import type { Stock, StockPnL } from '@/types'

const ACCOUNT_LABELS = { nisa: 'NISA', specific: '特定', general: '一般' }
const TYPE_LABELS = { jp_stock: '日本株', us_stock: '米国株', index_fund: 'インデックス' }

interface Props {
  pnl: StockPnL
  onEdit: (stock: Stock) => void
  onDelete: (id: string) => void
}

export default function StockCard({ pnl, onEdit, onDelete }: Props) {
  const { stock, currentValueJPY, pnlJPY, pnlPercent } = pnl
  const priceLabel = stock.currency === 'USD' ? formatUSD(stock.currentPrice) : formatJPY(stock.currentPrice)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-base">{stock.name}</p>
            <p className="text-sm text-muted-foreground">{stock.code}</p>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline">{TYPE_LABELS[stock.type]}</Badge>
            <Badge variant="secondary">{ACCOUNT_LABELS[stock.account]}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">現在価格</p>
            <p className="font-medium">{priceLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">評価額</p>
            <p className="font-medium">{formatJPY(currentValueJPY)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">保有株数</p>
            <p className="font-medium">{stock.shares.toLocaleString()}株</p>
          </div>
          <div>
            <p className="text-muted-foreground">損益</p>
            <p className={`font-semibold ${pnlColorClass(pnlJPY)}`}>
              {formatJPY(pnlJPY)} ({formatPercent(pnlPercent)})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(stock)}>編集</Button>
          <Button variant="destructive" size="sm" className="flex-1"
            onClick={() => { if (confirm(`${stock.name}を削除しますか？`)) onDelete(stock.id) }}>
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: `src/pages/PortfolioPage.tsx` を実装**

```tsx
import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useStocks } from '@/hooks/useStocks'
import { useAuthStore } from '@/stores/authStore'
import { fetchAllStockPrices } from '@/api/stockPrice'
import { getUsdJpyRate } from '@/api/exchangeRate'
import StockCard from '@/components/portfolio/StockCard'
import StockForm from '@/components/portfolio/StockForm'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import type { Stock, StockPnL } from '@/types'

export default function PortfolioPage() {
  const { user } = useAuthStore()
  const { stocks, loading, loadStocks, createStock, editStock, deleteStock } = useStocks()
  const [usdJpy, setUsdJpy] = useState(150)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)

  useEffect(() => {
    loadStocks()
    getUsdJpyRate().then(setUsdJpy)
  }, [])

  useEffect(() => {
    if (stocks.length === 0) return
    fetchAllStockPrices(stocks).then(prices => {
      stocks.forEach(s => {
        if (prices[s.code] != null) editStock(s.id, { currentPrice: prices[s.code]! })
      })
    })
  }, [stocks.length])

  const pnlList = useMemo((): StockPnL[] => stocks.map(stock => {
    const rate = stock.currency === 'USD' ? usdJpy : 1
    const currentValueJPY = stock.currentPrice * stock.shares * rate
    const costBasisJPY = stock.avgPrice * stock.shares * rate
    const pnlJPY = currentValueJPY - costBasisJPY
    const pnlPercent = costBasisJPY > 0 ? (pnlJPY / costBasisJPY) * 100 : 0
    return { stock, currentValueJPY, costBasisJPY, pnlJPY, pnlPercent }
  }), [stocks, usdJpy])

  const handleOpenAdd = () => { setEditingStock(null); setSheetOpen(true) }
  const handleOpenEdit = (stock: Stock) => { setEditingStock(stock); setSheetOpen(true) }

  const handleSubmit = async (data: Parameters<typeof createStock>[0]) => {
    if (editingStock) await editStock(editingStock.id, data)
    else await createStock(data)
    setSheetOpen(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="ポートフォリオ" />
      <div className="p-4 space-y-3">
        <Button className="w-full h-12" onClick={handleOpenAdd}>＋ 銘柄を追加</Button>
        {loading && <p className="text-center text-muted-foreground">読み込み中...</p>}
        {pnlList.map(pnl => (
          <StockCard key={pnl.stock.id} pnl={pnl} onEdit={handleOpenEdit} onDelete={deleteStock} />
        ))}
        {!loading && stocks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">銘柄を追加してください</p>
        )}
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingStock ? '銘柄を編集' : '銘柄を追加'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <StockForm
              initial={editingStock ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 6: コミット**

```bash
git add src/
git commit -m "feat: add portfolio management (CRUD) with stock price auto-fetch"
```

---

## Task 7: レイアウト（BottomNav・PageHeader）

**Files:**
- Create: `src/components/layout/BottomNav.tsx`
- Create: `src/components/layout/PageHeader.tsx`

- [ ] **Step 1: `src/components/layout/BottomNav.tsx` を作成**

```tsx
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, DollarSign, Gift, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'ホーム' },
  { to: '/portfolio', icon: TrendingUp, label: '株' },
  { to: '/dividends', icon: DollarSign, label: '配当' },
  { to: '/benefits', icon: Gift, label: '優待' },
  { to: '/settings', icon: Settings, label: '設定' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs min-h-[56px] justify-center transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: `lucide-react` をインストール**

```bash
npm install lucide-react
```

- [ ] **Step 3: `src/components/layout/PageHeader.tsx` を作成**

```tsx
interface Props {
  title: string
  action?: React.ReactNode
}

export default function PageHeader({ title, action }: Props) {
  return (
    <header className="sticky top-0 bg-background border-b z-40 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold">{title}</h1>
      {action}
    </header>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add src/components/layout/
git commit -m "feat: add BottomNav and PageHeader layout components"
```

---

## Task 8: グラフ（損益・構成比）

**Files:**
- Create: `src/components/charts/PnLBarChart.tsx`
- Create: `src/components/charts/AllocationPieChart.tsx`

- [ ] **Step 1: `src/components/charts/PnLBarChart.tsx` を作成**

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatJPY } from '@/lib/utils'
import type { StockPnL } from '@/types'

interface Props { data: StockPnL[] }

export default function PnLBarChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: d.stock.name.length > 6 ? d.stock.name.slice(0, 6) + '…' : d.stock.name,
    pnl: Math.round(d.pnlJPY),
  })).sort((a, b) => b.pnl - a.pnl)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/10000).toFixed(0)}万`} />
        <Tooltip formatter={(v: number) => formatJPY(v)} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: `src/components/charts/AllocationPieChart.tsx` を作成**

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatJPY } from '@/lib/utils'
import type { StockPnL } from '@/types'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16']

interface Props { data: StockPnL[] }

export default function AllocationPieChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: d.stock.name,
    value: Math.round(d.currentValueJPY),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="45%"
          outerRadius={90} label={({ name, percent }) => `${name.slice(0,4)} ${(percent*100).toFixed(0)}%`}
          labelLine={false}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => formatJPY(v)} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add src/components/charts/
git commit -m "feat: add PnL bar chart and allocation pie chart"
```

---

## Task 9: ダッシュボード

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: `src/pages/DashboardPage.tsx` を実装**

```tsx
import { useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStocks } from '@/hooks/useStocks'
import { getUsdJpyRate } from '@/api/exchangeRate'
import { formatJPY, formatPercent, pnlColorClass } from '@/lib/utils'
import PnLBarChart from '@/components/charts/PnLBarChart'
import AllocationPieChart from '@/components/charts/AllocationPieChart'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import { useState } from 'react'
import type { StockPnL } from '@/types'

export default function DashboardPage() {
  const { stocks, loadStocks } = useStocks()
  const [usdJpy, setUsdJpy] = useState(150)

  useEffect(() => {
    loadStocks()
    getUsdJpyRate().then(setUsdJpy)
  }, [])

  const pnlList = useMemo((): StockPnL[] => stocks.map(stock => {
    const rate = stock.currency === 'USD' ? usdJpy : 1
    const currentValueJPY = stock.currentPrice * stock.shares * rate
    const costBasisJPY = stock.avgPrice * stock.shares * rate
    const pnlJPY = currentValueJPY - costBasisJPY
    const pnlPercent = costBasisJPY > 0 ? (pnlJPY / costBasisJPY) * 100 : 0
    return { stock, currentValueJPY, costBasisJPY, pnlJPY, pnlPercent }
  }), [stocks, usdJpy])

  const totalValueJPY = pnlList.reduce((s, d) => s + d.currentValueJPY, 0)
  const totalCostJPY = pnlList.reduce((s, d) => s + d.costBasisJPY, 0)
  const totalPnLJPY = totalValueJPY - totalCostJPY
  const totalPnLPercent = totalCostJPY > 0 ? (totalPnLJPY / totalCostJPY) * 100 : 0

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="ダッシュボード" />
      <div className="p-4 space-y-4">
        {/* サマリーカード */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">総評価額</p>
            <p className="text-3xl font-bold mt-1">{formatJPY(totalValueJPY)}</p>
            <p className={`text-lg font-semibold mt-1 ${pnlColorClass(totalPnLJPY)}`}>
              {formatJPY(totalPnLJPY)} ({formatPercent(totalPnLPercent)})
            </p>
            <p className="text-xs text-muted-foreground mt-1">USD/JPY: {usdJpy.toFixed(1)}</p>
          </CardContent>
        </Card>

        {/* 損益グラフ */}
        {pnlList.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">銘柄別損益</CardTitle></CardHeader>
            <CardContent><PnLBarChart data={pnlList} /></CardContent>
          </Card>
        )}

        {/* 構成比グラフ */}
        {pnlList.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">ポートフォリオ構成</CardTitle></CardHeader>
            <CardContent><AllocationPieChart data={pnlList} /></CardContent>
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: add dashboard with portfolio summary and charts"
```

---

## Task 10: 配当金管理

**Files:**
- Create: `src/stores/dividendStore.ts`
- Create: `src/hooks/useDividends.ts`
- Create: `src/components/dividends/DividendForm.tsx`
- Create: `src/components/dividends/DividendCalendar.tsx`
- Modify: `src/pages/DividendsPage.tsx`

- [ ] **Step 1: `src/stores/dividendStore.ts` を作成（stockStore.tsと同パターン）**

```typescript
import { create } from 'zustand'
import type { Dividend, DividendForecast } from '@/types'

interface DividendState {
  dividends: Dividend[]
  forecasts: DividendForecast[]
  setDividends: (d: Dividend[]) => void
  setForecasts: (f: DividendForecast[]) => void
  addDividend: (d: Dividend) => void
  removeDividend: (id: string) => void
}

export const useDividendStore = create<DividendState>((set) => ({
  dividends: [],
  forecasts: [],
  setDividends: (dividends) => set({ dividends }),
  setForecasts: (forecasts) => set({ forecasts }),
  addDividend: (d) => set(s => ({ dividends: [d, ...s.dividends] })),
  removeDividend: (id) => set(s => ({ dividends: s.dividends.filter(d => d.id !== id) })),
}))
```

- [ ] **Step 2: `src/hooks/useDividends.ts` を作成**

```typescript
import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDividendStore } from '@/stores/dividendStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import type { Dividend, DividendForecast } from '@/types'

export function useDividends() {
  const { user } = useAuthStore()
  const { dividends, forecasts, setDividends, setForecasts, addDividend, removeDividend } = useDividendStore()

  const loadDividends = useCallback(async () => {
    if (!user) return
    const [divs, fcs] = await Promise.all([
      fetchCollection<Dividend>(user.uid, 'dividends'),
      fetchCollection<DividendForecast>(user.uid, 'dividendForecast'),
    ])
    setDividends(divs)
    setForecasts(fcs)
  }, [user, setDividends, setForecasts])

  const createDividend = useCallback(async (data: Omit<Dividend, 'id' | 'createdAt'>) => {
    if (!user) return
    const id = await addDocument(user.uid, 'dividends', data)
    addDividend({ ...data, id, createdAt: new Date().toISOString() })
  }, [user, addDividend])

  const deleteDividend = useCallback(async (id: string) => {
    if (!user) return
    await deleteDocument(user.uid, 'dividends', id)
    removeDividend(id)
  }, [user, removeDividend])

  // 配当予想のCRUD（配当金履歴とは別管理）
  const upsertForecast = useCallback(async (data: Omit<DividendForecast, 'id' | 'updatedAt'> & { id?: string }) => {
    if (!user) return
    if (data.id) {
      await updateDocument(user.uid, 'dividendForecast', data.id, data)
    } else {
      await addDocument(user.uid, 'dividendForecast', data)
    }
    // リロードして最新化
    const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
    setForecasts(fcs)
  }, [user, setForecasts])

  const deleteForecast = useCallback(async (id: string) => {
    if (!user) return
    await deleteDocument(user.uid, 'dividendForecast', id)
    setForecasts(forecasts.filter(f => f.id !== id))
  }, [user, forecasts, setForecasts])

  return { dividends, forecasts, loadDividends, createDividend, deleteDividend, upsertForecast, deleteForecast }
}
```

- [ ] **Step 3: `src/components/dividends/DividendCalendar.tsx` を作成**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatJPY } from '@/lib/utils'
import type { Dividend, DividendForecast } from '@/types'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  dividends: Dividend[]
  forecasts: DividendForecast[]
  stocks: Array<{ id: string; shares: number }>
}

export default function DividendCalendar({ dividends, forecasts, stocks }: Props) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-2">
      {MONTHS.map((month, i) => {
        const monthNum = i + 1
        const received = dividends.filter(d => {
          const date = new Date(d.receivedDate)
          return date.getFullYear() === currentYear && date.getMonth() + 1 === monthNum
        })
        const expected = forecasts.filter(f => f.payMonth === monthNum)
        if (received.length === 0 && expected.length === 0) return null

        return (
          <Card key={i}>
            <CardContent className="p-3">
              <p className="font-semibold text-sm mb-2">{month}</p>
              {received.map(d => (
                <div key={d.id} className="flex justify-between items-center text-sm py-1">
                  <span>{d.stockName}</span>
                  <Badge variant="default">{formatJPY(d.amount)} 受取済</Badge>
                </div>
              ))}
              {expected.map(f => {
                const stock = stocks.find(s => s.id === f.stockId)
                const est = stock ? f.forecastPerShare * stock.shares : 0
                return (
                  <div key={f.id} className="flex justify-between items-center text-sm py-1">
                    <span>{f.stockName}</span>
                    <Badge variant="outline">予想 {formatJPY(est)}</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: `src/pages/DividendsPage.tsx` を実装**

配当金一覧・記録追加フォーム（Sheetで表示）・カレンダー表示をTabsで切り替えるページを実装。

- [ ] **Step 5: コミット**

```bash
git add src/stores/dividendStore.ts src/hooks/useDividends.ts src/components/dividends/ src/pages/DividendsPage.tsx
git commit -m "feat: add dividend management with calendar and forecast"
```

---

## Task 11: 株主優待管理

**Files:**
- Create: `src/stores/benefitStore.ts`
- Create: `src/hooks/useBenefits.ts`
- Create: `src/components/benefits/BenefitForm.tsx`
- Create: `src/components/benefits/BenefitList.tsx`
- Modify: `src/pages/BenefitsPage.tsx`

- [ ] **Step 1: `src/stores/benefitStore.ts` を作成**

```typescript
import { create } from 'zustand'
import type { Benefit } from '@/types'

interface BenefitState {
  benefits: Benefit[]
  setBenefits: (b: Benefit[]) => void
  addBenefit: (b: Benefit) => void
  updateBenefit: (id: string, b: Partial<Benefit>) => void
  removeBenefit: (id: string) => void
}

export const useBenefitStore = create<BenefitState>((set) => ({
  benefits: [],
  setBenefits: (benefits) => set({ benefits }),
  addBenefit: (b) => set(s => ({ benefits: [b, ...s.benefits] })),
  updateBenefit: (id, data) => set(s => ({ benefits: s.benefits.map(b => b.id === id ? { ...b, ...data } : b) })),
  removeBenefit: (id) => set(s => ({ benefits: s.benefits.filter(b => b.id !== id) })),
}))
```

- [ ] **Step 2: `src/hooks/useBenefits.ts` を作成（useStocks.tsと同パターン）**

コレクション名 `'benefits'` を使用。`loadBenefits`, `createBenefit`, `editBenefit`, `deleteBenefit` を返す。

- [ ] **Step 3: `src/components/benefits/BenefitForm.tsx` を作成**

StockForm.tsxと同パターン。フィールド: stockName, description, confirmMonth(1-12セレクト), minShares, estimatedValue, memo。

- [ ] **Step 4: `src/components/benefits/BenefitList.tsx` を作成**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Benefit } from '@/types'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  benefits: Benefit[]
  onEdit: (b: Benefit) => void
  onDelete: (id: string) => void
}

export default function BenefitList({ benefits, onEdit, onDelete }: Props) {
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="space-y-3">
      {benefits.map(b => {
        const monthsUntil = ((b.confirmMonth - currentMonth + 12) % 12) || 12
        const isAlert = monthsUntil <= 2
        return (
          <Card key={b.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold">{b.stockName}</p>
                <div className="flex gap-1">
                  {isAlert && <Badge variant="destructive">もうすぐ権利確定</Badge>}
                  <Badge variant="outline">{MONTHS[b.confirmMonth - 1]}権利確定</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{b.description}</p>
              <p className="text-sm">最低 {b.minShares}株 / 概算価値 ¥{b.estimatedValue.toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(b)}>編集</Button>
                <Button variant="destructive" size="sm" className="flex-1"
                  onClick={() => { if (confirm(`${b.stockName}の優待を削除しますか？`)) onDelete(b.id) }}>
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

- [ ] **Step 2: コミット**

```bash
git add src/stores/benefitStore.ts src/hooks/useBenefits.ts src/components/benefits/ src/pages/BenefitsPage.tsx
git commit -m "feat: add shareholder benefits management with alert badges"
```

---

## Task 12: CSVインポート/エクスポート

**Files:**
- Create: `src/components/portfolio/CsvImport.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: `src/lib/csv.ts` に SBIパーサーを実装**

```typescript
import type { Stock } from '@/types'

// SBI証券「保有株式」CSVの列順（文字コード: Shift-JIS → UTF-8変換済み想定）
// 列: 銘柄名, 銘柄コード, 市場, 保有株数, 平均取得単価, 現在値, ...
export function parseSbiCsv(csvText: string): Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>[] {
  const lines = csvText.split('\n').filter(l => l.trim() && !l.startsWith('銘柄'))
  return lines.map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const code = cols[1] ?? ''
    return {
      name: cols[0] ?? '',
      code,
      type: 'jp_stock' as const,      // SBI国内株CSVは日本株固定
      account: 'specific' as const,   // デフォルト: 特定口座（インポート後手動修正可）
      shares: parseFloat(cols[3] ?? '0') || 0,
      avgPrice: parseFloat(cols[4] ?? '0') || 0,
      purchaseDate: new Date().toISOString().split('T')[0], // CSVに日付なし → 本日日付
      currency: 'JPY' as const,
      memo: 'SBI証券CSVよりインポート',
    }
  }).filter(s => s.name && s.code)
}
```

> ⚠️ SBI証券CSVはShift-JIS形式。ブラウザFileReaderで `encoding: 'Shift_JIS'` を指定して読み込むこと。

- [ ] **Step 2: `src/components/portfolio/CsvImport.tsx` を作成**

```tsx
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { parseSbiCsv } from '@/lib/csv'
import type { Stock } from '@/types'

interface Props {
  onImport: (stocks: ReturnType<typeof parseSbiCsv>) => Promise<void>
}

export default function CsvImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ReturnType<typeof parseSbiCsv>>([])
  const [loading, setLoading] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setPreview(parseSbiCsv(text))
    }
    reader.readAsText(file, 'Shift_JIS')
  }

  const handleImport = async () => {
    setLoading(true)
    try { await onImport(preview); setPreview([]) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" className="w-full h-12" onClick={() => inputRef.current?.click()}>
        SBI証券 CSVを選択
      </Button>
      {preview.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{preview.length}件を取り込みます</p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {preview.map((s, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b">
                <span>{s.name}（{s.code}）</span>
                <Badge variant="outline">{s.shares}株</Badge>
              </div>
            ))}
          </div>
          <Button className="w-full h-12" onClick={handleImport} disabled={loading}>
            {loading ? 'インポート中...' : `${preview.length}件をインポート`}
          </Button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: CSVエクスポート機能を実装**

```typescript
// src/lib/csv.ts
export function exportStocksToCSV(stocks: Stock[]): void {
  const headers = ['銘柄名','コード','種別','口座','保有株数','取得単価','現在価格','取得日','メモ']
  const rows = stocks.map(s => [s.name, s.code, s.type, s.account, s.shares, s.avgPrice, s.currentPrice, s.purchaseDate, s.memo])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: `src/pages/SettingsPage.tsx` を実装**

```tsx
import { useStocks } from '@/hooks/useStocks'
import { logout } from '@/hooks/useAuth'
import { exportStocksToCSV } from '@/lib/csv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CsvImport from '@/components/portfolio/CsvImport'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'

export default function SettingsPage() {
  const { stocks, loadStocks, createStock } = useStocks()

  const handleImport = async (data: Parameters<typeof createStock>[0][]) => {
    for (const s of data) await createStock(s)
    await loadStocks()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="設定" />
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">データ管理</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <CsvImport onImport={handleImport} />
            <Button variant="outline" className="w-full h-12"
              onClick={() => exportStocksToCSV(stocks)}>
              CSVエクスポート
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button variant="destructive" className="w-full h-12" onClick={logout}>
              ログアウト
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add src/components/portfolio/CsvImport.tsx src/lib/csv.ts src/pages/SettingsPage.tsx
git commit -m "feat: add CSV import/export for SBI Securities data"
```

---

## Task 13: ダークモード対応

**Files:**
- Modify: `src/App.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: `src/main.tsx` でiOSシステム設定のダークモードに連動させる**

```tsx
// index.html の <html> タグにクラスを動的付与
// Tailwindの darkMode: 'class' と合わせて使用
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.classList.toggle('dark', prefersDark)

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  document.documentElement.classList.toggle('dark', e.matches)
})
```

- [ ] **Step 2: コミット**

```bash
git add src/main.tsx
git commit -m "feat: add dark mode support following iOS system preference"
```

---

## Task 14: GitHub Pages デプロイ設定

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: GitHubにリポジトリを作成**

```bash
# GitHub.comで新規リポジトリを作成（例: dividend-app）
# リポジトリ名に合わせて vite.config.ts の base を更新すること
# base: '/dividend-app/'
```

- [ ] **Step 2: `.github/workflows/deploy.yml` を作成**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 3: GitHub Secretsに環境変数を登録**

GitHubリポジトリ → Settings → Secrets and variables → Actions → New repository secret
上記の6つのFirebase設定値をそれぞれ登録すること。

- [ ] **Step 4: GitHub Pagesを有効化**

GitHubリポジトリ → Settings → Pages → Source: GitHub Actions

- [ ] **Step 5: 最終プッシュ・デプロイ確認**

```bash
git remote add origin https://github.com/[ユーザー名]/[リポジトリ名].git
git branch -M main
git push -u origin main
```

GitHub Actionsが動き、数分後に `https://[ユーザー名].github.io/[リポジトリ名]/` でアクセスできることを確認。

- [ ] **Step 6: iPhoneのSafariでアクセスして動作確認**

---

## 完了チェックリスト

- [ ] ログイン/ログアウト動作
- [ ] ご夫婦2アカウントでデータが分離されている
- [ ] 銘柄の追加・編集・削除
- [ ] 株価の自動取得・損益計算
- [ ] 配当金の記録・カレンダー表示
- [ ] 株主優待の管理・アラート
- [ ] CSVインポート（SBI証券形式）
- [ ] CSVエクスポート
- [ ] ダークモード対応
- [ ] iPhone Safariで快適に操作できる
- [ ] GitHub Pagesで公開されている
