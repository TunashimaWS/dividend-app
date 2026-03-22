# 配当金アプリ 機能拡張 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA化・配当金編集・配当利回り表示・エラーフィードバック・配当グラフ・NISA表示・配当予測・スワイプ削除・銘柄名自動入力の9機能を追加する。

**Architecture:** 既存のZustand store → hook → page パターンを踏襲。新規ライブラリは追加しない。Yahoo Finance APIはすでに使用している allorigins.win プロキシ経由で呼び出す。

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, Recharts, Firebase v12, Vitest

**Spec:** `docs/superpowers/specs/2026-03-22-enhancements-design.md`

---

## ファイル変更一覧

| 操作 | ファイル | 目的 |
|------|---------|------|
| 新規 | `public/manifest.json` | PWA設定 |
| 新規 | `src/stores/toastStore.ts` | トースト状態管理 |
| 新規 | `src/components/ui/Toast.tsx` | トースト表示コンポーネント |
| 新規 | `src/components/ui/SwipeToDelete.tsx` | スワイプ削除ラッパー |
| 新規 | `src/api/dividendData.ts` | Yahoo Finance配当取得API |
| 新規 | `src/components/charts/DividendStackedChart.tsx` | 配当グラフ（月別・年別） |
| 修正 | `index.html` | manifest リンク追加 |
| 修正 | `src/App.tsx` | Toast コンポーネント追加 |
| 修正 | `src/api/stockPrice.ts` | fetchStockName 追加 |
| 修正 | `src/stores/dividendStore.ts` | updateDividend アクション追加 |
| 修正 | `src/hooks/useDividends.ts` | editDividend・generateForecasts・refreshFromYahoo 追加 |
| 修正 | `src/hooks/useStocks.ts` | エラー時 toast 呼び出し追加 |
| 修正 | `src/components/portfolio/StockCard.tsx` | 利回り・NISA表示・スワイプ削除 |
| 修正 | `src/components/portfolio/StockForm.tsx` | 銘柄名自動入力 |
| 修正 | `src/components/benefits/BenefitList.tsx` | スワイプ削除 |
| 修正 | `src/components/dividends/DividendCalendar.tsx` | 予測タップ編集対応 |
| 修正 | `src/pages/DividendsPage.tsx` | 配当編集・グラフ・予測ボタン |
| 修正 | `src/pages/PortfolioPage.tsx` | 年間配当計算してStockCardに渡す |
| 修正 | `src/pages/DashboardPage.tsx` | 年間配当計算してStockCardに渡す |

---

## Task 1: Toast システム（④ エラーフィードバック）

> **設計メモ:** スペック（④）では `src/hooks/useToast.ts` の作成を指示しているが、`toastStore.ts` から `showToast` を直接エクスポートすることで同等の機能を1ファイルで実現できるため、`useToast.ts` は作成しない。

**Files:**
- Create: `src/stores/toastStore.ts`
- Create: `src/components/ui/Toast.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: toastStore.ts を作成**

```typescript
// src/stores/toastStore.ts
import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
  type: 'error' | 'success'
}

