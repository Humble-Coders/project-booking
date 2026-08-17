import { supabase } from './supabase'

// Booking-code alphabet per PRD §4: A–Z + 2–9, excluding O/I (0/1 lookalikes).
export const CODE_LENGTH = 6
const CODE_CHARS = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g

/** Uppercase and strip everything outside the code alphabet. */
export function sanitizeCode(raw: string): string {
  return raw.toUpperCase().replace(CODE_CHARS, '').slice(0, CODE_LENGTH)
}

/** The fixed book_project error contract (CLAUDE.md) + client-side network. */
export type BookErrorCode = 'invalid_code' | 'already_booked' | 'full' | 'no_project' | 'network'

export type BookResult =
  | { ok: true; email: string; project: string }
  | { ok: false; error: BookErrorCode; project?: string }

interface RpcBookRow {
  ok: boolean
  email?: string
  project?: string
  error?: string
}

const CONTRACT: ReadonlySet<string> = new Set(['invalid_code', 'already_booked', 'full', 'no_project'])

export async function bookProject(code: string, projectId: number): Promise<BookResult> {
  const { data, error } = await supabase.rpc('book_project', {
    p_code: code,
    p_project_id: projectId,
  })
  if (error || data === null || typeof data !== 'object') {
    return { ok: false, error: 'network' }
  }
  const row = data as RpcBookRow
  if (row.ok && row.email && row.project) {
    return { ok: true, email: row.email, project: row.project }
  }
  if (row.error && CONTRACT.has(row.error)) {
    return { ok: false, error: row.error as BookErrorCode, project: row.project }
  }
  return { ok: false, error: 'network' }
}
