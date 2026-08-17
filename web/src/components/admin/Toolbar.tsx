import type { Overview } from '../../lib/admin'

export type BusyAction = 'all_pending' | 'refresh_status' | 'sync_sheet' | 'reload' | null

interface Props {
  overview: Overview
  busy: BusyAction
  search: string
  onSearch: (value: string) => void
  onSendAllPending: () => void
  onRefreshStatuses: () => void
  onSyncSheet: () => void
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
  onReload,
  onLogout,
}: Props) {
  const pending = overview.students.filter((s) => s.delivery_status === 'none').length
  const { totals } = overview

  const stats: Array<[string, number]> = [
    ['students', totals.students],
    ['booked', totals.booked],
    ['unbooked', totals.unbooked],
    ['codes delivered', totals.delivered],
  ]

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-card border border-line bg-card p-5">
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
