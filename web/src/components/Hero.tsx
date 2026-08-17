const STATS: Array<[string, string]> = [
  ['25', 'projects'],
  ['10', 'seats each'],
  ['1', 'booking per student'],
]

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-12 pt-[72px] text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,_var(--color-brand)_0%,_transparent_70%)] opacity-25"
      />
      <h1 className="relative mx-auto mb-4 max-w-[800px] text-[clamp(30px,5.5vw,52px)] font-extrabold tracking-tight">
        Pick Your <span className="text-brand2">API Project</span>
      </h1>
      <p className="relative mx-auto mb-7 max-w-[620px] text-[clamp(15px,2vw,17px)] leading-relaxed text-muted-text">
        25 beginner-friendly Android project ideas, each powered by a free public API.
        Browse openly. When you're ready, book yours with the personal code from your email.
      </p>
      <div className="relative flex flex-wrap items-center justify-center gap-3">
        {STATS.map(([n, label]) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-full border border-line bg-card px-[18px] py-2 text-[13.5px] font-semibold text-muted-text"
          >
            <span className="h-[7px] w-[7px] rounded-full bg-brand2" />
            <b className="text-text">{n}</b> {label}
          </span>
        ))}
      </div>
    </section>
  )
}
