import { capitalize } from './format'

/**
 * Utilitaires de dates — volontairement sans dépendance externe.
 * Toutes les fonctions travaillent sur des `Date` locales.
 */

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Lundi de la semaine de `date` (convention française). */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Jours entiers entre aujourd'hui (minuit) et `date` (minuit). */
export function daysUntil(date: Date, from: Date = new Date()): number {
  const a = new Date(from)
  a.setHours(0, 0, 0, 0)
  const b = new Date(date)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** « Samedi 18 juillet 2026 » */
export function formatFullDate(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
  )
}

/** « sam. » */
export function formatDayShort(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
    .format(date)
    .replace('.', '')
}

/** « 22 juil. » */
export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/**
 * Prochaine occurrence d'une date récurrente annuelle (anniversaire).
 * `month` 1–12, `day` 1–31 (borné à la fin du mois, ex. 29 fév.).
 */
export function nextOccurrence(month: number, day: number, from: Date = new Date()): Date {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  for (const year of [start.getFullYear(), start.getFullYear() + 1]) {
    const d = new Date(year, month - 1, Math.min(day, daysInMonth(year, month - 1)))
    if (d.getTime() >= start.getTime()) return d
  }
  // Inatteignable : l'occurrence de l'année suivante est toujours future.
  throw new Error('nextOccurrence: date invalide')
}

/**
 * Prochaine date de prélèvement pour un jour de facturation mensuel
 * (1–31, borné à la fin du mois : le « 31 » débite le 30 avril).
 */
export function nextBillingDate(billingDay: number, from: Date = new Date()): Date {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const y = start.getFullYear()
  const m = start.getMonth()
  const thisMonth = new Date(y, m, Math.min(billingDay, daysInMonth(y, m)))
  if (thisMonth.getTime() >= start.getTime()) return thisMonth
  const nm = m + 1
  return new Date(y, nm, Math.min(billingDay, daysInMonth(y, nm)))
}
