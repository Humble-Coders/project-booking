/**
 * Shown while the instructor's gate is closed. Browsing is deliberately
 * untouched, this only explains why the Book buttons aren't live yet.
 * It disappears on its own the moment booking opens (realtime), no refresh.
 */
export function BookingClosedBanner() {
  return (
    <div className="mx-auto mb-2 max-w-[1200px] px-5">
      <div className="flex flex-col gap-1 rounded-card border border-gold/35 bg-gold/10 px-4.5 py-3.5">
        <div className="flex items-center gap-2.5 text-[14.5px] font-semibold">
          <span aria-hidden className="text-gold">
            ●
          </span>
          Booking hasn't opened yet
        </div>
        <p className="pl-[22px] text-[13.5px] leading-relaxed text-muted-text">
          Have a proper look around and shortlist two or three projects you'd be happy with. The
          Book buttons switch on here automatically the moment your instructor opens booking, so
          keep this page open, you won't need to refresh.
        </p>
      </div>
    </div>
  )
}
