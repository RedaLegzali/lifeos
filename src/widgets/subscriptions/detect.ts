import type { Subscription, Transaction } from '@/lib/db'
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

function stdDev(xs: number[]): number {
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length
  return Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length)
}

function matchCatalog(merchant: string): string | undefined {
  const m = merchant.toLowerCase()
  return serviceCatalog.find(
    (s) => s.name.toLowerCase() === m || m.includes(s.name.toLowerCase()),
  )?.id
}

export function detectSubscriptions(transactions: Transaction[]): DetectedSubscription[] {
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    if (t.kind !== 'debit' || t.excluded) continue
    if (NEVER.test(t.merchant)) continue
    const key = `${t.merchant}|${t.cents}` // montant exactement identique
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }

  const found: DetectedSubscription[] = []
  for (const [key, items] of groups) {
    const months = new Set(items.map((t) => t.date.slice(0, 7)))
    if (months.size < 3) continue
    // Environ une fois par mois : écarte les achats répétés.
    if (items.length > months.size * 1.2) continue

    const days = items.map(operationDay)
    if (stdDev(days) > 4) continue

    const sorted = [...days].sort((a, b) => a - b)
    const dates = items.map((t) => t.date).sort()
    found.push({
      key,
      merchant: items[0]!.merchant,
      cents: items[0]!.cents,
      months: months.size,
      day: sorted[Math.floor(sorted.length / 2)]!,
      lastSeen: dates.at(-1)!,
      confident: months.size >= 4,
      catalogId: matchCatalog(items[0]!.merchant),
    })
  }

  return found.sort((a, b) => b.cents - a.cents)
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
