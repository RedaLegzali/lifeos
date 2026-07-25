import { lazy } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { BriefItem, WidgetManifest } from '@/core/widgets/types'
import { IconWallet } from '@/design/icons'
import { db } from '@/lib/db'
import { formatCentsRounded } from '@/lib/format'
import { buildMoneyData, perMonth } from './useMoneyData'
import { loadOverrides, useOverrides } from './rules'

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
  useBriefItems: () => {
    const all = useLiveQuery(() => db.transactions.toArray(), [])
    const overrides = useOverrides()
    if (!all || all.length === 0) return []
    const data = buildMoneyData(all, overrides)
    const items: BriefItem[] = []

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
