import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Project, SeatCountRow, SeatFeedMode, SettingsRow } from '../lib/types'

// Polling cadence (PRD §6): lazy safety net while realtime is healthy; tight
// with jitter when it isn't (free plan caps realtime at 200 connections, // rejected clients must degrade silently, not stampede in sync).
const POLL_REALTIME_OK_MS = 45_000
const POLL_FALLBACK_MS = 15_000
const FALLBACK_JITTER_MS = 6_000
const REJOIN_MS = 30_000

interface ProjectsState {
  projects: Project[]
  loading: boolean
  /** True only when we have nothing at all to show (initial load failed). */
  error: boolean
  /**
   * The instructor's gate. Display only, `book_project` checks the same row
   * server-side on every attempt, so a student who forces the button on gets
   * `not_open` from the database rather than a seat.
   */
  bookingOpen: boolean
  /** Exposed for diagnostics/tests; the UI never surfaces this to students. */
  feedMode: SeatFeedMode
  retry: () => void
  /** Force-sync counts now (e.g. right after a booking attempt). */
  refresh: () => void
}

export function useProjects(): ProjectsState {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
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

  const fetchState = useCallback(async () => {
    const [catalogue, gate] = await Promise.all([
      supabase.rpc('get_projects'),
      supabase.from('settings').select('booking_open').eq('id', 1).maybeSingle(),
    ])

    // The gate is its own story: a failed read keeps the last known state
    // rather than flipping the whole page shut on one bad request.
    if (!gate.error && gate.data) setBookingOpen(gate.data.booking_open === true)

    if (catalogue.error || !Array.isArray(catalogue.data)) {
      // Keep showing the last known data; only the initial load may error the UI.
      if (!hasDataRef.current) setError(true)
      return
    }
    hasDataRef.current = true
    setError(false)
    setProjects(catalogue.data as Project[])
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
      void fetchState().finally(schedulePoll)
    }, delay)
  }, [fetchState])

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
        // Same socket, second listener: the instructor opening booking reaches
        // every waiting browser in about a second, so nobody gets a head start
        // just because their poll happened to land first.
        .on<SettingsRow>(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          (payload) => {
            if ('booking_open' in payload.new) setBookingOpen(payload.new.booking_open === true)
          },
        )
        .subscribe((status) => {
          // A replaced channel fires CLOSED on removal, only the current
          // channel may drive mode changes and rejoin scheduling.
          if (disposed || channelRef.current !== channel) return
          if (status === 'SUBSCRIBED') {
            if (rejoinTimer.current) clearTimeout(rejoinTimer.current)
            setMode('realtime')
            // Counts and the gate may have moved while we were off the socket.
            void fetchState()
            schedulePoll()
          } else {
            // CHANNEL_ERROR, TIMED_OUT, CLOSED, too_many_connections, all the
            // same story: tighten polling, quietly retry the join later.
            setMode('polling')
            schedulePoll()
            if (rejoinTimer.current) clearTimeout(rejoinTimer.current)
            rejoinTimer.current = setTimeout(joinRealtime, REJOIN_MS)
          }
        })
      channelRef.current = channel
    }

    void fetchState()
    schedulePoll()
    joinRealtime()

    return () => {
      disposed = true
      if (pollTimer.current) clearTimeout(pollTimer.current)
      if (rejoinTimer.current) clearTimeout(rejoinTimer.current)
      if (channelRef.current) void supabase.removeChannel(channelRef.current)
    }
  }, [applySeatEvent, fetchState, schedulePoll, setMode])

  const retry = useCallback(() => {
    setError(false)
    setLoading(true)
    void fetchState()
  }, [fetchState])

  const refresh = useCallback(() => {
    void fetchState()
  }, [fetchState])

  return { projects, loading, error, bookingOpen, feedMode, retry, refresh }
}
