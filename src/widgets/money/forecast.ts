import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Subscription, type Transaction } from '@/lib/db'
import { clusterAmounts, findRecurring } from '@/lib/recurrence'
import { addDays, daysUntil, nextBillingDate } from '@/lib/dates'

/**
 * Prévision de trésorerie des prochains jours.
 *
 * Aucune connexion bancaire : on projette ce que l'historique a déjà
 * montré. Un prélèvement vu au même jour, au même montant, trois mois
 * de suite, tombera très probablement le mois prochain aussi.
 *
 * Contrairement à la détection d'abonnements, la prévision inclut TOUT
 * ce qui sort régulièrement — loyer, assurances, virements réguliers —
 * puisque ces sommes partent du compte quelles que soient leurs
 * étiquettes. Elle inclut aussi les revenus réguliers.
 */

export interface UpcomingPayment {
  id: string
  label: string
  /** Toujours positif ; `kind` porte le sens. */
  cents: number
  kind: 'debit' | 'credit'
  date: Date
  daysAway: number
  /** Vu 4 mois ou plus : quasi certain. */
  confident: boolean
  /** Abonnement confirmé plutôt que simple régularité observée. */
  fromSubscription: boolean
}

export interface Forecast {
  payments: UpcomingPayment[]
  /** Total des sorties prévues sur la fenêtre. */
  debitCents: number
  /** Total des entrées prévues sur la fenêtre. */
  creditCents: number
  /** Entrées moins sorties sur la fenêtre. */
  netCents: number
  days: number
  /** Aucun historique importé : rien à prévoir. */
  empty: boolean
}

/** Ce qui ne se reproduit pas : mouvements internes et retraits ponctuels. */
const NOT_PREDICTABLE = /^(Transfert interne|Retrait espèces|Frais de change)/

/**
 * En dessous d'un euro, une « récurrence » est du bruit : quelques
 * centimes qui retombent par hasard le même jour trois mois de suite.
 */
const MIN_PREDICTABLE_CENTS = 100

function operationDay(t: Transaction): number {
  const m = /CARTE X\d+\s+(\d{2})\/(\d{2})/.exec(t.label)
  return m ? Number(m[1]) : Number(t.date.slice(8, 10))
}

/**
 * Projette les paiements récurrents sur `days` jours.
 * `subscriptions` prime : un abonnement confirmé par l'utilisateur est
 * plus fiable qu'une régularité déduite, et évite les doublons.
 */
export function buildForecast(
  transactions: Transaction[],
  subscriptions: Subscription[],
  days = 30,
  from: Date = new Date(),
): Forecast {
  if (transactions.length === 0 && subscriptions.length === 0) {
    return { payments: [], debitCents: 0, creditCents: 0, netCents: 0, days, empty: true }
  }

  const horizon = addDays(from, days)
  const payments: UpcomingPayment[] = []
  const claimed = new Set<string>()

  // 1. Abonnements confirmés : la source la plus fiable.
  for (const s of subscriptions) {
    const monthly = s.cycle === 'annual' ? Math.round(s.priceCents / 12) : s.priceCents
    const date = nextBillingDate(s.billingDay, from)
    claimed.add(s.name.toLowerCase())
    if (date > horizon) continue
    payments.push({
      id: `sub-${s.id}`,
      label: s.name,
      cents: s.cycle === 'annual' ? s.priceCents : monthly,
      kind: 'debit',
      date,
      daysAway: daysUntil(date, from),
      confident: true,
      fromSubscription: true,
    })
  }

  // 2. Régularités observées dans l'historique, non déjà couvertes.
  //
  // Tolérance de ±5 % sur le montant : un loyer de 600, 620 puis 630 €
  // reste le même loyer, et un salaire varie d'un mois à l'autre. La
  // détection d'abonnements, elle, reste stricte — un abonnement dont le
  // prix bouge n'en est pas un.
  const candidates = transactions.filter(
    (t) => !t.excluded && !NOT_PREDICTABLE.test(t.merchant),
  )
  const clusters = clusterAmounts(
    candidates.map((t) => t.cents),
    0.05,
  )

  for (const g of findRecurring(
    candidates.map((t, i) => ({ t, cluster: clusters[i]! })),
    {
      key: ({ t, cluster }) => `${t.kind}|${t.merchant}|${cluster}`,
      date: ({ t }) => t.date,
      day: ({ t }) => operationDay(t),
      // Un loyer de fin de mois peut glisser au 1er ou 2 du mois suivant :
      // ce mois-là en compte deux, sans que ce soit deux loyers.
      maxPerMonth: 1.4,
    },
  )) {
    const first = g.items[0]!.t
    if (claimed.has(first.merchant.toLowerCase())) continue
    const date = nextBillingDate(g.day, from)
    if (date > horizon) continue
    // Montant médian : plus représentatif qu'une occurrence isolée.
    const amounts = g.items.map(({ t }) => t.cents).sort((a, b) => a - b)
    const cents = amounts[Math.floor(amounts.length / 2)]!
    if (cents < MIN_PREDICTABLE_CENTS) continue
    payments.push({
      id: `rec-${g.key}`,
      label: first.merchant,
      cents,
      kind: first.kind,
      date,
      daysAway: daysUntil(date, from),
      confident: g.months >= 4,
      fromSubscription: false,
    })
  }

  payments.sort((a, b) => a.date.getTime() - b.date.getTime())

  const debitCents = payments
    .filter((p) => p.kind === 'debit')
    .reduce((s, p) => s + p.cents, 0)
  const creditCents = payments
    .filter((p) => p.kind === 'credit')
    .reduce((s, p) => s + p.cents, 0)

  return {
    payments,
    debitCents,
    creditCents,
    netCents: creditCents - debitCents,
    days,
    empty: payments.length === 0,
  }
}

export function useForecast(days = 30): Forecast {
  const state = useLiveQuery(async () => {
    const [transactions, subscriptions] = await Promise.all([
      db.transactions.toArray(),
      db.subscriptions.toArray(),
    ])
    return buildForecast(transactions, subscriptions, days)
  }, [days])

  return (
    state ?? { payments: [], debitCents: 0, creditCents: 0, netCents: 0, days, empty: true }
  )
}
