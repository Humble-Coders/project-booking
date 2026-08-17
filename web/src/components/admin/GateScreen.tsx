import { useState } from 'react'
import type { FormEvent } from 'react'
import { fetchOverview } from '../../lib/admin'

interface Props {
  onUnlock: (secret: string) => void
}

export function GateScreen({ onUnlock }: Props) {
  const [secret, setSecret] = useState('')
  const [checking, setChecking] = useState(false)
  const [locked, setLocked] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (checking || secret.trim() === '') return
    setChecking(true)
    setLocked(false)
    const res = await fetchOverview(secret.trim())
    setChecking(false)
    if (res.ok) onUnlock(secret.trim())
    else setLocked(true)
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-20">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-[400px] rounded-card border border-line bg-card p-7"
      >
        <p className="mb-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand2">
          Instructor only
        </p>
        <h1 className="mb-1 text-[21px] font-bold tracking-tight">Admin dashboard</h1>
        <p className="mb-5 text-sm leading-relaxed text-muted-text">
          Enter the admin secret to unlock. It stays in this browser and is never part of the site.
        </p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret"
          autoComplete="off"
          aria-label="Admin secret"
          className="w-full rounded-[10px] border border-line bg-field px-4 py-3 text-[15px] text-text outline-none transition-colors placeholder:text-muted-text/50 focus:border-brand"
        />
        {locked && (
          <p className="mt-3 text-[13.5px] leading-relaxed text-bad">
            That secret didn't work. Nothing here will load without it. Check the value you were
            given and try again.
          </p>
        )}
        <button
          type="submit"
          disabled={checking || secret.trim() === ''}
          className="mt-4.5 w-full rounded-[10px] bg-brand py-3 text-[14.5px] font-semibold text-text transition-colors hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {checking ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
