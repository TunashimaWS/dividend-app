# 配当金アプリ 機能拡張 設計仕様書

Date: 2026-03-22

## 概要

以下の9機能を実装する。既存パターン（Zustand store → hook → page）を踏襲し、新規ライブラリは最小限に抑える。⑧（夫婦のポートフォリオ切り替え）は今回の対象外。

---

## ① PWA化

**目的:** iPhoneのホーム画面にアイコンを追加し、アプリのように起動できるようにする。

**実装:**
- `public/manifest.json` を新規作成
  - `name`: 配当金管理、`short_name`: 配当管理
  - `start_url`: `/dividend-app/`、`display`: `standalone`
  - `theme_color`: `#0f172a`（ダークテーマに合わせる）
  - `background_color`: `#0f172a`
  - icons: `favicon.svg` を 192×192 / 512×512 として登録（SVGはどのサイズでも対応可）
- `index.html` に `<link rel="manifest" href="/dividend-app/manifest.json">` を追記
- `index.html` にすでにある apple-mobile-web-app 系タグはそのまま活用
- Service Worker は実装しない（キャッシュ問題を避けるため）

---

## ② 配当金の編集機能

**目的:** 入力ミスした配当金の金額・日付を削除なしで修正できるようにする。

**実装:**
- `dividendStore.ts` に `updateDividend(id, data)` を追加
- `useDividends.ts` に `editDividend(id, data)` を追加（`updateDocument` 呼び出し）
- `DividendsPage.tsx`:
  - `editingDividend: Dividend | null` state を追加
  - 履歴タブの各カードに「編集」ボタンを追加（削除と並列）
  - 既存の「配当金を記録」Sheet を編集でも共用する（`editingDividend` の有無でタイトル・動作を切り替え）

---

## ③ 配当利回りの表示

**目的:** 各銘柄がどれだけ効率よく配当を生んでいるかを株カードで確認できるようにする。

**計算式:**
- 年間配当額（円）= 過去12ヶ月の受取配当記録の合計（その銘柄）
- 配当利回り（%）= 年間配当額 ÷ 現在評価額（円） × 100

**実装:**
- `PortfolioPage.tsx`: `loadDividends()` を追加で呼び出し、銘柄ごとの過去12ヶ月合計を `Map<stockId, number>` として計算
- `StockCard.tsx`: `annualDividendJPY?: number` prop を追加
  - グリッドに2項目追加:「配当利回り」（黄色）・「年間配当（実績）」
  - データがない場合は「記録なし」と表示
- `DashboardPage.tsx` も同様に dividends をロードして `StockPnL` に `annualDividendJPY` を付与

---

## ④ エラー時のフィードバック改善

**目的:** API失敗・Firestore失敗時に無言で終わらず、ユーザーに伝える。

**実装:**
- `src/components/ui/Toast.tsx` を新規作成（shadcn/ui の `Alert` を使ったシンプルなトースト）
  - 画面上部に固定表示、3秒後に自動消去
- `src/hooks/useToast.ts` を新規作成
  - `showError(message)` / `showSuccess(message)` を提供
- 適用箇所:
  - `stockPrice.ts`: 全銘柄取得失敗時に `showError('株価の取得に失敗しました')`
  - `useDividends.ts`: Firestore操作失敗時
  - `useStocks.ts`: Firestore操作失敗時
  - `api/dividendData.ts`: Yahoo Finance配当取得失敗時

---

## ⑤ 配当金グラフ（月別＋年別、会社ごとに色分け）

**目的:** 月・年ごとの配当推移を視覚的に把握できるようにする。

**実装:**
- `src/components/charts/DividendStackedChart.tsx` を新規作成
  - **月別タブ**: `StackedBarChart`（Recharts）
    - X軸: 1〜12月、Y軸: 受取額（円）
    - 各Barが銘柄（stockName）ごとにスタック
    - 色パレット: 最大10銘柄まで固定カラー配列で対応
  - **年別タブ**: `BarChart`
    - X軸: 年（例: 2024, 2025, 2026）、Y軸: 年間合計額
    - 単色（青）でシンプルに表示
  - タブ切り替えは既存の `Tabs` コンポーネントを使用
- `DividendsPage.tsx`:
  - 既存の「カレンダー / 履歴」タブの前にグラフカードを追加

---

## ⑥ NISA口座の税制表示

**目的:** NISA口座の株は配当が非課税であることを明示する。

**実装:**
- `StockCard.tsx`:
  - `account === 'nisa'` のとき、配当利回りの隣に緑バッジ「非課税」を表示
  - ツールチップ的なラベル: 「NISA口座のため配当は税引なし」
- `DividendsPage.tsx`:
  - 配当記録の銘柄がNISA口座の場合、金額の隣に「NISA」バッジを表示
  - ※ 口座種別は `stocks` から `stockId` で引いて判定

---

## ⑦ 配当金の予測表示（3段階ハイブリッド）

**目的:** 今年の配当予定をカレンダーに薄く表示し、確認・修正できるようにする。

### データモデル
既存の `DividendForecast` 型を使用（`types/index.ts` に定義済み）。`amount` フィールドは追加しない。
```
DividendForecast { id, stockId, stockName, forecastPerShare, currency, confirmMonth, payMonth, updatedAt }
```
- 表示金額の計算: `forecastPerShare × stock.shares × (USDの場合はusdJpy)` をcomponent側で行う
- ユーザーの編集入力は「合計金額（円）」で受け取り、hookが `forecastPerShare = 入力額 ÷ shares` に変換してFirestoreに保存

Firestoreコレクション: `users/{uid}/forecasts`

### 3段階の仕組み