interface ToastState {
  toasts: ToastItem[]
  showToast: (message: string, type?: 'error' | 'success') => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'error') => {
    const id = Date.now().toString()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// React外から呼び出せるヘルパー
export const showToast = (message: string, type: 'error' | 'success' = 'error') =>
  useToastStore.getState().showToast(message, type)
```

- [ ] **Step 2: Toast.tsx を作成**

```tsx
// src/components/ui/Toast.tsx
import { useToastStore } from '@/stores/toastStore'

export default function Toast() {
  const { toasts, removeToast } = useToastStore()
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto cursor-pointer
            ${t.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'}`}
          onClick={() => removeToast(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: App.tsx に Toast を追加**

`src/App.tsx` の `<BrowserRouter>` 内に `<Toast />` を追加する。

```tsx
import Toast from '@/components/ui/Toast'

export default function App() {
  return (
    <BrowserRouter basename="/dividend-app">
      <Toast />
      <AppRoutes />
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: 動作確認**

```bash
npm run dev
```

ブラウザの DevTools Console で以下を実行して、画面上部に緑のトーストが3秒間表示されることを確認：

```javascript
// DevTools Console で実行（Reactが起動してから）
const { showToast } = await import('/src/stores/toastStore.ts')
showToast('Toast動作確認', 'success')
```

Expected: 画面上部に「Toast動作確認」という緑のバナーが3秒間表示されて消える。

- [ ] **Step 5: コミット**

```bash
git add src/stores/toastStore.ts src/components/ui/Toast.tsx src/App.tsx
git commit -m "feat: add toast notification system"
```

---

## Task 2: SwipeToDelete コンポーネント（⑨）

**Files:**
- Create: `src/components/ui/SwipeToDelete.tsx`

- [ ] **Step 1: SwipeToDelete.tsx を作成**

```tsx
// src/components/ui/SwipeToDelete.tsx
import { useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  onDelete: () => void
}

const SNAP_THRESHOLD = 80   // この距離以上スワイプで削除ゾーン表示
const DELETE_THRESHOLD = 160 // この距離以上スワイプで即削除

export default function SwipeToDelete({ children, onDelete }: Props) {
  const [offset, setOffset] = useState(0)
  // isDragging は useRef（イベントハンドラ内で同期的に参照するため）
  // dragging は useState（JSXのstyle計算に使うため — refはレンダー時に古い値を返す）
  const startX = useRef(0)
  const isDragging = useRef(false)
  const [dragging, setDragging] = useState(false)

  const onStart = (clientX: number) => {
    startX.current = clientX
    isDragging.current = true
    setDragging(true)
  }

  const onMove = (clientX: number) => {
    if (!isDragging.current) return
    const delta = clientX - startX.current
    if (delta < 0) setOffset(Math.max(delta, -DELETE_THRESHOLD))
  }

  const onEnd = () => {
    isDragging.current = false
    setDragging(false)
    if (offset <= -DELETE_THRESHOLD + 10) {
      onDelete()
      setOffset(0)
    } else if (offset < -SNAP_THRESHOLD) {
      setOffset(-SNAP_THRESHOLD)
    } else {
      setOffset(0)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* 削除ゾーン（背景） */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 pr-5 text-white text-sm font-medium"
        style={{ width: SNAP_THRESHOLD }}
      >
        削除
      </div>
      {/* コンテンツ（スライドする） */}
      <div
        className="relative"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => { if (isDragging.current) onMove(e.clientX) }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add src/components/ui/SwipeToDelete.tsx
git commit -m "feat: add SwipeToDelete component"
```

---

## Task 3: PWA 対応（①）

**Files:**
- Create: `public/manifest.json`
- Modify: `index.html`

- [ ] **Step 1: manifest.json を作成**

```json
// public/manifest.json
{
  "name": "配当金管理",
  "short_name": "配当管理",
  "description": "株式配当金・ポートフォリオ管理アプリ",
  "start_url": "/dividend-app/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/dividend-app/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: index.html に manifest リンクを追加**

`index.html` の `<head>` 内、既存の `<link rel="icon">` の次の行に追記：

```html
<link rel="manifest" href="/dividend-app/manifest.json" />
```

- [ ] **Step 3: 動作確認**

```bash
npm run dev
```

Chromeの DevTools → Application → Manifest タブで manifest が認識されていることを確認。

- [ ] **Step 4: コミット**

```bash
git add public/manifest.json index.html
git commit -m "feat: add PWA manifest for home screen installation"
```

---

## Task 4: 銘柄名自動入力（⑩）

**Files:**
- Modify: `src/api/stockPrice.ts`
- Modify: `src/components/portfolio/StockForm.tsx`

- [ ] **Step 1: toSymbol をエクスポートし、fetchStockName を追加**

`src/api/stockPrice.ts` を開き、`toSymbol` 関数の `function` キーワードの前に `export` を追加する（`export function toSymbol`）。

次に、ファイル末尾に追記：

```typescript
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
```

- [ ] **Step 2: StockForm.tsx を更新**

`StockForm.tsx` に以下の変更を加える：

1. インポートに `fetchStockName` と `showToast` を追加：
```typescript
import { fetchStockName } from '@/api/stockPrice'
import { showToast } from '@/stores/toastStore'
```

2. `submitting` state の下に `fetchingName` state を追加：
```typescript
const [fetchingName, setFetchingName] = useState(false)
```

3. コードフィールドに `onBlur` ハンドラを追加（新規追加フォームのみ）：
```typescript
const handleCodeBlur = async () => {
  // 編集モード（initial?.code が存在）のときはスキップ
  if (initial?.code || !form.code || form.name) return
  setFetchingName(true)
  setForm((f) => ({ ...f, name: '取得中...' }))
  const name = await fetchStockName(form.code, form.type)
  if (name) {
    setForm((f) => ({ ...f, name }))
  } else {
    setForm((f) => ({ ...f, name: '' }))
    showToast('銘柄名の自動取得に失敗しました（手動で入力してください）')
  }
  setFetchingName(false)
}
```

4. コードフィールドの `<Input>` に `onBlur={handleCodeBlur}` を追加。

5. 銘柄名フィールドの `<Input>` に `disabled={fetchingName}` を追加。

- [ ] **Step 3: 動作確認**

```bash
npm run dev
```

ポートフォリオページで「銘柄を追加」→ コードに `7203` → Tab キーで銘柄名が「Toyota Motor Corp」と自動入力されることを確認。

- [ ] **Step 4: コミット**

```bash
git add src/api/stockPrice.ts src/components/portfolio/StockForm.tsx
git commit -m "feat: export toSymbol and auto-fill stock name from Yahoo Finance API"
```

---

## Task 5: 配当データ取得 API（⑦ Stage 3）

**Files:**
- Create: `src/api/dividendData.ts`

- [ ] **Step 1: dividendData.ts を作成**

```typescript
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
```

- [ ] **Step 2: テストを書く**

```typescript
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
```

- [ ] **Step 3: テストを実行（PASS 確認）**

```bash
npx vitest run src/api/dividendData.test.ts
```

Expected: 3テスト全て PASS

- [ ] **Step 4: コミット**

```bash
git add src/api/dividendData.ts src/api/dividendData.test.ts
git commit -m "feat: add Yahoo Finance dividend history API"
```

---

## Task 6: Store・Hook 更新（② ⑦）

**Files:**
- Modify: `src/stores/dividendStore.ts`
- Modify: `src/hooks/useDividends.ts`
- Modify: `src/hooks/useStocks.ts`

- [ ] **Step 1: dividendStore.ts に updateDividend を追加**

`src/stores/dividendStore.ts` を以下に置き換える：

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
  updateDividend: (id: string, data: Partial<Dividend>) => void
}

export const useDividendStore = create<DividendState>((set) => ({
  dividends: [],
  forecasts: [],
  setDividends: (dividends) => set({ dividends }),
  setForecasts: (forecasts) => set({ forecasts }),
  addDividend: (d) => set((s) => ({ dividends: [d, ...s.dividends] })),
  removeDividend: (id) => set((s) => ({ dividends: s.dividends.filter((d) => d.id !== id) })),
  updateDividend: (id, data) =>
    set((s) => ({
      dividends: s.dividends.map((d) => (d.id === id ? { ...d, ...data } : d)),
    })),
}))
```

- [ ] **Step 2: useDividends.ts を更新**

`src/hooks/useDividends.ts` を以下に置き換える：

```typescript
import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDividendStore } from '@/stores/dividendStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import { fetchDividendHistory } from '@/api/dividendData'
import { showToast } from '@/stores/toastStore'
import type { Dividend, DividendForecast, Stock } from '@/types'

export function useDividends() {
  const { user } = useAuthStore()
  const {
    dividends, forecasts,
    setDividends, setForecasts,
    addDividend, removeDividend, updateDividend,
  } = useDividendStore()

  const loadDividends = useCallback(async () => {
    if (!user) return
    try {
      const [divs, fcs] = await Promise.all([
        fetchCollection<Dividend>(user.uid, 'dividends'),
        fetchCollection<DividendForecast>(user.uid, 'dividendForecast'),
      ])
      setDividends(divs)
      setForecasts(fcs)
    } catch {
      showToast('配当データの読み込みに失敗しました')
    }
  }, [user, setDividends, setForecasts])

  const createDividend = useCallback(
    async (data: Omit<Dividend, 'id' | 'createdAt'>) => {
      if (!user) return
      try {
        const id = await addDocument(user.uid, 'dividends', data)
        addDividend({ ...data, id, createdAt: new Date().toISOString() })
      } catch {
        showToast('配当金の記録に失敗しました')
      }
    },
    [user, addDividend],
  )

  const editDividend = useCallback(
    async (id: string, data: Partial<Omit<Dividend, 'id' | 'createdAt'>>) => {
      if (!user) return
      try {
        await updateDocument(user.uid, 'dividends', id, data)
        updateDividend(id, data)
      } catch {
        showToast('配当金の更新に失敗しました')
      }
    },
    [user, updateDividend],
  )

  const deleteDividend = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await deleteDocument(user.uid, 'dividends', id)
        removeDividend(id)
      } catch {
        showToast('配当金の削除に失敗しました')
      }
    },
    [user, removeDividend],
  )

  const upsertForecast = useCallback(
    async (data: Omit<DividendForecast, 'updatedAt'> & { id?: string }) => {
      if (!user) return
      try {
        if (data.id) {
          await updateDocument(user.uid, 'dividendForecast', data.id, data)
        } else {
          await addDocument(user.uid, 'dividendForecast', data)
        }
        const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
        setForecasts(fcs)
      } catch {
        showToast('予測の保存に失敗しました')
      }
    },
    [user, setForecasts],
  )

  const deleteForecast = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await deleteDocument(user.uid, 'dividendForecast', id)
        setForecasts(forecasts.filter((f) => f.id !== id))
      } catch {
        showToast('予測の削除に失敗しました')
      }
    },
    [user, forecasts, setForecasts],
  )

  /**
   * ⑦ Stage 1: 昨年の配当記録から今年の予測を自動生成する。
   * 同じ stockId + payMonth の予測が既に存在する場合はスキップ（上書きしない）。
   */
  const generateForecastsFromHistory = useCallback(async () => {
    if (!user) return
    const lastYear = new Date().getFullYear() - 1
    const lastYearDivs = dividends.filter(
      (d) => new Date(d.receivedDate).getFullYear() === lastYear,
    )
    // 銘柄 × 月 でグループ化して合計
    const grouped = new Map<string, { stockId: string; stockName: string; payMonth: number; total: number; count: number }>()
    for (const d of lastYearDivs) {
      const month = new Date(d.receivedDate).getMonth() + 1
      const key = `${d.stockId}_${month}`
      const existing = grouped.get(key)
      if (existing) {
        existing.total += d.amount
        existing.count += 1
      } else {
        grouped.set(key, { stockId: d.stockId, stockName: d.stockName, payMonth: month, total: d.amount, count: 1 })
      }
    }
    // 既存予測のキーセット（同じ stockId + payMonth はスキップ）
    const existingKeys = new Set(forecasts.map((f) => `${f.stockId}_${f.payMonth}`))
    let added = 0
    for (const [key, item] of grouped) {
      if (existingKeys.has(key)) continue
      // forecastPerShare = 合計金額（保有株数が不明なのでそのまま保存）
      // 注: DividendCalendar 側では forecastPerShare × shares で表示するが、
      //     ここではhistoryの total をそのまま forecastPerShare=1, shares=totalとして保存するより
      //     shares=1, forecastPerShare=total として保存する（表示側で掛け算すると重複するため）
      //     → シンプルに forecastPerShare = total（= 受取総額）として保存し、
      //        Calendar 側では stocksMap[stockId] が 0 の場合でも total をそのまま表示する
      await addDocument(user.uid, 'dividendForecast', {
        stockId: item.stockId,
        stockName: item.stockName,
        forecastPerShare: item.total, // 受取総額（株数で割らない）
        currency: 'JPY',
        confirmMonth: item.payMonth,
        payMonth: item.payMonth,
        updatedAt: new Date().toISOString(),
      } satisfies Omit<DividendForecast, 'id'>)
      added++
    }
    if (added > 0) {
      const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
      setForecasts(fcs)
      showToast(`${added}件の予測を生成しました`, 'success')
    } else {
      showToast('生成できる予測がありません（昨年の記録を先に入力してください）')
    }
  }, [user, dividends, forecasts, setForecasts])

  /**
   * ⑦ Stage 3: Yahoo Finance から配当履歴を取得して既存予測を更新する。
   */
  const refreshForecastsFromYahoo = useCallback(
    async (stocks: Stock[]) => {
      if (!user) return
      let updated = 0
      for (const stock of stocks) {
        if (stock.type === 'index_fund') continue
        const history = await fetchDividendHistory(stock.code, stock.type)
        if (history.length === 0) continue
        // 直近1年の配当を月別に集計
        const oneYearAgo = Date.now() / 1000 - 365 * 24 * 3600
        const recent = history.filter((h) => h.date > oneYearAgo)
        if (recent.length === 0) continue
        for (const event of recent) {
          const payMonth = new Date(event.date * 1000).getMonth() + 1
          const existing = forecasts.find(
            (f) => f.stockId === stock.id && f.payMonth === payMonth,
          )
          const totalAmount = event.amount * stock.shares
          if (existing) {
            await updateDocument(user.uid, 'dividendForecast', existing.id, {
              forecastPerShare: totalAmount,
              updatedAt: new Date().toISOString(),
            })
            updated++
          }
        }
      }
      if (updated > 0) {
        const fcs = await fetchCollection<DividendForecast>(user.uid, 'dividendForecast')
        setForecasts(fcs)
        showToast(`${updated}件の予測を更新しました`, 'success')
      } else {
        showToast('Yahoo Financeから更新できる予測がありませんでした')
      }
    },
    [user, forecasts, setForecasts],
  )

  return {
    dividends, forecasts, loadDividends,
    createDividend, editDividend, deleteDividend,
    upsertForecast, deleteForecast,
    generateForecastsFromHistory, refreshForecastsFromYahoo,
  }
}
```

- [ ] **Step 3: useStocks.ts を完全置き換え**

`src/hooks/useStocks.ts` を以下に置き換える：

```typescript
import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useStockStore } from '@/stores/stockStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import { showToast } from '@/stores/toastStore'
import type { Stock } from '@/types'

