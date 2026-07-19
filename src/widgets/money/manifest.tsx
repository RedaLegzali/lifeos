import { lazy } from 'react'
import type { WidgetManifest } from '@/core/widgets/types'
import { IconWallet } from '@/design/icons'

const MoneyCard = lazy(async () => ({ default: (await import('./MoneyCard')).MoneyCard }))

export const moneyWidget: WidgetManifest = {
  id: 'money',
  title: 'Argent',
  route: '/argent',
  tint: 'var(--color-money)',
  icon: IconWallet,
  span: 3,
  description: 'Dépenses, catégories, budgets et objectifs — via import CSV.',
  planned: [
    'Import CSV des relevés bancaires (aucune connexion bancaire en V1)',
    'Catégorisation des dépenses avec règles personnalisables',
    "Budgets mensuels et objectifs d'épargne",
    "Graphiques d'évolution",
  ],
  Card: MoneyCard,
}
