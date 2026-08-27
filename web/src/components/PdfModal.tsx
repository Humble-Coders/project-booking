import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { sanitizeCode, CODE_LENGTH } from '../lib/booking'
import { requestProjectPdf } from '../lib/pdf'
import type { PdfResult } from '../lib/pdf'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { Project } from '../lib/types'

interface Props {
  project: Project
  onClose: () => void
}

export function PdfModal({ project, onClose }: Props) {
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<PdfResult | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    if (!pending) onClose()
  }, [pending, onClose])

  useFocusTrap(boxRef, close)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending || code.length !== CODE_LENGTH) return
    setPending(true)
    const res = await requestProjectPdf(code, project.id)
    setPending(false)
    setResult(res)
    // The signed link is short lived, so open it the moment it arrives.
    if (res.ok) window.location.href = res.url
  }

  const message = (r: PdfResult): string => {
    if (r.ok) return 'Your download is starting. If nothing happens, tap the button again.'
    switch (r.error) {
      case 'invalid_code':
        return 'That code did not match. Check the code from your email, and remember that only the newest email counts.'
      case 'not_booked':
        return 'This code has not booked a project yet. Book your seat first, then the brief is yours to download.'
      case 'wrong_project':
        return `This code booked ${r.project ? `"${r.project}"` : 'a different project'}, so that is the brief you can download.`
      case 'no_file':
        return 'The brief for this project is not published yet. Ask your instructor.'
      default:
        return 'Could not reach the server. Check your connection and try again.'
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-bg/80 p-5 backdrop-blur-sm"
      onClick={close}
      role="presentation"
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Download the brief for ${project.title}`}
        className="w-full max-w-[430px] rounded-[18px] border border-line bg-card p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand2">
          Project brief
        </p>
        <h2 className="mb-1 text-[21px] font-bold tracking-tight">{project.title}</h2>
        <p className="mb-5 text-sm leading-relaxed text-muted-text">
          Enter your booking code. The brief is available to the student who booked this project.
        </p>

        <form onSubmit={(e) => void submit(e)}>
          <input
            value={code}
            onChange={(e) => setCode(sanitizeCode(e.target.value))}
            placeholder="ABC123"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Booking code"
            className="w-full rounded-[10px] border border-line bg-field px-4 py-3 text-center font-mono text-2xl font-bold tracking-[12px] text-text outline-none transition-colors placeholder:text-muted-text/40 focus:border-brand"
          />

          {result !== null && (
            <p
              className={`mt-3 text-[13.5px] leading-relaxed ${result.ok ? 'text-ok' : 'text-bad'}`}
            >
              {message(result)}
            </p>
          )}

          <div className="mt-4.5 flex gap-2.5">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="flex-1 rounded-[10px] border border-line bg-transparent py-3 text-[14.5px] font-semibold text-muted-text transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-55"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={pending || code.length !== CODE_LENGTH}
              className="flex-1 rounded-[10px] bg-brand py-3 text-[14.5px] font-semibold text-text transition-colors hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {pending ? 'Checking…' : 'Download PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
