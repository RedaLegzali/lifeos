import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Subscription } from '@/lib/db'
import { nextBillingDate } from '@/lib/dates'

/** Vue normalisée d'un abonnement pour l'affichage. */
export interface SubscriptionView {
  id: string
  serviceId?: string
  name: string
  initial: string
  brandColor: string
  brandInk: string
  cycle: 'monthly' | 'annual'
  priceCents: number
  billingDay: number
  /** Équivalent mensuel en centimes (annuel ÷ 12). */
  monthlyCents: number
  nextBillingAt: Date
}

export interface SubscriptionsData {
  /** Abonnements triés par prochain prélèvement. */
  subs: SubscriptionView[]
  totalMonthlyCents: number
}

export function toView(s: Subscription): SubscriptionView {
  return {
    id: s.id,
    serviceId: s.serviceId,
    name: s.name,
    initial: s.initial,
    brandColor: s.brandColor,
    brandInk: s.brandInk,
    cycle: s.cycle,
    priceCents: s.priceCents,
    billingDay: s.billingDay,
    monthlyCents: s.cycle === 'annual' ? Math.round(s.priceCents / 12) : s.priceCents,
    nextBillingAt: nextBillingDate(s.billingDay),
  }
}

export function buildData(stored: Subscription[]): SubscriptionsData {
  const subs = stored
    .map(toView)
    .sort((a, b) => a.nextBillingAt.getTime() - b.nextBillingAt.getTime())
  return {
    subs,
    totalMonthlyCents: subs.reduce((sum, s) => sum + s.monthlyCents, 0),
  }
}

/** Abonnements réels (réactif). Aucune donnée fictive : vide = vide. */
export function useSubscriptionsData(): SubscriptionsData {
  const stored = useLiveQuery(() => db.subscriptions.toArray(), [])
  return buildData(stored ?? [])
}
