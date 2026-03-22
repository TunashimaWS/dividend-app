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
