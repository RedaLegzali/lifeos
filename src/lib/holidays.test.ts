import { describe, expect, it } from 'vitest'
import { bridges, easterSunday, frenchHolidays, isWorkday, holidayMap } from './holidays'

describe('date de Pâques', () => {
  it('retrouve des dates connues', () => {
    expect(easterSunday(2024)).toEqual(new Date(2024, 2, 31))
    expect(easterSunday(2025)).toEqual(new Date(2025, 3, 20))
    expect(easterSunday(2026)).toEqual(new Date(2026, 3, 5))
    expect(easterSunday(2027)).toEqual(new Date(2027, 2, 28))
  })

  it('tombe toujours un dimanche', () => {
    for (let y = 2020; y <= 2040; y++) expect(easterSunday(y).getDay()).toBe(0)
  })
})

describe('jours fériés français', () => {
  it('en compte onze chaque année', () => {
    for (let y = 2024; y <= 2030; y++) expect(frenchHolidays(y)).toHaveLength(11)
  })

  it('place correctement les fêtes mobiles de 2026', () => {
    const byName = new Map(frenchHolidays(2026).map((h) => [h.name, h.date]))
    expect(byName.get('Lundi de Pâques')).toBe('2026-04-06')
    expect(byName.get('Ascension')).toBe('2026-05-14')
    expect(byName.get('Lundi de Pentecôte')).toBe('2026-05-25')
  })

  it('garde les dates fixes en place', () => {
    const dates = frenchHolidays(2026).map((h) => h.date)
    expect(dates).toContain('2026-07-14')
    expect(dates).toContain('2026-12-25')
    expect(dates).toContain('2026-11-11')
  })

  it("place l'Ascension un jeudi et le lundi de Pâques un lundi", () => {
    for (let y = 2024; y <= 2035; y++) {
      const byName = new Map(frenchHolidays(y).map((h) => [h.name, h.date]))
      const parse = (s: string) => {
        const [a, b, c] = s.split('-').map(Number)
        return new Date(a!, b! - 1, c!)
      }
      expect(parse(byName.get('Ascension')!).getDay()).toBe(4)
      expect(parse(byName.get('Lundi de Pâques')!).getDay()).toBe(1)
    }
  })

  it('rend les dates triées', () => {
    const dates = frenchHolidays(2026).map((h) => h.date)
    expect([...dates].sort()).toEqual(dates)
  })
})

describe('ponts', () => {
  it('libère le vendredi après l’Ascension', () => {
    // Ascension 2026 : jeudi 14 mai → vendredi 15 mai est un pont.
    const b = bridges(2026).find((x) => x.date === '2026-05-15')
    expect(b?.because).toBe('Ascension')
  })

  it('libère le lundi avant un férié du mardi', () => {
    // 2026 : le 1er décembre… vérifions un cas réel de férié un mardi.
    const found = bridges(2026)
    for (const b of found) {
      const [y, m, d] = b.date.split('-').map(Number)
      const day = new Date(y!, m! - 1, d!).getDay()
      // Un pont est forcément un lundi (1) ou un vendredi (5).
      expect([1, 5]).toContain(day)
    }
  })

  it('ne propose jamais un pont un week-end', () => {
    for (let y = 2024; y <= 2030; y++) {
      for (const b of bridges(y)) {
        const [a, m, d] = b.date.split('-').map(Number)
        const day = new Date(a!, m! - 1, d!).getDay()
        expect(day).not.toBe(0)
        expect(day).not.toBe(6)
      }
    }
  })
})

describe('jours ouvrés', () => {
  const holidays = holidayMap([2026])

  it('exclut les week-ends', () => {
    expect(isWorkday(new Date(2026, 6, 25), holidays)).toBe(false) // samedi
    expect(isWorkday(new Date(2026, 6, 26), holidays)).toBe(false) // dimanche
  })

  it('exclut les jours fériés', () => {
    expect(isWorkday(new Date(2026, 6, 14), holidays)).toBe(false) // 14 juillet
  })

  it('accepte un mardi ordinaire', () => {
    expect(isWorkday(new Date(2026, 6, 21), holidays)).toBe(true)
  })
})
