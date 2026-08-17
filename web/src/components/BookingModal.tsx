import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { bookProject, sanitizeCode, CODE_LENGTH } from '../lib/booking'
import type { BookResult } from '../lib/booking'
import { setMyBooking } from '../lib/myBooking'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { Project } from '../lib/types'

interface Props {
  project: Project
  onClose: () => void
  /** Force-sync seat counts after any attempt outcome (server is truth). */
  onOutcome: () => void
}

export function BookingModal({ project, onClose, onOutcome }: Props) {
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<BookResult | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    if (!pending) onClose()
  }, [pending, onClose])

  useFocusTrap(boxRef, close)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending || code.length !== CODE_LENGTH) return
    setPending(true)
    const res = await bookProject(code, project.id)
    if (res.ok) setMyBooking(res.project)
    else if (res.error === 'already_booked' && res.project) setMyBooking(res.project)
    setResult(res)
    setPending(false)
    onOutcome()
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
        aria-label={`Book ${project.title}`}
        className="w-full max-w-[430px] rounded-[18px] border border-line bg-card p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {result === null ? (
          <form onSubmit={(e) => void submit(e)}>
            <p className="mb-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand2">
              Book your seat
            </p>
            <h2 className="mb-1 text-[21px] font-bold tracking-tight">{project.title}</h2>
            <p className="mb-5 text-sm leading-relaxed text-muted-text">
              Enter the personal booking code from your email. That code is your identity. No
              sign-in needed.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(sanitizeCode(e.target.value))}
              placeholder="ABC123"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              aria-label="Booking code"
              className="w-full rounded-[10px] border border-line bg-field px-4 py-3 text-center font-mono text-2xl font-bold tracking-[12px] text-text outline-none transition-colors placeholder:text-muted-text/40 focus:border-brand"
            />
            <div className="mt-4.5 flex gap-2.5">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="flex-1 rounded-[10px] border border-line bg-transparent py-3 text-[14.5px] font-semibold text-muted-text transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-55"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || code.length !== CODE_LENGTH}
                className="flex-1 rounded-[10px] bg-brand py-3 text-[14.5px] font-semibold text-text transition-colors hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {pending ? 'Booking…' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        ) : (
          <ResultView result={result} project={project} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

function ResultView({
  result,
  project,
  onClose,
}: {
  result: BookResult
  project: Project
  onClose: () => void
}) {
  if (result.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4.5 flex h-[62px] w-[62px] items-center justify-center rounded-full border-[1.5px] border-ok/40 bg-ok/12 text-[28px] text-ok">
          ✓
        </div>
        <h2 className="mb-1 text-[21px] font-bold tracking-tight">Seat booked. It's yours!</h2>
        <p className="mb-5 text-sm leading-relaxed text-muted-text">
          Booked as <b className="text-text">{result.email}</b>
          <br />
          Your project: <b className="text-text">{result.project}</b>. Happy building! 🎉
        </p>
        <DoneButton onClose={onClose} />
      </div>
    )
  }

  const view = {
    invalid_code: {
      icon: '✕',
      tone: 'bad',
      title: "That code didn't match",
      body: 'Check the code from your email. If you were sent a new one, only the newest email counts. Your instructor can resend it anytime.',
    },
    already_booked: {
      icon: '✓',
      tone: 'ok',
      title: 'You already have a seat',
      body: `This code has already booked ${result.project ? `“${result.project}”` : 'a project'}. One booking per student, so you're all set.`,
    },
    full: {
      icon: '✕',
      tone: 'bad',
      title: 'That seat just went',
      body: `Someone grabbed the last seat on “${project.title}” a moment ago. The counts are refreshed. Pick another project you like.`,
    },
    no_project: {
      icon: '✕',
      tone: 'bad',
      title: "That project doesn't exist",
      body: 'Refresh the page and try again. The list may have changed.',
    },
    network: {
      icon: '✕',
      tone: 'bad',
      title: "Couldn't reach the server",
      body: 'Check your connection and try again. Nothing was booked.',
    },
  }[result.error]

  return (
    <div className="text-center">
      <div
        className={`mx-auto mb-4.5 flex h-[62px] w-[62px] items-center justify-center rounded-full border-[1.5px] text-[28px] ${
          view.tone === 'ok' ? 'border-ok/40 bg-ok/12 text-ok' : 'border-bad/40 bg-bad/12 text-bad'
        }`}
      >
        {view.icon}
      </div>
      <h2 className="mb-1 text-[21px] font-bold tracking-tight">{view.title}</h2>
      <p className="mb-5 text-sm leading-relaxed text-muted-text">{view.body}</p>
      <DoneButton onClose={onClose} />
    </div>
  )
}

function DoneButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="w-full rounded-[10px] bg-brand py-3 text-[14.5px] font-semibold text-text transition-colors hover:bg-brand2"
    >
      Done
    </button>
  )
}