export function useStocks() {
  const { user } = useAuthStore()
  const { stocks, loading, setStocks, addStock, updateStock, removeStock, setLoading } =
    useStockStore()

  const loadStocks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await fetchCollection<Stock>(user.uid, 'stocks')
      setStocks(data)
    } catch {
      showToast('株データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user, setStocks, setLoading])

  const createStock = useCallback(
    async (data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return
      try {
        const id = await addDocument(user.uid, 'stocks', data)
        addStock({
          ...data,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } catch {
        showToast('銘柄の追加に失敗しました')
      }
    },
    [user, addStock],
  )

  const editStock = useCallback(
    async (id: string, data: Partial<Stock>) => {
      if (!user) return
      try {
        await updateDocument(user.uid, 'stocks', id, data)
        updateStock(id, data)
      } catch {
        showToast('銘柄の更新に失敗しました')
      }
    },
    [user, updateStock],
  )

  const deleteStock = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await deleteDocument(user.uid, 'stocks', id)
        removeStock(id)
      } catch {
        showToast('銘柄の削除に失敗しました')
      }
    },
    [user, removeStock],
  )

  const clearAllStocks = useCallback(async () => {
    if (!user) return
    try {
      const current = useStockStore.getState().stocks
      await Promise.all(current.map((s) => deleteDocument(user.uid, 'stocks', s.id)))
      setStocks([])
    } catch {
      showToast('全銘柄の削除に失敗しました')
    }
  }, [user, setStocks])

  return { stocks, loading, loadStocks, createStock, editStock, deleteStock, clearAllStocks }
}
```

- [ ] **Step 4: ビルド確認**

```bash
npm run build
```

Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/stores/dividendStore.ts src/hooks/useDividends.ts src/hooks/useStocks.ts
git commit -m "feat: add dividend edit, forecast generation, and Yahoo Finance refresh"
```

