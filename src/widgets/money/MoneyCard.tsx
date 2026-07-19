import { EmptyState, WidgetHeader } from '@/design/ui'
import { moneyWidget } from './manifest'

/**
 * Le module Argent n'existe pas encore : la carte est une invitation,
 * jamais une fausse donnée. Elle prendra vie avec l'import CSV.
 */
export function MoneyCard() {
  return (
    <>
      <WidgetHeader widget={moneyWidget} moreLabel="Programme →" />
      <EmptyState
        widget={moneyWidget}
        emoji="💰"
        benefit="Importe ton relevé bancaire et vois enfin où part ton argent, mois après mois."
        cta="Voir ce qui arrive"
        to="/argent"
      />
    </>
  )
}