**Stage 1 – 自動生成（去年の記録から）:**
- `useDividends.ts` に `generateForecastsFromHistory()` を追加
- 昨年の `dividends` を銘柄・月ごとに集計 → `DividendForecast` として Firestore に保存
- 上書き条件: 同じ `stockId` + `payMonth` の予測がすでに存在する場合はスキップ（年度・古さに関係なく保護）。ユーザーが手動編集した内容を保つため。
- DividendsPage に「予測を生成」ボタンを追加

**Stage 2 – 手動編集:**
- `useDividends.ts` に `updateForecast(id, data)` を追加（`updateDocument` 呼び出し）
- `DividendCalendar.tsx`: 予測エントリーをタップすると編集シートを開く

**Stage 3 – Yahoo Finance から更新:**
- `src/api/dividendData.ts` を新規作成
  - `fetchDividendHistory(code, type)` 関数
  - Yahoo Finance `v8/finance/chart` に `events=div&range=2y` で1株あたり配当額・日付を取得
  - allorigins.win プロキシ経由（既存の株価取得と同じ方式）
- `useDividends.ts` に `refreshForecastsFromYahoo(stocks)` を追加
  - 各銘柄のYahoo Finance配当データを取得
  - 該当する予測の `forecastPerShare` を更新
- DividendsPage に「Yahoo Financeで更新」ボタンを追加（ローディング表示つき）

### カレンダー表示
- `DividendCalendar.tsx`: 予測は薄い青・破線ボーダーで表示、実績は通常表示
- 予測をタップ → 編集シート（入力項目: 合計金額（円）・支払月・銘柄名）。`forecastPerShare` への変換はhook側で行う。

---

## ⑨ スワイプで削除

**目的:** 削除ボタンを廃止し、左スワイプで削除操作をできるようにする。

**実装:**
- `src/components/ui/SwipeToDelete.tsx` を新規作成
  - `children` + `onDelete` prop を受け取るラッパーコンポーネント
  - `onTouchStart/Move/End` でスワイプ量を計測
  - 左方向80px以上スワイプ → 赤い削除ゾーン（「削除」テキスト付き）を右端に出す
  - 削除ゾーンをタップ または スワイプをさらに引く（160px）で `confirm` なしで削除実行
  - スワイプ途中でタッチ離したら元の位置に戻る（バネアニメーション）
  - マウス操作（PC）でも動作するよう `mousedown/move/up` にも対応
- 適用箇所:
  - `StockCard.tsx`: 削除ボタンを削除 → `SwipeToDelete` でラップ（編集ボタンは残す）
  - `BenefitList.tsx`: 削除ボタンを削除 → `SwipeToDelete` でラップ（編集ボタンは残す）
  - `DividendsPage.tsx` 履歴リスト: 削除ボタンを削除 → `SwipeToDelete` でラップ。②で追加する編集ボタンはカード内に残す

---

## ⑩ 株コードから銘柄名自動入力

**目的:** 銘柄コードを入力したとき、銘柄名を自動で補完し入力ミスを減らす。

**実装:**
- `src/api/stockPrice.ts` に `fetchStockName(code, type)` を追加
  - Yahoo Finance `v8/finance/chart` の `meta.shortName` または `meta.longName` を取得
  - 失敗時は `null` を返す
- `StockForm.tsx`:
  - コードフィールドの `onBlur` で `fetchStockName` を呼び出し
  - 名前フィールドが空、またはフォームが「新規追加」モードの場合のみ自動入力
  - 取得中は名前フィールドに「取得中...」を表示
  - 取得失敗時はトーストで「銘柄名の自動取得に失敗しました（手動で入力してください）」を表示

---

## ファイル変更一覧

| 操作 | ファイル |
|------|---------|
| 新規作成 | `public/manifest.json` |
| 新規作成 | `src/components/ui/Toast.tsx` |
| 新規作成 | `src/hooks/useToast.ts` |
| 新規作成 | `src/components/ui/SwipeToDelete.tsx` |
| 新規作成 | `src/components/charts/DividendStackedChart.tsx` |
| 新規作成 | `src/api/dividendData.ts` |
| 修正 | `index.html` |
| 変更なし | `src/types/index.ts`（DividendForecastへのamountフィールド追加は見送り。forecastPerShareで管理） |
| 修正 | `src/stores/dividendStore.ts` |
| 修正 | `src/hooks/useDividends.ts` |
| 修正 | `src/hooks/useStocks.ts` |
| 修正 | `src/api/stockPrice.ts` |
| 修正 | `src/components/portfolio/StockCard.tsx` |
| 修正 | `src/components/portfolio/StockForm.tsx` |
| 修正 | `src/components/benefits/BenefitList.tsx` |
| 修正 | `src/components/dividends/DividendCalendar.tsx` |
| 修正 | `src/pages/DividendsPage.tsx` |
| 修正 | `src/pages/PortfolioPage.tsx` |
| 修正 | `src/pages/DashboardPage.tsx` |

---

## 実装順序（依存関係を考慮）

1. `useToast` + `Toast.tsx`（④）— 他の機能が使うため先に
2. `SwipeToDelete.tsx`（⑨）— StockCard変更前に
3. `manifest.json` + `index.html`（①）— 独立
4. `fetchStockName` + `StockForm`（⑩）— 独立
5. `dividendData.ts`（⑦ Stage 3）— store変更前に
6. `dividendStore` + `useDividends`（② ⑦）— page変更前に
7. `StockCard`（③ ⑥ ⑨）— store変更後
8. `DividendStackedChart`（⑤）— page変更前に
9. `DividendsPage`（② ⑤ ⑦）— 全依存解決後
10. `PortfolioPage` + `DashboardPage`（③）— StockCard変更後
