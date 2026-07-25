import type { Subscription, Transaction } from '@/lib/db'
import { findRecurring } from '@/lib/recurrence'
import { serviceCatalog } from './catalog'

/**
 * Détection des abonnements dans les opérations bancaires importées.
 *
 * Un abonnement, contrairement à un achat répété, a trois signatures :
 *   1. le montant est EXACTEMENT identique d'un mois à l'autre,
 *   2. il tombe autour du même jour du mois,
 *   3. il apparaît une fois par mois, pas dix.
 *
 * Ces trois critères ensemble écartent les faux positifs — sans eux,
 * 170 commandes de livraison produisent des coïncidences de montants
 * qui ressemblent à des abonnements.
 *
 * Robuste aux relevés manquants : on compte les MOIS DISTINCTS plutôt
 * que les intervalles, donc un trou d'un mois ne casse pas la détection.
 */

export interface DetectedSubscription {
  /** Clé stable : permet d'ignorer une suggestion durablement. */
  key: string
  merchant: string
  cents: number
  /** Nombre de mois distincts où l'opération apparaît. */
  months: number
  /** Jour du mois médian. */
  day: number
  lastSeen: string
  /** Vu sur 4 mois ou plus : quasi certain. */
  confident: boolean
  /** Service reconnu dans la bibliothèque, pour le logo et la catégorie. */
  catalogId?: string
}

/** Marchands qui ne peuvent pas être des abonnements. */
const NEVER = /^(Transfert interne|Retrait espèces|Virement · |Frais de change|Paris sportifs)/

/**
 * Jour réel de l'opération : les libellés carte portent « CARTE X4069 17/06 »,
 * la date de valeur bancaire pouvant être décalée de plusieurs jours.
 */
export function operationDay(t: Transaction): number {
  const m = /CARTE X\d+\s+(\d{2})\/(\d{2})/.exec(t.label)
  return m ? Number(m[1]) : Number(t.date.slice(8, 10))
}

function matchCatalog(merchant: string): string | undefined {
  const m = merchant.toLowerCase()
  return serviceCatalog.find(
    (s) => s.name.toLowerCase() === m || m.includes(s.name.toLowerCase()),
  )?.id
}

export function detectSubscriptions(transactions: Transaction[]): DetectedSubscription[] {
  // Un abonnement est une dépense à un COMMERÇANT : les virements à des
  // personnes et les retraits sont écartés, même s'ils sont réguliers.
  // Ils restent pris en compte par la prévision de trésorerie.
  const candidates = transactions.filter(
    (t) => t.kind === 'debit' && !t.excluded && !NEVER.test(t.merchant),
  )

  return findRecurring(candidates, {
    key: (t) => `${t.merchant}|${t.cents}`, // montant exactement identique
    date: (t) => t.date,
    day: operationDay,
  })
    .map((g) => ({
      key: g.key,
      merchant: g.items[0]!.merchant,
      cents: g.items[0]!.cents,
      months: g.months,
      day: g.day,
      lastSeen: g.lastDate,
      confident: g.months >= 4,
      catalogId: matchCatalog(g.items[0]!.merchant),
    }))
    .sort((a, b) => b.cents - a.cents)
}

/** Convertit une détection confirmée en abonnement enregistrable. */
export function toSubscription(d: DetectedSubscription): Subscription {
  const service = d.catalogId
    ? serviceCatalog.find((s) => s.id === d.catalogId)
    : undefined

  return {
    id: crypto.randomUUID(),
    serviceId: service?.id,
    name: service?.name ?? d.merchant,
    initial: service?.initial ?? initialsOf(d.merchant),
    brandColor: service?.brandColor ?? '#5d6275',
    brandInk: service?.brandInk ?? '#edeff7',
    priceCents: d.cents,
    cycle: 'monthly',
    billingDay: d.day,
    category: service?.category ?? 'Autre',
  }
}

function initialsOf(name: string): string {
  const words = name.split(/[\s·]+/).filter(Boolean)
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/**
 * Écarte les détections correspondant à un abonnement déjà enregistré,
 * pour ne jamais proposer deux fois la même chose.
 */
export function filterAlreadyAdded(
  detected: DetectedSubscription[],
  existing: Subscription[],
  ignored: string[] = [],
): DetectedSubscription[] {
  const names = new Set(existing.map((s) => s.name.toLowerCase()))
  const serviceIds = new Set(existing.flatMap((s) => (s.serviceId ? [s.serviceId] : [])))
  const skipped = new Set(ignored)
  return detected.filter(
    (d) =>
      !skipped.has(d.key) &&
      !names.has(d.merchant.toLowerCase()) &&
      !(d.catalogId && serviceIds.has(d.catalogId)),
  )
}
