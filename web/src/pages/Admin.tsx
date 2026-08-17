import { useCallback, useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { GateScreen } from '../components/admin/GateScreen'
import { Toolbar } from '../components/admin/Toolbar'
import type { BusyAction } from '../components/admin/Toolbar'
import { StudentsTable } from '../components/admin/StudentsTable'
import { ProjectsSummary } from '../components/admin/ProjectsSummary'
import { Toasts } from '../components/admin/Toasts'
import { useAdminOverview } from '../hooks/useAdminOverview'
import { useToast } from '../hooks/useToast'
import { getAdminSecret, setAdminSecret, clearAdminSecret } from '../lib/adminSecret'
import { sendCode, sendAllPending, refreshStatuses, syncSheet } from '../lib/admin'
import type { AdminResult, SendResult } from '../lib/admin'

export function Admin() {
  const [secret, setSecret] = useState<string | null>(() => getAdminSecret())
  const [busy, setBusy] = useState<BusyAction>(null)
  const [sendingFor, setSendingFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { toasts, push, dismiss } = useToast()

  const mutating = busy !== null || sendingFor !== null
  const { overview, loading, unauthorized, reload } = useAdminOverview(secret, mutating)

  const logout = useCallback(() => {
    clearAdminSecret()
    setSecret(null)
  }, [])

  const unlock = useCallback((value: string) => {
    setAdminSecret(value)
    setSecret(value)
  }, [])

  const students = useMemo(() => {
    if (overview === null) return []
    const q = search.trim().toLowerCase()
    if (q === '') return overview.students
    return overview.students.filter(
      (s) => s.email.toLowerCase().includes(q) || (s.project ?? '').toLowerCase().includes(q),
    )
  }, [overview, search])

  if (secret === null || unauthorized) {
    // A rejected secret drops straight back to the gate with nothing rendered.
    if (unauthorized && secret !== null) clearAdminSecret()
    return (
      <Shell>
        <GateScreen onUnlock={unlock} />
      </Shell>
    )
  }

  const describeSend = (res: AdminResult<SendResult>, whoLabel: string): [string, 'ok' | 'bad'] => {
    const sent = res.data?.sent ?? 0
    const failed = res.data?.failed ?? []
    if (res.ok) return [`Code sent to ${whoLabel}.`, 'ok']
    if (res.error === 'not_found') return [`${whoLabel} isn't in the student list.`, 'bad']
    if (res.error === 'unauthorized') return ['Secret rejected — please unlock again.', 'bad']
    const quota = res.data?.quota_exceeded_likely === true
    const base = `Sent ${sent}, failed ${failed.length}${failed.length > 0 ? `: ${failed.map((f) => f.email).join(', ')}` : ''}.`
    return [quota ? `${base} This looks like the Resend daily cap — try the rest tomorrow.` : base, 'bad']
  }

  const runSendOne = async (email: string) => {
    if (mutating) return
    setSendingFor(email)
    const res = await sendCode(secret, email)
    const [message, tone] = describeSend(res, email)
    push(message, tone)
    setSendingFor(null)
    await reload()
  }

  const runSendAll = async () => {
    if (mutating || overview === null) return
    const pending = overview.students.filter((s) => s.delivery_status === 'none')
    if (pending.length === 0) return
    if (!window.confirm(`Send a fresh code to ${pending.length} student(s) with no code yet?`)) return
    setBusy('all_pending')
    const res = await sendAllPending(secret)
    const [message, tone] = describeSend(res, `${res.data?.sent ?? 0} student(s)`)
    push(res.ok ? `Codes sent to ${res.data?.sent ?? 0} student(s).` : message, tone)
    setBusy(null)
    await reload()
  }

  const runRefreshStatuses = async () => {
    if (mutating) return
    setBusy('refresh_status')
    const res = await refreshStatuses(secret)
    if (res.ok) {
      const changed = res.data.changes.length
      push(
        changed === 0
          ? `Checked ${res.data.checked} tracked email(s) — no changes yet.`
          : `Updated ${changed} student(s): ${res.data.changes.map((c) => `${c.email} → ${c.delivery_status}`).join(', ')}`,
      )
    } else {
      push("Couldn't refresh delivery statuses — try again in a moment.", 'bad')
    }
    setBusy(null)
    await reload()
  }

  const runSyncSheet = async () => {
    if (mutating) return
    setBusy('sync_sheet')
    const res = await syncSheet(secret)
    if (res.ok) {
      push(
        `Sheet synced — ${res.data.emails_in_sheet} email(s) in the sheet, ${res.data.total_registered} student(s) registered.`,
      )
    } else if (res.error === 'not_configured') {
      push('No sheet URL configured yet — set SHEET_CSV_URL in the Supabase secrets.', 'bad')
    } else {
      push("Couldn't read the sheet — check that it's still published to the web.", 'bad')
    }
    setBusy(null)
    await reload()
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-20 pt-8">
        <h1 className="mb-1 text-[26px] font-extrabold tracking-tight">Instructor dashboard</h1>
        <p className="mb-6 text-sm text-muted-text">
          Codes, delivery and bookings. Resending a code replaces the old one instantly.
        </p>

        {overview === null ? (
          <p className="py-16 text-center text-sm text-muted-text">
            {loading ? 'Loading…' : "Couldn't load the dashboard — try refreshing."}
          </p>
        ) : (
          <>
            <Toolbar
              overview={overview}
              busy={busy}
              search={search}
              onSearch={setSearch}
              onSendAllPending={() => void runSendAll()}
              onRefreshStatuses={() => void runRefreshStatuses()}
              onSyncSheet={() => void runSyncSheet()}
              onReload={() => {
                setBusy('reload')
                void reload().finally(() => setBusy(null))
              }}
              onLogout={logout}
            />

            <StudentsTable
              students={students}
              sendingFor={sendingFor}
              onSend={(email) => void runSendOne(email)}
            />

            <h2 className="mb-3.5 mt-8 text-lg font-bold tracking-tight">Projects</h2>
            <ProjectsSummary projects={overview.projects} />
          </>
        )}
      </div>
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  )
}
