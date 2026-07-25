import { EmptyState, WidgetHeader } from '@/design/ui'
import { formatCents, formatCentsRounded } from '@/lib/format'
import { CATEGORY_TINT } from './categories'
import { perMonth, useMoneyData } from './useMoneyData'
import { moneyWidget } from './manifest'

export function MoneyCard() {
  const data = useMoneyData()

  if (data.loading) return <WidgetHeader widget={moneyWidget} />

  if (data.empty) {
    return (
      <>
        <WidgetHeader widget={moneyWidget} />
        <EmptyState
          widget={moneyWidget}
          emoji="💰"
          benefit="Importe ton relevé bancaire et vois enfin où part ton argent, mois après mois."
          cta="Importer un relevé"
          to="/argent"
        />
      </>
    )
  }

  const top = data.categories.slice(0, 5)
  const max = Math.max(...top.map((c) => c.cents), 1)
  const net = data.totalCredits - data.totalDebits

  return (
    <>
      <WidgetHeader
        widget={moneyWidget}
        moreLabel={`${data.months.toFixed(data.months < 10 ? 1 : 0)} mois →`}
      />

      <div>
        <div className="text-[28px] font-bold tabular-nums tracking-[-0.02em]">
          {formatCentsRounded(perMonth(data.totalDebits, data.months))}
          <span className="text-[13px] font-medium tracking-normal text-ink-3">
            {' '}
            dépensés / mois
          </span>
        </div>
        <div className="mt-1 text-[12.5px] text-ink-3">
          il te reste{' '}
          <b className={net >= 0 ? 'font-semibold text-money' : 'font-semibold text-danger'}>
            {formatCents(perMonth(net, data.months))}
          </b>{' '}
          par mois
        </div>
      </div>

      <div
        className="flex h-[74px] items-end gap-2.5 pt-1"
        role="img"
        aria-label="Principales catégories de dépenses"
      >
        {top.map((c) => (
          <div key={c.name} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span
              className="w-full max-w-[34px] rounded-t-md"
              style={{
                height: `${Math.max((c.cents / max) * 100, 6)}%`,
                background: CATEGORY_TINT[c.name] ?? 'var(--color-money)',
              }}
              title={`${c.name} : ${formatCentsRounded(perMonth(c.cents, data.months))}/mois`}
            />
            <span className="w-full truncate text-center text-[10px] uppercase tracking-[0.04em] text-ink-3">
              {c.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
