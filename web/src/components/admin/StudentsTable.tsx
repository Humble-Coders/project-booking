import { StatusChip } from './StatusChip'
import type { StudentRow } from '../../lib/admin'

interface Props {
  students: StudentRow[]
  sendingFor: string | null
  onSend: (email: string) => void
}

function formatSentAt(iso: string | null): string {
  if (iso === null) return '-'
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export function StudentsTable({ students, sendingFor, onSend }: Props) {
  if (students.length === 0) {
    return (
      <p className="rounded-card border border-line bg-card px-5 py-10 text-center text-sm text-muted-text">
        No students match. Sync the sheet to pull in the registered list.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      {/* Header row: desktop only; each card carries its own labels on mobile. */}
      <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-b border-line px-5 py-3 text-[11.5px] font-bold uppercase tracking-wider text-muted-text md:grid">
        <span>Student</span>
        <span>Booked project</span>
        <span>Code sent</span>
        <span>Delivery</span>
        <span className="text-right">Code</span>
      </div>

      <ul>
        {students.map((s) => {
          const busy = sendingFor === s.email
          const label = s.delivery_status === 'none' ? 'Send code' : 'Resend'
          return (
            <li
              key={s.email}
              className="grid grid-cols-1 gap-2 border-b border-line px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-3"
            >
              <span className="truncate text-sm font-semibold" title={s.email}>
                {s.email}
              </span>

              <span className="text-sm text-muted-text">
                <span className="md:hidden">Project: </span>
                {s.project ?? '-'}
              </span>

              <span className="text-[13px] text-muted-text">
                <span className="md:hidden">Code sent: </span>
                {formatSentAt(s.code_sent_at)}
              </span>

              <span>
                <StatusChip status={s.delivery_status} />
              </span>

              <span className="md:text-right">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onSend(s.email)}
                  className="w-full rounded-[10px] border border-line bg-secondary px-3.5 py-2 text-[13px] font-semibold text-text transition-colors hover:border-brand2/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55 md:w-auto"
                >
                  {busy ? 'Sending…' : label}
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
