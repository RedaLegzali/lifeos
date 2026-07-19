import { EmptyState, WidgetHeader } from '@/design/ui'
import { gamingWidget } from './manifest'

/**
 * Le module Gaming n'existe pas encore : la carte est une invitation,
 * jamais une fausse donnée. Elle prendra vie avec la bibliothèque.
 */
export function GamingCard() {
  return (
    <>
      <WidgetHeader widget={gamingWidget} moreLabel="Programme →" />
      <EmptyState
        widget={gamingWidget}
        emoji="🎮"
        benefit="Ta bibliothèque, ta wishlist et les promos de tes jeux — au même endroit."
        cta="Voir ce qui arrive"
        to="/gaming"
      />
    </>
  )
}
