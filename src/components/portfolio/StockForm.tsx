import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Stock, StockType, AccountType } from '@/types'
import { fetchStockName } from '@/api/stockPrice'
import { showToast } from '@/stores/toastStore'

type StockFormData = Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>

interface Props {
  initial?: Partial<StockFormData>
  onSubmit: (data: StockFormData) => Promise<void>
  onCancel: () => void
}

const STOCK_TYPE_OPTIONS: { value: StockType; label: string }[] = [
  { value: 'jp_stock', label: '日本株' },
  { value: 'us_stock', label: '米国株' },
  { value: 'index_fund', label: 'インデックスファンド' },
]

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'nisa', label: 'NISA口座' },
  { value: 'specific', label: '特定口座' },
  { value: 'general', label: '一般口座' },
]

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
  const [submitting, setSubmitting] = useState(false)
  const [fetchingName, setFetchingName] = useState(false)

  const handleTypeChange = (type: StockType) => {
    setForm((f) => ({
      ...f,
      type,
      currency: type === 'us_stock' ? 'USD' : 'JPY',
    }))
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">銘柄名</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="h-12"
          placeholder="例: トヨタ自動車"
          disabled={fetchingName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">証券コード / ティッカー</Label>
        <Input
          id="code"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          onBlur={handleCodeBlur}
          required
          className="h-12"
          placeholder="例: 7203 / AAPL"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>株種別</Label>
          <Select value={form.type} onValueChange={(v) => handleTypeChange(v as StockType)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCK_TYPE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>口座種別</Label>
          <Select
            value={form.account}
            onValueChange={(v) => setForm((f) => ({ ...f, account: v as AccountType }))}
          >
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="shares">保有株数</Label>
          <Input
            id="shares"
            type="number"
            min="0"
            step="0.001"
            value={form.shares}
            onChange={(e) => setForm((f) => ({ ...f, shares: parseFloat(e.target.value) || 0 }))}
            required
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgPrice">取得単価（{form.currency}）</Label>
          <Input
            id="avgPrice"
            type="number"
            min="0"
            step="0.01"
            value={form.avgPrice}
            onChange={(e) =>
              setForm((f) => ({ ...f, avgPrice: parseFloat(e.target.value) || 0 }))
            }
            required
            className="h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaseDate">取得日</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={form.purchaseDate}
          onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">メモ（任意）</Label>
        <Input
          id="memo"
          value={form.memo}
          onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
          className="h-12"
          placeholder="備考など"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button type="submit" className="flex-1 h-12" disabled={submitting}>
          {submitting ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  )
}
