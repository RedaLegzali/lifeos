import { describe, expect, it } from 'vitest'
import { formatCents, formatCentsRounded } from './format'
import {
  addDays,
  daysUntil,
  isSameDay,
  nextBillingDate,
  nextOccurrence,
  startOfWeekMonday,
} from './dates'

describe('format monétaire (centimes)', () => {
  it('formate les centimes en euros français', () => {
    // Intl insère des espaces insécables : on normalise pour comparer.
    expect(formatCents(1349).replace(/\s/g, ' ')).toBe('13,49 €')
    expect(formatCentsRounded(124700).replace(/\s/g, ' ')).toBe('1 247 €')
  })

  it('arrondit correctement les agrégats', () => {
    expect(formatCentsRounded(18404)).toContain('184')
  })
})

describe('dates', () => {
  it('startOfWeekMonday retourne toujours un lundi', () => {
    for (let i = 0; i < 7; i++) {
      const d = addDays(new Date(2026, 6, 13), i) // semaine du lundi 13 juillet 2026
      expect(startOfWeekMonday(d).getDay()).toBe(1)
      expect(isSameDay(startOfWeekMonday(d), new Date(2026, 6, 13))).toBe(true)
    }
  })

  it('daysUntil compte des jours entiers', () => {
    const today = new Date()
    expect(daysUntil(today)).toBe(0)
    expect(daysUntil(addDays(today, 4))).toBe(4)
    expect(daysUntil(addDays(today, -2))).toBe(-2)
  })

  it('nextOccurrence : anniversaire cette année ou la suivante', () => {
    const from = new Date(2026, 6, 18) // 18 juillet 2026
    expect(nextOccurrence(7, 22, from)).toEqual(new Date(2026, 6, 22))
    expect(nextOccurrence(7, 18, from)).toEqual(new Date(2026, 6, 18)) // aujourd'hui
    expect(nextOccurrence(3, 12, from)).toEqual(new Date(2027, 2, 12)) // déjà passé
    // 29 février borné en année non bissextile → 28 février.
    expect(nextOccurrence(2, 29, new Date(2026, 11, 1))).toEqual(new Date(2027, 1, 28))
  })

  it('nextBillingDate : jour de prélèvement borné à la fin du mois', () => {
    const from = new Date(2026, 6, 18)
    expect(nextBillingDate(19, from)).toEqual(new Date(2026, 6, 19))
    expect(nextBillingDate(18, from)).toEqual(new Date(2026, 6, 18)) // aujourd'hui
    expect(nextBillingDate(5, from)).toEqual(new Date(2026, 7, 5)) // mois suivant
    // Le « 31 » débite le 30 avril.
    expect(nextBillingDate(31, new Date(2026, 3, 1))).toEqual(new Date(2026, 3, 30))
  })
})
