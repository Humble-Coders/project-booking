import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Project, SeatCountRow, SeatFeedMode } from '../lib/types'

// Polling cadence (PRD §6): lazy safety net while realtime is healthy; tight
// with jitter when it isn't (free plan caps realtime at 200 connections —
// rejected clients must degrade silently, not stampede in sync).
const POLL_REALTIME_OK_MS = 45_000
const POLL_FALLBACK_MS = 15_000
const FALLBACK_JITTER_MS = 6_000
const REJOIN_MS = 30_000

interface ProjectsState {
  projects: Project[]
  loading: boolean
  /** True only when we have nothing at all to show (initial load failed). */
  error: boolean
  /** Exposed for diagnostics/tests; the UI never surfaces this to students. */
  feedMode: SeatFeedMode
  retry: () => void
}

export function useProjects(): ProjectsState {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [feedMode, setFeedMode] = useState<SeatFeedMode>('polling')

  const feedModeRef = useRef<SeatFeedMode>('polling')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rejoinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasDataRef = useRef(false)

  const setMode = useCallback((mode: SeatFeedMode) => {
    feedModeRef.current = mode
    setFeedMode(mode)
  }, [])

  const fetchProjects = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('get_projects')
    if (rpcError || !Array.isArray(data)) {
      // Keep showing the last known data; only the initial load may error the UI.
      if (!hasDataRef.current) setError(true)
      return
    }
    hasDataRef.current = true
    setError(false)
    setProjects(data as Project[])
    setLoading(false)
  }, [])

  // Self-rescheduling poll; interval depends on the current feed mode.
  const schedulePoll = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current)
    const delay =
      feedModeRef.current === 'realtime'
        ? POLL_REALTIME_OK_MS
        : POLL_FALLBACK_MS + Math.random() * FALLBACK_JITTER_MS
    pollTimer.current = setTimeout(() => {
      void fetchProjects().finally(schedulePoll)
    }, delay)
  }, [fetchProjects])

  const applySeatEvent = useCallback((row: SeatCountRow) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === row.project_id
          ? { ...p, seats_left: Math.max(p.capacity - row.booked, 0) }
          : p,
      ),
    )
  }, [])

  useEffect(() => {
    let disposed = false

    const joinRealtime = () => {
      if (disposed) return
      if (channelRef.current) void supabase.removeChannel(channelRef.current)

      const channel = supabase
        .channel('seat-counts')
        .on<SeatCountRow>(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'seat_counts' },
          (payload) => {
            if ('project_id' in payload.new) applySeatEvent(payload.new)
          },
        )
        .subscribe((status) => {
          if (disposed) return
          if (status === 'SUBSCRIBED') {
            setMode('realtime')
            // Counts may have moved while we were away from the socket.
            void fetchProjects()
            schedulePoll()
          } else {
            // CHANNEL_ERROR, TIMED_OUT, CLOSED, too_many_connections — all the
            // same story: tighten polling, quietly retry the join later.
            setMode('polling')
            schedulePoll()
            if (rejoinTimer.current) clearTimeout(rejoinTimer.current)
            rejoinTimer.current = setTimeout(joinRealtime, REJOIN_MS)
          }
        })
      channelRef.current = channel
    }

    void fetchProjects()
    schedulePoll()
    joinRealtime()

    return () => {
      disposed = true
      if (pollTimer.current) clearTimeout(pollTimer.current)
      if (rejoinTimer.current) clearTimeout(rejoinTimer.current)
      if (channelRef.current) void supabase.removeChannel(channelRef.current)
    }
  }, [applySeatEvent, fetchProjects, schedulePoll, setMode])

  const retry = useCallback(() => {
    setError(false)
    setLoading(true)
    void fetchProjects()
  }, [fetchProjects])

  return { projects, loading, error, feedMode, retry }
}