---

## Task 7: StockCard 更新（③ ⑥ ⑨）

**Files:**
- Modify: `src/components/portfolio/StockCard.tsx`

- [ ] **Step 1: StockCard.tsx を更新**

```tsx
// src/components/portfolio/StockCard.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SwipeToDelete from '@/components/ui/SwipeToDelete'
import { formatJPY, formatUSD, formatPercent, pnlColorClass } from '@/lib/utils'
import type { Stock, StockPnL } from '@/types'

const ACCOUNT_LABELS: Record<string, string> = {
  nisa: 'NISA',
  specific: '特定',
  general: '一般',
}

const TYPE_LABELS: Record<string, string> = {
  jp_stock: '日本株',
  us_stock: '米国株',
  index_fund: 'インデックス',
}

interface Props {
  pnl: StockPnL
  annualDividendJPY?: number  // 過去12ヶ月の受取配当合計（円）
  onEdit: (stock: Stock) => void
  onDelete: (id: string) => void
}

export default function StockCard({ pnl, annualDividendJPY, onEdit, onDelete }: Props) {
  const { stock, currentValueJPY, pnlJPY, pnlPercent } = pnl
  const priceLabel =
    stock.currency === 'USD'
      ? formatUSD(stock.currentPrice)
      : formatJPY(stock.currentPrice)

  const yieldPercent =
    annualDividendJPY != null && currentValueJPY > 0
      ? (annualDividendJPY / currentValueJPY) * 100
      : null

  return (
    <SwipeToDelete onDelete={() => onDelete(stock.id)}>
      <Card className="rounded-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-base leading-tight">{stock.name}</p>
              <p className="text-sm text-muted-foreground">{stock.code}</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[stock.type]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {ACCOUNT_LABELS[stock.account]}
              </Badge>
              {stock.account === 'nisa' && (
                <Badge className="text-xs bg-green-600 text-white">非課税</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
            <div>
              <p className="text-muted-foreground text-xs">現在価格</p>
              <p className="font-medium">
                {stock.currentPrice > 0 ? priceLabel : '取得中...'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">評価額（円）</p>
              <p className="font-medium">{formatJPY(currentValueJPY)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">保有株数</p>
              <p className="font-medium">{stock.shares.toLocaleString()}株</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">損益</p>
              <p className={`font-semibold text-sm ${pnlColorClass(pnlJPY)}`}>
                {formatJPY(pnlJPY)}{' '}
                <span className="text-xs">({formatPercent(pnlPercent)})</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">配当利回り</p>
              <p className="font-medium text-amber-500">
                {yieldPercent != null ? `${yieldPercent.toFixed(2)}%` : '記録なし'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">年間配当（実績）</p>
              <p className="font-medium">
                {annualDividendJPY != null ? formatJPY(annualDividendJPY) : '記録なし'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-10"
            onClick={() => onEdit(stock)}
          >
            編集
          </Button>
        </CardContent>
      </Card>
    </SwipeToDelete>
  )
}
```

