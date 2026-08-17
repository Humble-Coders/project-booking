import type { ProjectRow } from '../../lib/admin'

export function ProjectsSummary({ projects }: { projects: ProjectRow[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
      {projects.map((p) => {
        const full = p.booked.length >= p.capacity
        return (
          <div key={p.id} className="rounded-card border border-line bg-card p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-bold tracking-tight">{p.title}</h3>
              <span
                className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                  full ? 'border-bad/30 bg-bad/12 text-bad' : 'border-line bg-secondary text-muted-text'
                }`}
              >
                {p.booked.length}/{p.capacity}
              </span>
            </div>
            {p.booked.length === 0 ? (
              <p className="text-[13px] text-muted-text">No bookings yet</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {p.booked.map((email) => (
                  <li key={email} className="truncate text-[13px] text-muted-text" title={email}>
                    {email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
