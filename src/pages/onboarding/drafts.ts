import type { Person, Subscription } from '@/lib/db'
import type { CatalogService } from '@/widgets/subscriptions/catalog'

/** Brouillons manipulés par l'assistant avant l'enregistrement final. */

export type PersonDraft = Person

export interface SubscriptionDraft extends Subscription {
  /** Saisie brute du prix (« 13,49 ») — convertie en centimes à la fin. */
  priceInput: string
}

export function draftFromService(s: CatalogService): SubscriptionDraft {
  return {
    id: crypto.randomUUID(),
    serviceId: s.id,
    name: s.name,
    initial: s.initial,
    brandColor: s.brandColor,
    brandInk: s.brandInk,
    priceCents: s.defaultPriceCents,
    priceInput: (s.defaultPriceCents / 100).toFixed(2).replace('.', ','),
    cycle: 'monthly',
    billingDay: new Date().getDate(),
    category: s.category,
  }
}

/** « 13,49 » ou « 13.49 » → 1349 centimes (null si invalide). */
export function parsePriceInput(input: string): number | null {
  const n = Number.parseFloat(input.trim().replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

/** Noms de mois français (« janvier » … « décembre »). */
export const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2000, i, 1)),
)
