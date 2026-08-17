// Cosmetic "you've booked X" note. localStorage is convenience only —
// the database is the sole truth (PRD §5.2). Guarded: storage can throw
// (private mode, disabled cookies), and the banner is never worth crashing for.

const KEY = 'hc-my-booking'

export function getMyBooking(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setMyBooking(project: string): void {
  try {
    localStorage.setItem(KEY, project)
  } catch {
    // storage unavailable — banner just won't persist
  }
}
