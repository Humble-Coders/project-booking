import type { Toast } from '../../hooks/useToast'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function Toasts({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-5 left-1/2 z-100 flex w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onDismiss(t.id)}
          className={`w-full rounded-card border px-4 py-3 text-left text-[13.5px] leading-relaxed backdrop-blur-md ${
            t.tone === 'ok'
              ? 'border-ok/35 bg-ok/12 text-text'
              : 'border-bad/35 bg-bad/12 text-text'
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
