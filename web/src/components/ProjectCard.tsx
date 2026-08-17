import type { Project } from '../lib/types'

interface Props {
  project: Project
  onBook: (project: Project) => void
}

export function ProjectCard({ project, onBook }: Props) {
  const { seats_left: seatsLeft, capacity } = project
  const full = seatsLeft <= 0
  const low = !full && seatsLeft <= 3
  const noKey = /no key/i.test(project.api_note)
  const fillPct = capacity > 0 ? ((capacity - seatsLeft) / capacity) * 100 : 100

  return (
    <article
      className={`flex flex-col gap-3 rounded-card border border-line bg-card p-[22px] transition-[transform,border-color,opacity] duration-200 ${
        full ? 'opacity-55' : 'hover:-translate-y-[3px] hover:border-brand2/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <span className="whitespace-nowrap rounded-lg border border-brand/30 bg-brand/15 px-2 py-[3px] text-xs font-bold text-brand2">
          Project {String(project.id).padStart(2, '0')}
        </span>
        <span
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
            noKey ? 'border-ok/25 bg-ok/10 text-ok' : 'border-gold/25 bg-gold/10 text-gold'
          }`}
        >
          {project.api_note}
        </span>
      </div>

      <h3 className="text-lg font-bold tracking-tight">{project.title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-muted-text">{project.description}</p>

      <a
        href={project.api_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 py-1 text-[13px] font-semibold text-brand2 hover:underline"
      >
        {project.api_name} ↗
      </a>

      <div className="flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              low
                ? 'bg-gradient-to-r from-amber-dark to-amber-deep'
                : 'bg-gradient-to-r from-brand to-brand2'
            }`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <span
          className={`whitespace-nowrap text-[12.5px] font-semibold ${
            full ? 'text-bad' : low ? 'text-amber' : 'text-muted-text'
          }`}
        >
          {full ? 'Fully booked' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
        </span>
      </div>

      <button
        type="button"
        disabled={full}
        onClick={() => onBook(project)}
        className="mt-0.5 w-full rounded-[10px] bg-brand py-[11px] text-[14.5px] font-semibold text-text transition-colors hover:bg-brand2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-text"
      >
        {full ? 'Fully Booked' : 'Book This Project'}
      </button>
    </article>
  )
}
