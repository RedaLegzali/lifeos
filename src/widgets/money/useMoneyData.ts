import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Transaction } from '@/lib/db'
import { useSettings } from '@/core/settings/store'
import { classify } from './categories'
import { parseSGStatement } from './import/parseSG'
import { useOverrides, type CategoryOverrides } from './rules'

/** Clé composite déterministe : réimporter un relevé ne duplique rien. */
export function transactionId(t: {
  date: string
  label: string
  cents: number
  kind: string
  detail: string
}): string {
  return `${t.date}|${t.label}|${t.cents}|${t.kind}|${t.detail}`.slice(0, 400)
}

export interface ImportReport {
  fileName: string
  added: number
  duplicates: number
  /** Extraction vérifiée contre les totaux imprimés du relevé. */
  valid: boolean
  checks: number
}

/** Importe un relevé PDF et enregistre les opérations nouvelles. */
export async function importStatement(
  file: File,
  ownerName: string,
): Promise<ImportReport> {
  const { transactions, checks, valid } = await parseSGStatement(file)

  const rows: Transaction[] = transactions.map((t) => {
    const c = classify(t, ownerName)
    return {
      id: transactionId(t),
      date: t.date,
      label: t.label,
      detail: t.detail,
      cents: t.cents,
      kind: t.kind,
      merchant: c.merchant,
      category: c.category,
      excluded: c.excluded,
      source: file.name,
    }
  })

  const existing = new Set(
    (await db.transactions.bulkGet(rows.map((r) => r.id)))
      .filter(Boolean)
      .map((r) => r!.id),
  )
  const fresh = rows.filter((r) => !existing.has(r.id))
  if (fresh.length) await db.transactions.bulkPut(fresh)

  return {
    fileName: file.name,
    added: fresh.length,
    duplicates: rows.length - fresh.length,
    valid,
    checks: checks.length,
  }
}

export interface MerchantTotal {
  name: string
  cents: number
  count: number
}

export interface CategoryTotal {
  name: string
  cents: number
  count: number
  merchants: MerchantTotal[]
}

export interface MoneyData {
  loading: boolean
  /** Aucune opération importée : le module affiche son invitation. */
  empty: boolean
  months: number
  firstDate?: string
  lastDate?: string
  totalDebits: number
  totalCredits: number
  categories: CategoryTotal[]
  sources: string[]
  operations: number
}

/**
 * Durée réellement couverte par les données, en mois.
 *
 * Compter les mois calendaires distincts surestime : un relevé allant du
 * 10/01 au 09/02 « touche » janvier et février sans les couvrir. On somme
 * donc la FRACTION de chaque mois effectivement couverte, ce qui gère à la
 * fois les mois partiels aux extrémités et les relevés manquants au milieu.
 */
export function coveredMonths(dates: string[]): number {
  if (dates.length === 0) return 0
  const byMonth = new Map<string, { min: number; max: number }>()
  for (const d of dates) {
    const month = d.slice(0, 7)
    const day = Number(d.slice(8, 10))
    const cur = byMonth.get(month)
    if (!cur) byMonth.set(month, { min: day, max: day })
    else {
      cur.min = Math.min(cur.min, day)
      cur.max = Math.max(cur.max, day)
    }
  }
  let total = 0
  for (const [month, { min, max }] of byMonth) {
    const [y, m] = month.split('-').map(Number)
    const daysInMonth = new Date(y!, m!, 0).getDate()
    total += (max - min + 1) / daysInMonth
  }
  return total
}

/**
 * Diviseur des moyennes mensuelles, plancher à 1 mois : avec moins d'un
 * mois de données, on montre le total de la période plutôt que de
 * l'extrapoler. Mieux vaut sous-estimer que gonfler un chiffre d'argent.
 */
export function perMonth(cents: number, months: number): number {
  return cents / Math.max(months, 1)
}

export function buildMoneyData(
  all: Transaction[],
  overrides: CategoryOverrides = {},
): MoneyData {
  if (all.length === 0) {
    return {
      loading: false,
      empty: true,
      months: 0,
      totalDebits: 0,
      totalCredits: 0,
      categories: [],
      sources: [],
      operations: 0,
    }
  }

  const counted = all.filter((t) => !t.excluded)
  const debits = counted.filter((t) => t.kind === 'debit')
  const credits = counted.filter((t) => t.kind === 'credit')

  const months = coveredMonths(all.map((t) => t.date))

  const byCat = new Map<string, { cents: number; count: number; m: Map<string, MerchantTotal> }>()
  for (const t of debits) {
    // La règle de l'utilisateur prime toujours sur la détection automatique.
    const category = overrides[t.merchant] ?? t.category
    const c = byCat.get(category) ?? { cents: 0, count: 0, m: new Map() }
    c.cents += t.cents
    c.count++
    const mt = c.m.get(t.merchant) ?? { name: t.merchant, cents: 0, count: 0 }
    mt.cents += t.cents
    mt.count++
    c.m.set(t.merchant, mt)
    byCat.set(category, c)
  }

  const dates = all.map((t) => t.date).sort()

  return {
    loading: false,
    empty: false,
    months,
    firstDate: dates[0],
    lastDate: dates.at(-1),
    totalDebits: debits.reduce((s, t) => s + t.cents, 0),
    totalCredits: credits.reduce((s, t) => s + t.cents, 0),
    categories: [...byCat.entries()]
      .map(([name, c]) => ({
        name,
        cents: c.cents,
        count: c.count,
        merchants: [...c.m.values()].sort((a, b) => b.cents - a.cents),
      }))
      .sort((a, b) => b.cents - a.cents),
    sources: [...new Set(all.map((t) => t.source))].sort(),
    operations: all.length,
  }
}

export function useMoneyData(): MoneyData {
  const all = useLiveQuery(() => db.transactions.toArray(), [])
  const overrides = useOverrides()
  if (!all) {
    return {
      loading: true,
      empty: true,
      months: 0,
      totalDebits: 0,
      totalCredits: 0,
      categories: [],
      sources: [],
      operations: 0,
    }
  }
  return buildMoneyData(all, overrides)
}

/** Nom du titulaire, utilisé pour repérer les virements internes. */
export function useOwnerName(): string {
  return useSettings((s) => s.userName)
}

/** Retire toutes les opérations issues d'un fichier importé. */
export async function removeSource(source: string): Promise<number> {
  return db.transactions.where('source').equals(source).delete()
}