- [ ] **Step 2: BenefitList.tsx のスワイプ削除**

`src/components/benefits/BenefitList.tsx` で:
1. `import SwipeToDelete from '@/components/ui/SwipeToDelete'` を追加
2. 各 `<Card>` を `<SwipeToDelete onDelete={() => onDelete(b.id)}>` でラップ
3. 削除ボタンを削除し、編集ボタンのみ残す（`className="w-full h-10"` に変更）

- [ ] **Step 3: 動作確認**

```bash
npm run dev
```

ポートフォリオページで：
- 株カードに「配当利回り」「年間配当（実績）」が表示される（データなしの場合は「記録なし」）
- NISA口座の株に緑の「非課税」バッジが表示される
- 左スワイプで赤い削除ゾーンが現れる

- [ ] **Step 4: コミット**

```bash
git add src/components/portfolio/StockCard.tsx src/components/benefits/BenefitList.tsx
git commit -m "feat: add yield display, NISA badge, and swipe-to-delete to StockCard"
```

---

## Task 8: 配当金グラフ（⑤）

**Files:**
- Create: `src/components/charts/DividendStackedChart.tsx`

- [ ] **Step 1: DividendStackedChart.tsx を作成**

```tsx
// src/components/charts/DividendStackedChart.tsx
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatJPY } from '@/lib/utils'
import type { Dividend } from '@/types'

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  dividends: Dividend[]
}

export default function DividendStackedChart({ dividends }: Props) {
  const currentYear = new Date().getFullYear()

  // 月別データ（現在年）: [{ month: '1月', 'トヨタ': 5000, ... }]
  const monthlyData = useMemo(() => {
    const thisYearDivs = dividends.filter(
      (d) => new Date(d.receivedDate).getFullYear() === currentYear,
    )
    return MONTH_LABELS.map((label, i) => {
      const monthDivs = thisYearDivs.filter(
        (d) => new Date(d.receivedDate).getMonth() === i,
      )
      const entry: Record<string, number | string> = { month: label }
      for (const d of monthDivs) {
        entry[d.stockName] = ((entry[d.stockName] as number) || 0) + d.amount
      }
      return entry
    })
  }, [dividends, currentYear])

  // 月別に登場する銘柄名一覧
  const stockNames = useMemo(() => {
    const names = new Set<string>()
    dividends
      .filter((d) => new Date(d.receivedDate).getFullYear() === currentYear)
      .forEach((d) => names.add(d.stockName))
    return Array.from(names)
  }, [dividends, currentYear])

  // 年別データ
  const yearlyData = useMemo(() => {
    const years = new Map<number, number>()
    for (const d of dividends) {
      const y = new Date(d.receivedDate).getFullYear()
      years.set(y, (years.get(y) || 0) + d.amount)
    }
    return Array.from(years.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, total]) => ({ year: String(year), total }))
  }, [dividends])

  if (dividends.length === 0) return null

  return (
    <Tabs defaultValue="monthly">
      <TabsList className="w-full mb-3">
        <TabsTrigger value="monthly" className="flex-1">月別</TabsTrigger>
        <TabsTrigger value="yearly" className="flex-1">年別</TabsTrigger>
      </TabsList>

      <TabsContent value="monthly">
        <p className="text-xs text-muted-foreground mb-2">{currentYear}年 月別配当（会社別）</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatJPY(value)} />
            {stockNames.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
            {stockNames.map((name, i) => (
              <Bar key={name} dataKey={name} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="yearly">
        <p className="text-xs text-muted-foreground mb-2">年間配当合計</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yearlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatJPY(value)} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {yearlyData.map((entry, i) => (
                <Cell
                  key={entry.year}
                  fill={entry.year === String(currentYear) ? '#3b82f6' : '#64748b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add src/components/charts/DividendStackedChart.tsx
git commit -m "feat: add dividend stacked bar chart (monthly/yearly with per-stock colors)"
```

