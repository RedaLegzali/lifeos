import { EmptyState, WidgetHeader } from '@/design/ui'
import { daysUntil, formatDayMonth } from '@/lib/dates'
import { formatCents, formatCentsRounded } from '@/lib/format'
import { subscriptionsWidget } from './manifest'
import { useSubscriptionsData, type SubscriptionView } from './useSubscriptionsData'

function billingLabel(s: SubscriptionView): string {
  const d = daysUntil(s.nextBillingAt)
  if (d === 0) return "débite aujourd'hui"
  if (d === 1) return 'débite demain'
  return `le ${formatDayMonth(s.nextBillingAt)}`
}

export function SubscriptionsCard() {
  const { subs, totalMonthlyCents } = useSubscriptionsData()
  const shown = subs.slice(0, 4)
  const others = subs.length - shown.length

  return (
    <>
      <WidgetHeader
        widget={subscriptionsWidget}
        moreLabel={subs.length > 0 ? `${subs.length} →` : 'Ouvrir →'}
      />

      {subs.length === 0 ? (
        <EmptyState
          widget={subscriptionsWidget}
          emoji="💳"
          benefit="Sache exactement ce que tu paies chaque mois — et sois prévenu avant chaque prélèvement."
          cta="Ajouter mes abonnements"
          to="/abonnements"
        />
      ) : (
        <>
          <div className="text-[28px] font-bold tracking-[-0.02em] tabular-nums">
            {formatCents(totalMonthlyCents)}{' '}
            <span className="text-[13px] font-medium tracking-normal text-ink-3">
              /mois · {formatCentsRounded(totalMonthlyCents * 12)}/an
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            {shown.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-[11px] rounded-[10px] px-2 py-[7px] text-[13.5px] transition-colors hover:bg-white/[0.035]"
              >
                <span
                  className="grid size-[26px] flex-none place-items-center rounded-lg text-[10px] font-bold"
                  style={{ background: s.brandColor, color: s.brandInk }}
                >
                  {s.initial}
                </span>
                <span className="min-w-0">
                  <span className="font-medium">{s.name}</span>
                  <br />
                  <span className="text-[11.5px] text-ink-3">{billingLabel(s)}</span>
                </span>
                <span className="ml-auto text-[13px] font-semibold tabular-nums">
                  {formatCents(s.monthlyCents)}
                </span>
              </div>
            ))}
          </div>

          {others > 0 && (
            <span className="text-xs text-ink-3">+ {others} autres abonnements</span>
          )}
        </>
      )}
    </>
  )
}
