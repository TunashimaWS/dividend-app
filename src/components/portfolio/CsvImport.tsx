import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { parseSbiCsv } from '@/lib/csv'
import type { Stock } from '@/types'

type ImportableStock = Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'currentPrice'>

interface Props {
  onImport: (stocks: ImportableStock[]) => Promise<void>
}

export default function CsvImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportableStock[]>([])
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
    if (preview.length === 0) return
    setLoading(true)
    try {
      await onImport(preview)
      setPreview([])
      if (inputRef.current) inputRef.current.value = ''
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        className="w-full h-12"
        onClick={() => inputRef.current?.click()}
      >
        SBI証券 CSVを選択
      </Button>

      {preview.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {preview.length}件を取り込みます
            <span className="block text-xs">※口座種別は「特定口座」に設定されます。必要に応じて変更してください。</span>
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
            {preview.map((s, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>{s.name}（{s.code}）</span>
                <Badge variant="outline">{s.shares}株</Badge>
              </div>
            ))}
          </div>
          <Button className="w-full h-12" onClick={handleImport} disabled={loading}>
            {loading ? 'インポート中...' : `${preview.length}件をインポート`}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setPreview([])
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            キャンセル
          </Button>
        </>
      )}
    </div>
  )
}