---

## Task 9: DividendsPage 更新（② ⑤ ⑦）

**Files:**
- Modify: `src/pages/DividendsPage.tsx`
- Modify: `src/components/dividends/DividendCalendar.tsx`

- [ ] **Step 1: DividendCalendar.tsx を更新（予測タップ編集対応）**

```tsx
// src/components/dividends/DividendCalendar.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatJPY } from '@/lib/utils'
import type { Dividend, DividendForecast } from '@/types'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  dividends: Dividend[]
  forecasts: DividendForecast[]
  stocksMap: Record<string, number>  // stockId → shares（未使用になるが後方互換のため維持）
  onEditForecast?: (forecast: DividendForecast) => void
}

export default function DividendCalendar({ dividends, forecasts, onEditForecast }: Props) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-2">
      {MONTHS.map((month, i) => {
        const monthNum = i + 1
        const received = dividends.filter((d) => {
          const date = new Date(d.receivedDate)
          return date.getFullYear() === currentYear && date.getMonth() + 1 === monthNum
        })
        const expected = forecasts.filter((f) => f.payMonth === monthNum)

        if (received.length === 0 && expected.length === 0) return null

        return (
          <Card key={i}>
            <CardContent className="p-3">
              <p className="font-semibold text-sm mb-2">{month}</p>
              {received.map((d) => (
                <div key={d.id} className="flex justify-between items-center text-sm py-1">
                  <span>{d.stockName}</span>
                  <Badge>{formatJPY(d.amount)} 受取済</Badge>
                </div>
              ))}
              {expected.map((f) => (
                <div
                  key={f.id}
                  className="flex justify-between items-center text-sm py-1 cursor-pointer"
                  onClick={() => onEditForecast?.(f)}
                >
                  <span className="text-muted-foreground">{f.stockName}</span>
                  <Badge
                    variant="outline"
                    className="border-dashed text-muted-foreground"
                  >
                    予想 {formatJPY(f.forecastPerShare)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
      {dividends.length === 0 && forecasts.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">
          配当金データがありません
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: DividendsPage.tsx を更新**

`src/pages/DividendsPage.tsx` を以下に置き換える：

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SwipeToDelete from '@/components/ui/SwipeToDelete'
import { useDividends } from '@/hooks/useDividends'
import { useStocks } from '@/hooks/useStocks'
import { formatJPY } from '@/lib/utils'
import DividendCalendar from '@/components/dividends/DividendCalendar'
import DividendStackedChart from '@/components/charts/DividendStackedChart'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import type { Dividend, DividendForecast } from '@/types'

type DividendFormData = {
  stockName: string
  stockId: string
  receivedDate: string
  amount: string
  currency: 'JPY' | 'USD'
}

const emptyForm = (): DividendFormData => ({
  stockName: '',
  stockId: '',
  receivedDate: new Date().toISOString().split('T')[0],
  amount: '',
  currency: 'JPY',
})

export default function DividendsPage() {
  const {
    dividends, forecasts, loadDividends,
    createDividend, editDividend, deleteDividend,
    upsertForecast, generateForecastsFromHistory, refreshForecastsFromYahoo,
  } = useDividends()
  const { stocks, loadStocks } = useStocks()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingDividend, setEditingDividend] = useState<Dividend | null>(null)
  const [form, setForm] = useState<DividendFormData>(emptyForm())

  // 予測編集シート
  const [forecastSheetOpen, setForecastSheetOpen] = useState(false)
  const [editingForecast, setEditingForecast] = useState<DividendForecast | null>(null)
  const [forecastAmount, setForecastAmount] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const stocksMap = useMemo(
    () => Object.fromEntries(stocks.map((s) => [s.id, s.shares])),
    [stocks],
  )

  useEffect(() => {
    loadDividends()
    loadStocks()
  }, [loadDividends, loadStocks])

  const totalThisYear = dividends
    .filter((d) => new Date(d.receivedDate).getFullYear() === new Date().getFullYear())
    .reduce((sum, d) => sum + d.amount, 0)

  const handleOpenAdd = () => {
    setEditingDividend(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  const handleOpenEdit = (d: Dividend) => {
    setEditingDividend(d)
    setForm({
      stockName: d.stockName,
      stockId: d.stockId,
      receivedDate: d.receivedDate,
      amount: String(d.amount),
      currency: d.currency,
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      stockId: form.stockId,
      stockName: form.stockName,
      receivedDate: form.receivedDate,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
    }
    if (editingDividend) {
      await editDividend(editingDividend.id, data)
    } else {
      await createDividend(data)
    }
    setSheetOpen(false)
  }

  const handleEditForecast = (f: DividendForecast) => {
    setEditingForecast(f)
    setForecastAmount(String(f.forecastPerShare))
    setForecastSheetOpen(true)
  }

  const handleSaveForecast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingForecast) return
    await upsertForecast({
      ...editingForecast,
      forecastPerShare: parseFloat(forecastAmount) || 0,
    })
    setForecastSheetOpen(false)
  }

  const handleRefreshFromYahoo = async () => {
    setRefreshing(true)
    await refreshForecastsFromYahoo(stocks)
    setRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="配当金管理" />

      <div className="p-4 space-y-4">
        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">今年の配当金合計</p>
            <p className="text-2xl font-bold mt-1">{formatJPY(totalThisYear)}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date().getFullYear()}年累計</p>
          </CardContent>
        </Card>

        {/* グラフ */}
        {dividends.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <DividendStackedChart dividends={dividends} />
            </CardContent>
          </Card>
        )}

        <Button className="w-full h-12" onClick={handleOpenAdd}>
          ＋ 配当金を記録
        </Button>

        {/* 予測ボタン */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11 text-sm"
            onClick={generateForecastsFromHistory}
          >
            予測を生成
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 text-sm"
            onClick={handleRefreshFromYahoo}
            disabled={refreshing}
          >
            {refreshing ? '更新中...' : 'Yahoo Financeで更新'}
          </Button>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList className="w-full">
            <TabsTrigger value="calendar" className="flex-1">カレンダー</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">履歴</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-3">
            <DividendCalendar
              dividends={dividends}
              forecasts={forecasts}
              stocksMap={stocksMap}
              onEditForecast={handleEditForecast}
            />
          </TabsContent>
          <TabsContent value="history" className="mt-3">
            <div className="space-y-2">
              {dividends.map((d) => (
                <SwipeToDelete key={d.id} onDelete={() => deleteDividend(d.id)}>
                  <Card className="rounded-lg">
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{d.stockName}</p>
                        <p className="text-xs text-muted-foreground">{d.receivedDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{formatJPY(d.amount)}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleOpenEdit(d)}
                        >
                          編集
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </SwipeToDelete>
              ))}
              {dividends.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  配当金の記録がありません
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 配当金追加/編集 Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto overflow-y-auto pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingDividend ? '配当金を編集' : '配当金を記録'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>銘柄を選択</Label>
              <Select
                value={form.stockId}
                onValueChange={(id) => {
                  const stock = stocks.find((s) => s.id === id)
                  setForm((f) => ({ ...f, stockId: id, stockName: stock?.name ?? '' }))
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="銘柄を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {stocks.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>受取日</Label>
              <Input
                type="date"
                value={form.receivedDate}
                onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>受取金額（税引後）</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="h-12"
                placeholder="0"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setSheetOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" className="flex-1 h-12">保存</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* 予測編集 Sheet */}
      <Sheet open={forecastSheetOpen} onOpenChange={setForecastSheetOpen}>
        <SheetContent side="bottom" className="h-auto pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingForecast?.stockName} 予測を編集</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSaveForecast} className="space-y-4">
            <div className="space-y-2">
              <Label>予想受取額（円）</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={forecastAmount}
                onChange={(e) => setForecastAmount(e.target.value)}
                className="h-12"
                placeholder="0"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setForecastSheetOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" className="flex-1 h-12">保存</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: 動作確認**

```bash
npm run dev
```

確認項目：
- 配当金グラフが表示される（月別・年別タブ切り替え）
- 「＋ 配当金を記録」で追加できる
- 履歴の「編集」ボタンで既存データを修正できる
- 履歴で左スワイプすると削除できる
- カレンダーの予測（破線バッジ）をタップすると編集シートが開く
- 「予測を生成」「Yahoo Financeで更新」ボタンが動作する

- [ ] **Step 4: コミット**

```bash
git add src/pages/DividendsPage.tsx src/components/dividends/DividendCalendar.tsx
git commit -m "feat: add dividend edit, chart, forecast buttons, and calendar forecast edit"
```

---

## Task 10: PortfolioPage・DashboardPage 更新（③）

**Files:**
- Modify: `src/pages/PortfolioPage.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: PortfolioPage.tsx に年間配当を追加**

