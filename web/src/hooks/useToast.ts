import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: number
  message: string
  tone: 'ok' | 'bad'
}

const LIFETIME_MS = 5000

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone: Toast['tone'] = 'ok') => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, tone }])
      setTimeout(() => dismiss(id), LIFETIME_MS)
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}
