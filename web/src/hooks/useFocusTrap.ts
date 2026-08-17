import { useEffect, type RefObject } from 'react'

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * While mounted: keeps Tab cycling inside `container`, calls `onEscape` on Esc,
 * focuses the first focusable on open, and restores focus to the previously
 * focused element on unmount.
 */
export function useFocusTrap(container: RefObject<HTMLElement | null>, onEscape: () => void) {
  useEffect(() => {
    const node = container.current
    if (!node) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () => [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
    focusables()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [container, onEscape])
}
