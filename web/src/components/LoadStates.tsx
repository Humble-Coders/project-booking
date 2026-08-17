interface ErrorProps {
  onRetry: () => void
}

export function LoadingState() {
  return (
    <div className="px-5 py-[70px] text-center text-[15px] text-muted-text">
      <div className="mx-auto mb-3.5 h-[26px] w-[26px] animate-spin rounded-full border-[3px] border-muted border-t-brand2" />
      Loading projects…
    </div>
  )
}

export function ErrorState({ onRetry }: ErrorProps) {
  return (
    <div className="px-5 py-[70px] text-center text-[15px] text-muted-text">
      <p className="mb-4">
        Couldn't load the projects. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[10px] bg-brand px-6 py-2.5 text-[14.5px] font-semibold text-text transition-colors hover:bg-brand2"
      >
        Try again
      </button>
    </div>
  )
}
