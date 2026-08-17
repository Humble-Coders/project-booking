import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchOverview } from '../lib/admin'
import type { Overview } from '../lib/admin'

const AUTO_REFRESH_MS = 60_000

interface State {
  overview: Overview | null
  loading: boolean
  /** True when the server rejected the secret, the page returns to the gate. */
  unauthorized: boolean
  reload: () => Promise<void>
}

/**
 * Owns the overview data for a given secret: initial load, ~60 s auto-refresh,
 * and manual reload. Auto-refresh pauses while `paused` is true so a poll can't
 * land mid-mutation and show stale rows.
 */
export function useAdminOverview(secret: string | null, paused: boolean): State {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const reload = useCallback(async () => {
    if (secret === null) return
    const res = await fetchOverview(secret)
    if (res.ok) {
      setOverview(res.data)
      setUnauthorized(false)
    } else if (res.error === 'unauthorized') {
      setUnauthorized(true)
    }
    setLoading(false)
  }, [secret])

  useEffect(() => {
    if (secret === null) return
    setLoading(true)
    void reload()
    const timer = setInterval(() => {
      if (!pausedRef.current) void reload()
    }, AUTO_REFRESH_MS)
    return () => clearInterval(timer)
  }, [secret, reload])

  return { overview, loading, unauthorized, reload }
}