`src/pages/PortfolioPage.tsx` に以下の変更を加える：

1. インポートに `useDividends` を追加：
```typescript
import { useDividends } from '@/hooks/useDividends'
```

2. コンポーネント内で `dividends` を取得：
```typescript
const { dividends, loadDividends } = useDividends()
```

3. `useEffect` で `loadDividends()` も呼ぶ：
```typescript
useEffect(() => {
  loadStocks()
  loadDividends()
  getUsdJpyRate().then(setUsdJpy)
}, [loadStocks, loadDividends])
```

4. 過去12ヶ月の銘柄別配当合計を計算する `useMemo` を追加：
```typescript
const annualDividendMap = useMemo(() => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const map = new Map<string, number>()
  for (const d of dividends) {
    if (new Date(d.receivedDate) >= oneYearAgo) {
      map.set(d.stockId, (map.get(d.stockId) ?? 0) + d.amount)
    }
  }
  return map
}, [dividends])
```

5. `<StockCard>` に `annualDividendJPY` prop を追加：
```tsx
<StockCard
  key={pnl.stock.id}
  pnl={pnl}
  annualDividendJPY={annualDividendMap.get(pnl.stock.id)}
  onEdit={handleOpenEdit}
  onDelete={deleteStock}
/>
```

- [ ] **Step 2: DashboardPage.tsx に dividends ロードを追加**

