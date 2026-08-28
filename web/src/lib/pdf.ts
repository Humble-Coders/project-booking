
const BASE = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/project-pdf`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * The student proves who they are with their booking code, exactly as at booking
 * time. The server checks the bookings table and only then hands back a short
 * lived signed URL. The browser never learns the file path of a project the
 * student did not book.
 */
export type PdfError = 'invalid_code' | 'not_booked' | 'wrong_project' | 'no_file' | 'network'

export type PdfResult =
  | { ok: true; url: string; project: string }
  | { ok: false; error: PdfError; project?: string }

interface RawPdfResponse {
  ok?: boolean
  url?: string
  project?: string
  error?: string
}

const KNOWN: ReadonlySet<string> = new Set(['invalid_code', 'not_booked', 'wrong_project', 'no_file'])

export async function requestProjectPdf(code: string, projectId: number): Promise<PdfResult> {
  let res: Response
  try {
    res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ code, project_id: projectId }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }

  let json: RawPdfResponse
  try {
    json = (await res.json()) as RawPdfResponse
  } catch {
    return { ok: false, error: 'network' }
  }

  if (json.ok === true && json.url) {
    return { ok: true, url: json.url, project: json.project ?? '' }
  }
  const match = [...KNOWN].find((k) => k === json.error)
  return { ok: false, error: (match as PdfError) ?? 'network', project: json.project }
}

