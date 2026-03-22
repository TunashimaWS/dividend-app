import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useBenefits } from '@/hooks/useBenefits'
import { useStocks } from '@/hooks/useStocks'
import BenefitList from '@/components/benefits/BenefitList'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import type { Benefit } from '@/types'

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}月`,
}))

type BenefitFormData = Omit<Benefit, 'id' | 'createdAt' | 'updatedAt'>

const emptyForm = (): BenefitFormData => ({
  stockId: '',
  stockName: '',
  description: '',
  confirmMonth: new Date().getMonth() + 1,
  minShares: 100,
  estimatedValue: 0,
  memo: '',
})

export default function BenefitsPage() {
  const { benefits, loadBenefits, createBenefit, editBenefit, deleteBenefit } = useBenefits()
  const { stocks, loadStocks } = useStocks()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null)
  const [form, setForm] = useState<BenefitFormData>(emptyForm())

  useEffect(() => {
    loadBenefits()
    loadStocks()
  }, [loadBenefits, loadStocks])

  const handleOpenAdd = () => {
    setEditingBenefit(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  const handleOpenEdit = (b: Benefit) => {
    setEditingBenefit(b)
    setForm({ stockId: b.stockId, stockName: b.stockName, description: b.description, confirmMonth: b.confirmMonth, minShares: b.minShares, estimatedValue: b.estimatedValue, memo: b.memo })
    setSheetOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBenefit) {
      await editBenefit(editingBenefit.id, form)
    } else {
      await createBenefit(form)
    }
    setSheetOpen(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="株主優待" />
      <div className="p-4 space-y-3">
        <Button className="w-full h-12" onClick={handleOpenAdd}>＋ 優待を追加</Button>
        <BenefitList benefits={benefits} onEdit={handleOpenEdit} onDelete={deleteBenefit} />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingBenefit ? '優待を編集' : '優待を追加'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>銘柄</Label>
              <Select
                value={form.stockId}
                onValueChange={(id) => {
                  const s = stocks.find((st) => st.id === id)
                  setForm((f) => ({ ...f, stockId: id, stockName: s?.name ?? '' }))
                }}
              >
                <SelectTrigger className="h-12"><SelectValue placeholder="銘柄を選択..." /></SelectTrigger>
                <SelectContent>
                  {stocks.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>優待内容</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-12" placeholder="例: 食事割引券" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>権利確定月</Label>
                <Select value={String(form.confirmMonth)} onValueChange={(v) => setForm((f) => ({ ...f, confirmMonth: parseInt(v) }))}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTH_OPTIONS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>最低保有株数</Label>
                <Input type="number" min="1" value={form.minShares} onChange={(e) => setForm((f) => ({ ...f, minShares: parseInt(e.target.value) || 1 }))} className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>概算価値（円）</Label>
              <Input type="number" min="0" value={form.estimatedValue} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: parseInt(e.target.value) || 0 }))} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label>メモ（任意）</Label>
              <Input value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} className="h-12" />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setSheetOpen(false)}>キャンセル</Button>
              <Button type="submit" className="flex-1 h-12">保存</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  )
}
