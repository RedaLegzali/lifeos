import type { BriefItem, WidgetManifest } from '@/core/widgets/types'
import { IconBox } from '@/design/icons'
import { db } from '@/lib/db'
import { daysUntil, formatDayMonth } from '@/lib/dates'
import { formatCents } from '@/lib/format'
import { lazy } from 'react'
import { buildData, useSubscriptionsData } from './useSubscriptionsData'

const SubscriptionsCard = lazy(async () => ({
  default: (await import('./SubscriptionsCard')).SubscriptionsCard,
}))
const SubscriptionsPage = lazy(async () => ({
  default: (await import('./SubscriptionsPage')).SubscriptionsPage,
}))

export const subscriptionsWidget: WidgetManifest = {
  id: 'subscriptions',
  title: 'Abonnements',
  route: '/abonnements',
  tint: 'var(--color-subs)',
  icon: IconBox,
  span: 2,
  description: 'Tous tes abonnements : prix, renouvellements, alertes.',
  planned: [
    'Historique des prélèvements',
    'Alertes de non-usage (« pas utilisé depuis… »)',
    'Saisie libre hors bibliothèque',
  ],
  Card: SubscriptionsCard,
  Page: SubscriptionsPage,
  // Prélèvements des 7 prochains jours, affichés par le widget Semaine.
  useCalendarEvents: () => {
    const { subs } = useSubscriptionsData()
    return subs
      .filter((s) => daysUntil(s.nextBillingAt) <= 7)
      .map((s) => ({
        id: `billing-${s.id}`,
        label: `Prélèvement ${s.name}`,
        date: s.nextBillingAt,
        emoji: '💳',
        tint: 'var(--color-subs)',
      }))
  },
  useBriefItems: () => {
    const { subs, totalMonthlyCents } = useSubscriptionsData()
    if (subs.length === 0) return []
    const items: BriefItem[] = []

    const dueSoon = subs.find((s) => {
      const d = daysUntil(s.nextBillingAt)
      return d === 0 || d === 1
    })
    if (dueSoon) {
      const isToday = daysUntil(dueSoon.nextBillingAt) === 0
      items.push({
        id: 'brief-billing',
        emoji: '💳',
        text: (
          <>
            <b>{dueSoon.name}</b> débite <b>{formatCents(dueSoon.monthlyCents)}</b>{' '}
            {isToday ? "aujourd'hui" : 'demain'}
          </>
        ),
        when: formatDayMonth(dueSoon.nextBillingAt),
        priority: 2,
      })
    }
    items.push({
      id: 'brief-subs-total',
      emoji: '📦',
      text: (
        <>
          Tes abonnements coûtent <b>{formatCents(totalMonthlyCents)}/mois</b>
        </>
      ),
      priority: 6,
    })
    return items
  },
  getSearchItems: async () => {
    const { subs } = buildData(await db.subscriptions.toArray())
    return subs.map((s) => ({
      id: `sub-${s.id}`,
      group: 'Abonnements',
      emoji: '💳',
      title: s.name,
      meta: `${formatCents(s.monthlyCents)}/mois · ${
        daysUntil(s.nextBillingAt) === 1
          ? 'débite demain'
          : `le ${formatDayMonth(s.nextBillingAt)}`
      }`,
      route: '/abonnements',
      keywords: 'abonnement prix renouvellement',
    }))
  },
}
