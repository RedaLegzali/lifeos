/**
 * Jours fériés français et ponts, calculés localement.
 *
 * Aucune API : tout se déduit de la date de Pâques. L'application
 * fonctionne donc hors ligne, indéfiniment, sans dépendre d'un service
 * qui pourrait disparaître ou devenir payant.
 */

export interface Holiday {
  /** ISO « AAAA-MM-JJ ». */
  date: string
  name: string
}

export interface Bridge {
  date: string
  /** Le jour férié qui rend ce pont possible. */
  because: string
}

/**
 * Dimanche de Pâques (calendrier grégorien), algorithme de Meeus.
 * Les jours fériés mobiles français en découlent tous.
 */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function iso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shift(d: Date, days: number): Date {
  const n = new Date(d)
  n.setDate(n.getDate() + days)
  return n
}

/** Les onze jours fériés français d'une année donnée. */
export function frenchHolidays(year: number): Holiday[] {
  const easter = easterSunday(year)
  return [
    { date: `${year}-01-01`, name: "Jour de l'an" },
    { date: iso(shift(easter, 1)), name: 'Lundi de Pâques' },
    { date: `${year}-05-01`, name: 'Fête du Travail' },
    { date: `${year}-05-08`, name: 'Victoire 1945' },
    { date: iso(shift(easter, 39)), name: 'Ascension' },
    { date: iso(shift(easter, 50)), name: 'Lundi de Pentecôte' },
    { date: `${year}-07-14`, name: 'Fête nationale' },
    { date: `${year}-08-15`, name: 'Assomption' },
    { date: `${year}-11-01`, name: 'Toussaint' },
    { date: `${year}-11-11`, name: 'Armistice 1918' },
    { date: `${year}-12-25`, name: 'Noël' },
  ].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Ponts faisables : un jour férié le mardi libère le lundi, un jour férié
 * le jeudi libère le vendredi. Un seul jour de congé pour quatre jours.
 */
export function bridges(year: number): Bridge[] {
  const found: Bridge[] = []
  for (const h of frenchHolidays(year)) {
    const [y, m, d] = h.date.split('-').map(Number)
    const date = new Date(y!, m! - 1, d!)
    const weekday = date.getDay() // 2 = mardi, 4 = jeudi
    if (weekday === 2) found.push({ date: iso(shift(date, -1)), because: h.name })
    else if (weekday === 4) found.push({ date: iso(shift(date, 1)), because: h.name })
  }
  return found
}

/** Index rapide pour l'affichage d'un mois : date ISO → jour férié. */
export function holidayMap(years: number[]): Map<string, Holiday> {
  const map = new Map<string, Holiday>()
  for (const y of years) for (const h of frenchHolidays(y)) map.set(h.date, h)
  return map
}

export function bridgeMap(years: number[]): Map<string, Bridge> {
  const map = new Map<string, Bridge>()
  for (const y of years) for (const b of bridges(y)) map.set(b.date, b)
  return map
}

/** Jour ouvré : ni week-end, ni férié. */
export function isWorkday(date: Date, holidays: Map<string, Holiday>): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  return !holidays.has(iso(date))
}

export { iso as toISODate }
