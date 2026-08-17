import type { Overview } from '../../lib/admin'

export type BusyAction = 'all_pending' | 'refresh_status' | 'sync_sheet' | 'reload' | 'gate' | null

interface Props {
  overview: Overview
  busy: BusyAction
  search: string
  onSearch: (value: string) => void
  onSendAllPending: () => void
  onRefreshStatuses: () => void
  onSyncSheet: () => void
  onSetBookingOpen: (open: boolean) => void
  onReload: () => void
  onLogout: () => void
}

export function Toolbar({
  overview,
  busy,
  search,
  onSearch,
  onSendAllPending,
  onRefreshStatuses,
  onSyncSheet,
  onSetBookingOpen,
  onReload,
  onLogout,
}: Props) {
  const pending = overview.students.filter((s) => s.delivery_status === 'none').length
  const { totals, booking_open: bookingOpen } = overview

  const stats: Array<[string, number]> = [
    ['students', totals.students],
    ['booked', totals.booked],
    ['unbooked', totals.unbooked],
    ['codes delivered', totals.delivered],
  ]

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-card border border-line bg-card p-5">
      <GateControl
        bookingOpen={bookingOpen}
        busy={busy}
        onSetBookingOpen={onSetBookingOpen}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        {stats.map(([label, n]) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-full border border-line bg-secondary px-3.5 py-1.5 text-[13px] font-semibold text-muted-text"
          >
            <b className="text-text">{n}</b> {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy !== null || pending === 0}
          onClick={onSendAllPending}
          className="rounded-[10px] bg-brand px-4 py-2.5 text-[13.5px] font-semibold text-text transition-colors hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy === 'all_pending' ? 'Sending…' : `Send codes to all pending (${pending})`}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={onRefreshStatuses}
          className="rounded-[10px] border border-line bg-secondary px-4 py-2.5 text-[13.5px] font-semibold text-text transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy === 'refresh_status' ? 'Checking…' : 'Refresh delivery statuses'}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={onSyncSheet}
          className="rounded-[10px] border border-line bg-secondary px-4 py-2.5 text-[13.5px] font-semibold text-text transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy === 'sync_sheet' ? 'Syncing…' : 'Sync sheet'}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={onReload}
          className="rounded-[10px] border border-line bg-secondary px-4 py-2.5 text-[13.5px] font-semibold text-text transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy === 'reload' ? 'Refreshing…' : 'Refresh data'}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-[10px] border border-line bg-transparent px-4 py-2.5 text-[13.5px] font-semibold text-muted-text transition-colors hover:text-text sm:ml-auto"
        >
          Log out
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search students by email or project…"
        aria-label="Search students"
        className="w-full rounded-[10px] border border-line bg-field px-4 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted-text/50 focus:border-brand"
      />
    </div>
  )
}

/**
 * The booking gate. This is the real thing, not a display toggle: `book_project`
 * reads the same row on every attempt, so what this says is what students get.
 * An unreadable gate shows as unknown rather than guessing a state.
 */
function GateControl({
  bookingOpen,
  busy,
  onSetBookingOpen,
}: {
  bookingOpen: boolean | null
  busy: BusyAction
  onSetBookingOpen: (open: boolean) => void
}) {
  const working = busy === 'gate'

  const { frame, dot, title, detail } =
    bookingOpen === true
      ? {
          frame: 'border-ok/35 bg-ok/10',
          dot: 'bg-ok',
          title: 'Booking is OPEN',
          detail: 'Any student with a valid code can book a seat right now.',
        }
      : bookingOpen === false
        ? {
            frame: 'border-gold/35 bg-gold/10',
            dot: 'bg-gold',
            title: 'Booking is CLOSED',
            detail: 'Students can browse the catalogue, but every booking attempt is refused.',
          }
        : {
            frame: 'border-line bg-secondary',
            dot: 'bg-muted-text',
            title: 'Booking status unknown',
            detail: "Couldn't read the setting. Hit Refresh data before touching this.",
          }

  return (
    <div className={`flex flex-col gap-3 rounded-[12px] border p-4 sm:flex-row sm:items-center ${frame}`}>
      <div className="flex-1">
        <p className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight">
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dot}`} />
          {title}
        </p>
        <p className="mt-1 pl-[20px] text-[13px] leading-relaxed text-muted-text">{detail}</p>
      </div>

      {/* Boolean check, not `!== null`: an admin function that predates this
          field sends nothing at all, and `!undefined` would flip the gate open. */}
      {typeof bookingOpen === 'boolean' && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => onSetBookingOpen(!bookingOpen)}
          className={`shrink-0 rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
            bookingOpen
              ? 'border border-line bg-secondary text-text hover:bg-muted'
              : 'bg-brand text-text hover:bg-brand2'
          }`}
        >
          {working ? 'Saving…' : bookingOpen ? 'Close booking' : 'Open booking now'}
        </button>
      )}
    </div>
  )
}
