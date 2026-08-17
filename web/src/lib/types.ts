// Shapes returned by the public RPC surface (ticket #1 schema).

export interface Project {
  id: number
  title: string
  description: string
  api_name: string
  api_url: string
  api_note: string
  capacity: number
  seats_left: number
}

export interface SeatCountRow {
  project_id: number
  booked: number
}

/** The booking gate, flipped by the instructor. Realtime feed, same as seats. */
export interface SettingsRow {
  id: number
  booking_open: boolean
}

/** How seat data is currently reaching the client. */
export type SeatFeedMode = 'realtime' | 'polling'
