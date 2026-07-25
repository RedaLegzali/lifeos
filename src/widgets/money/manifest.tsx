import { lazy } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { BriefItem, WidgetManifest } from '@/core/widgets/types'
import { IconWallet } from '@/design/icons'
import { db } from '@/lib/db'
import { formatCentsRounded } from '@/lib/format'
import { buildMoneyData, perMonth } from './useMoneyData'
import { loadOverrides, useOverrides } from './rules'
import { useForecast } from './forecast'

const MoneyCard = lazy(async () => ({ default: (await import('./MoneyCard')).MoneyCard }))
const MoneyPage = lazy(async () => ({ default: (await import('./MoneyPage')).MoneyPage }))

export const moneyWidget: WidgetManifest = {
  id: 'money',
  title: 'Argent',
  route: '/argent',
  tint: 'var(--color-money)',
  icon: IconWallet,
  span: 3,
  description: 'Dépenses, catégories et budgets — depuis tes relevés bancaires.',
  planned: [
    'Détection automatique des abonnements depuis les relevés',
    'Prévision des prélèvements des 30 prochains jours',
    'Règles de catégorisation modifiables',
    "Budgets mensuels et objectifs d'épargne",
  ],
  Card: MoneyCard,
  Page: MoneyPage,
  // Les prélèvements prévus apparaissent dans le widget Semaine, sans
  // que celui-ci ait à connaître le module Argent.
  useCalendarEvents: () => {
    const forecast = useForecast(14)
    return forecast.payments
      .filter((p) => p.kind === 'debit')
      .map((p) => ({
        id: `forecast-${p.id}`,
        // « Virement · Untel » se suffit à lui-même ; les autres libellés
        // gagnent à être annoncés comme des prélèvements.
        label: p.label.startsWith('Virement') ? p.label : `Prélèvement ${p.label}`,
        date: p.date,
        emoji: '💳',
        tint: 'var(--color-money)',
      }))
  },
  useBriefItems: () => {
    const all = useLiveQuery(() => db.transactions.toArray(), [])
    const overrides = useOverrides()
    const forecast = useForecast(7)
    const items: BriefItem[] = []

    // Ce qui va sortir cette semaine : l'information la plus actionnable.
    if (forecast.debitCents > 0) {
      const count = forecast.payments.filter((p) => p.kind === 'debit').length
      items.push({
        id: 'brief-forecast',
        emoji: '📅',
        text: (
          <>
            <b>{formatCentsRounded(forecast.debitCents)}</b> de prélèvements attendus cette
            semaine
          </>
        ),
        when: `${count} à venir`,
        priority: 3,
      })
    }

    if (!all || all.length === 0) return items
    const data = buildMoneyData(all, overrides)

    const top = data.categories[0]
    if (top) {
      items.push({
        id: 'brief-money-top',
        emoji: '💰',
        text: (
          <>
            <b>{top.name}</b> est ton premier poste :{' '}
            <b>{formatCentsRounded(perMonth(top.cents, data.months))}/mois</b>
          </>
        ),
        priority: 5,
      })
    }
    return items
  },
  getSearchItems: async () => {
    const all = await db.transactions.toArray()
    if (all.length === 0) return []
    const data = buildMoneyData(all, await loadOverrides())
    return data.categories.slice(0, 10).map((c) => ({
      id: `money-cat-${c.name}`,
      group: 'Argent',
      emoji: '💰',
      title: c.name,
      meta: `${formatCentsRounded(perMonth(c.cents, data.months))}/mois · ${c.count} op.`,
      route: '/argent',
      keywords: `dépense catégorie ${c.merchants.slice(0, 5).map((m) => m.name).join(' ')}`,
    }))
  },
}
