/**
 * Détection générique de paiements récurrents.
 *
 * Un paiement récurrent se reconnaît à trois signatures SIMULTANÉES :
 *   1. le montant est exactement identique d'une fois à l'autre,
 *   2. il tombe autour du même jour du mois,
 *   3. il apparaît une seule fois par mois.
 *
 * Les trois sont nécessaires : sans la troisième, un commerçant fréquenté
 * quotidiennement produit des coïncidences de montants qui ressemblent à
 * des abonnements.
 *
 * On compte les MOIS DISTINCTS plutôt que les intervalles entre dates :
 * un relevé manquant au milieu de l'historique ne casse donc pas la
 * détection, là où un calcul d'intervalle verrait un écart de 60 jours.
 *
 * Ce module est neutre : les abonnements et les prévisions de trésorerie
 * l'utilisent avec des filtres différents.
 */

export interface RecurringGroup<T> {
  /** Clé de regroupement, stable entre deux exécutions. */
  key: string
  items: T[]
  /** Nombre de mois distincts où le paiement apparaît. */
  months: number
  /** Jour du mois médian. */
  day: number
  /** Date ISO de la dernière occurrence. */
  lastDate: string
}

export interface RecurrenceOptions<T> {
  /** Regroupement : typiquement `${marchand}|${montant}`. */
  key: (item: T) => string
  /** Date ISO « AAAA-MM-JJ ». */
  date: (item: T) => string
  /** Jour du mois réel de l'opération. */
  day: (item: T) => number
  /** Mois distincts minimum (défaut : 3). */
  minMonths?: number
  /** Écart type maximal du jour du mois (défaut : 4). */
  maxDayDeviation?: number
  /** Occurrences tolérées par mois (défaut : 1,2). */
  maxPerMonth?: number
}

function stdDev(xs: number[]): number {
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length
  return Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length)
}

/**
 * Régularité du jour du mois, en tenant compte de sa CIRCULARITÉ.
 *
 * Un loyer prélevé « fin de mois » tombe le 29, le 30, parfois le 1er ou
 * le 2 du mois suivant. Un écart type naïf verrait 28 jours de différence
 * entre le 30 et le 2, alors qu'ils sont voisins. On rapproche donc les
 * petits jours des grands avant de mesurer la dispersion.
 */
export function dayDeviation(days: number[]): number {
  const direct = stdDev(days)
  const spansBoundary = days.some((d) => d <= 7) && days.some((d) => d >= 24)
  if (!spansBoundary) return direct
  const shifted = days.map((d) => (d <= 7 ? d + 30 : d))
  return Math.min(direct, stdDev(shifted))
}

/**
 * Regroupe des montants proches, à `tolerance` près (0,05 = ±5 %).
 *
 * Un loyer de 600, 620 puis 630 € reste le même loyer ; un salaire varie
 * de quelques euros d'un mois à l'autre. Exiger un montant strictement
 * identique ferait manquer les deux plus grosses lignes d'un budget.
 * Renvoie, pour chaque élément, l'identifiant de son groupe.
 */
export function clusterAmounts(cents: number[], tolerance: number): number[] {
  const order = cents.map((c, i) => ({ c, i })).sort((a, b) => a.c - b.c)
  const cluster = new Array<number>(cents.length)
  let current = 0
  let reference = order[0]?.c ?? 0
  for (const { c, i } of order) {
    if (reference > 0 && Math.abs(c - reference) / reference > tolerance) {
      current++
      reference = c
    }
    cluster[i] = current
  }
  return cluster
}

export function findRecurring<T>(
  items: T[],
  opts: RecurrenceOptions<T>,
): RecurringGroup<T>[] {
  const minMonths = opts.minMonths ?? 3
  const maxDeviation = opts.maxDayDeviation ?? 4
  const maxPerMonth = opts.maxPerMonth ?? 1.2

  const groups = new Map<string, T[]>()
  for (const item of items) {
    const k = opts.key(item)
    const list = groups.get(k) ?? []
    list.push(item)
    groups.set(k, list)
  }

  const found: RecurringGroup<T>[] = []
  for (const [key, list] of groups) {
    const months = new Set(list.map((i) => opts.date(i).slice(0, 7)))
    if (months.size < minMonths) continue
    if (list.length > months.size * maxPerMonth) continue

    const days = list.map(opts.day)
    if (dayDeviation(days) > maxDeviation) continue

    const sortedDays = [...days].sort((a, b) => a - b)
    const dates = list.map(opts.date).sort()
    found.push({
      key,
      items: list,
      months: months.size,
      day: sortedDays[Math.floor(sortedDays.length / 2)]!,
      lastDate: dates.at(-1)!,
    })
  }
  return found
}
