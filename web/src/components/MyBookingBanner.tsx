interface Props {
  project: string
}

export function MyBookingBanner({ project }: Props) {
  return (
    <div className="mx-auto mb-2 max-w-[1200px] px-5">
      <div className="flex items-center gap-2.5 rounded-card border border-brand/35 bg-gradient-to-r from-brand/16 to-brand/8 px-4.5 py-3.5 text-[14.5px]">
        <span aria-hidden className="text-ok">✓</span>
        <span>
          You've booked <b>{project}</b>. See you in class!
        </span>
      </div>
    </div>
  )
}
