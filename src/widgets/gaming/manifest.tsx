import { lazy } from 'react'
import type { WidgetManifest } from '@/core/widgets/types'
import { IconGamepad } from '@/design/icons'

const GamingCard = lazy(async () => ({
  default: (await import('./GamingCard')).GamingCard,
}))

export const gamingWidget: WidgetManifest = {
  id: 'gaming',
  title: 'Gaming',
  route: '/gaming',
  tint: 'var(--color-game)',
  icon: IconGamepad,
  span: 2,
  description: 'Jeux joués, wishlist, backlog, promotions et sorties.',
  planned: [
    'Bibliothèque et backlog saisis manuellement (V1)',
    'Wishlist avec suivi des promotions',
    'Calendrier des sorties',
    'Statistiques de temps de jeu',
    'Plus tard : intégrations Steam, PlayStation, Epic, Discord',
  ],
  Card: GamingCard,
}
