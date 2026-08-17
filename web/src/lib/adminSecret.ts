// The instructor types the admin secret once; it lives only in this browser.
// It is NEVER bundled (CLAUDE.md), the edge function is the enforcement layer.

const KEY = 'hc-admin-secret'

export function getAdminSecret(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setAdminSecret(secret: string): void {
  try {
    localStorage.setItem(KEY, secret)
  } catch {
    // storage unavailable, the session just won't persist
  }
}

export function clearAdminSecret(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to do
  }
}
