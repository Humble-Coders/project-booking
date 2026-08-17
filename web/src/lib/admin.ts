// Typed client for the `admin` edge function (ticket #2). The dashboard holds
// no privileged logic: every action is one POST with the x-admin-secret header,
// and the function is the bouncer.

const BASE = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/admin`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export type DeliveryStatus = 'none' | 'sent' | 'delivered' | 'bounced' | 'failed'

export interface StudentRow {
  email: string
  code_sent_at: string | null
  delivery_status: DeliveryStatus
  project_id: number | null
  project: string | null
}

export interface ProjectRow {
  id: number
  title: string
  capacity: number
  booked: string[]
}

export interface Overview {
  students: StudentRow[]
  projects: ProjectRow[]
  totals: { students: number; booked: number; unbooked: number; delivered: number }
}

export interface SendFailure {
  email: string
  ok: boolean
  error?: string
  quota_hint?: boolean
}

export interface SendResult {
  sent: number
  failed: SendFailure[]
  quota_exceeded_likely: boolean
}

export interface RefreshResult {
  checked: number
  changes: Array<{ email: string; delivery_status: DeliveryStatus }>
}

export interface SheetResult {
  emails_in_sheet: number
  total_registered: number
}

/** Every call resolves to one of these — `unauthorized` sends the UI back to the gate. */
export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: 'unauthorized' | 'not_found' | 'resend_failed' | 'sheet_failed' | 'not_configured' | 'network'; data?: T }

interface RawResponse {
  ok?: boolean
  error?: string
  [key: string]: unknown
}

async function call<T>(secret: string, body: Record<string, unknown>): Promise<AdminResult<T>> {
  let res: Response
  try {
    res = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON}`,
        'x-admin-secret': secret,
      },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, error: 'network' }
  }

  if (res.status === 401) return { ok: false, error: 'unauthorized' }

  let json: RawResponse
  try {
    json = (await res.json()) as RawResponse
  } catch {
    return { ok: false, error: 'network' }
  }

  if (json.ok === true) return { ok: true, data: json as unknown as T }

  const known = ['not_found', 'resend_failed', 'sheet_failed', 'not_configured', 'unauthorized'] as const
  const match = known.find((k) => k === json.error)
  // send_code reports partial success with error: resend_failed — keep the payload.
  return { ok: false, error: match ?? 'network', data: json as unknown as T }
}

export const fetchOverview = (secret: string) => call<Overview>(secret, { action: 'overview' })

export const sendCode = (secret: string, email: string) =>
  call<SendResult>(secret, { action: 'send_code', email })

export const sendAllPending = (secret: string) =>
  call<SendResult>(secret, { action: 'send_code', all_pending: true })

export const refreshStatuses = (secret: string) =>
  call<RefreshResult>(secret, { action: 'refresh_status' })

export const syncSheet = (secret: string) => call<SheetResult>(secret, { action: 'sync_sheet' })
