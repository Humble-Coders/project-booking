import type { DeliveryStatus } from '../../lib/admin'

const STYLES: Record<DeliveryStatus, string> = {
  none: 'border-line bg-muted text-muted-text',
  sent: 'border-brand/40 bg-brand/15 text-brand2',
  delivered: 'border-ok/30 bg-ok/12 text-ok',
  bounced: 'border-bad/30 bg-bad/12 text-bad',
  failed: 'border-bad/30 bg-bad/12 text-bad',
}

const LABELS: Record<DeliveryStatus, string> = {
  none: 'No code yet',
  sent: 'Sent',
  delivered: 'Delivered',
  bounced: 'Bounced',
  failed: 'Failed',
}

export function StatusChip({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