`DashboardPage.tsx` は現在 `StockCard` を使っておらず、銘柄一覧を独自の inline レイアウトで表示している。このイテレーションでは `annualDividendJPY` を表示する箇所がないため、**`annualDividendMap` の計算のみ追加し、表示への適用は行わない**。

変更内容:

1. `useDividends` をインポートし、`loadDividends` と `dividends` を取得：
```typescript
import { useDividends } from '@/hooks/useDividends'
// コンポーネント内
const { dividends, loadDividends } = useDividends()
```

2. `useEffect` の依存に `loadDividends` を追加：
```typescript
useEffect(() => {
  loadStocks()
  loadDividends()
  getUsdJpyRate().then(setUsdJpy)
}, [loadStocks, loadDividends])
```

3. `annualDividendMap` の `useMemo` を追加（将来 StockCard 統合時に使用）：
```typescript
const annualDividendMap = useMemo(() => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const map = new Map<string, number>()
  for (const d of dividends) {
    if (new Date(d.receivedDate) >= oneYearAgo) {
      map.set(d.stockId, (map.get(d.stockId) ?? 0) + d.amount)
    }
  }
  return map
}, [dividends])
```

JSXへの変更は不要。`tsconfig` に `noUnusedLocals: true` が設定されている場合、`annualDividendMap` が使われていない警告が出る可能性がある。その場合は `useMemo` の戻り値の型アノテーションを `const _annualDividendMap` に変更するか、変数名の前に `// eslint-disable-next-line @typescript-eslint/no-unused-vars` を追加する。

- [ ] **Step 3: ビルド確認**

```bash
npm run build
```

Expected: TypeScriptエラーなし

- [ ] **Step 4: コミット**

```bash
git add src/pages/PortfolioPage.tsx src/pages/DashboardPage.tsx
git commit -m "feat: pass annual dividend data to StockCard for yield calculation"
```

---

## Task 11: 最終確認・デプロイ

- [ ] **Step 1: 全テスト実行**

```bash
npx vitest run
```

Expected: 全テスト PASS

- [ ] **Step 2: プロダクションビルド確認**

```bash
npm run build
```

Expected: エラーなし

- [ ] **Step 3: 動作最終確認**

```bash
npm run preview
```

ブラウザで `http://localhost:4173/dividend-app/` を開いて以下を確認：
- [ ] ポートフォリオ: 配当利回り・年間配当・NISA非課税バッジが表示される
- [ ] ポートフォリオ: 左スワイプで削除できる
- [ ] ポートフォリオ: 銘柄追加時にコードを入力すると銘柄名が自動入力される
- [ ] 配当金: グラフが表示される（月別・年別切り替え）
- [ ] 配当金: 既存の配当金を編集できる
- [ ] 配当金: 左スワイプで削除できる
- [ ] 配当金: 「予測を生成」ボタンが動作する
- [ ] 配当金: カレンダーの予測をタップして編集できる
- [ ] 優待: 左スワイプで削除できる
- [ ] エラー時にトーストが表示される
- [ ] Chrome DevTools → Application → Manifest でPWAが認識される

- [ ] **Step 4: プッシュ**

```bash
git push
```

GitHub Actions のデプロイ完了後（約1分）、iPhoneで動作確認。
