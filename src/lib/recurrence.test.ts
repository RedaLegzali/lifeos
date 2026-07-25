import { describe, expect, it } from 'vitest'
import { clusterAmounts, dayDeviation, findRecurring } from './recurrence'

describe('régularité du jour du mois', () => {
  it('mesure une faible dispersion pour des jours voisins', () => {
    expect(dayDeviation([17, 17, 18, 17])).toBeLessThan(1)
  })

  it('traite la fin de mois comme continue', () => {
    // Un loyer prélevé le 29, le 30, puis le 2 du mois suivant reste
    // régulier : le 30 et le 2 sont voisins, pas à 28 jours d'écart.
    expect(dayDeviation([29, 27, 2, 30, 29])).toBeLessThan(3)
  })

  it('reste sévère pour des jours réellement dispersés', () => {
    expect(dayDeviation([3, 19, 27])).toBeGreaterThan(4)
  })
})

describe('regroupement des montants proches', () => {
  it('réunit un loyer qui varie de quelques euros', () => {
    const c = clusterAmounts([63000, 60000, 63000, 62000], 0.05)
    expect(new Set(c).size).toBe(1)
  })

  it('sépare deux montants nettement différents', () => {
    const c = clusterAmounts([1499, 1720, 9000], 0.05)
    expect(new Set(c).size).toBe(3)
  })

  it('ne chaîne pas une série continue en un seul groupe', () => {
    // Sans borne, 1000 → 1050 → 1100 → … finirait en un seul groupe.
    const c = clusterAmounts([1000, 1050, 1100, 1160, 1220], 0.05)
    expect(new Set(c).size).toBeGreaterThan(1)
  })
})

describe('détection générique de récurrence', () => {
  const item = (date: string, key: string, day: number) => ({ date, key, day })

  it('repère une série mensuelle', () => {
    const found = findRecurring(
      [
        item('2026-03-17', 'netflix', 17),
        item('2026-04-17', 'netflix', 17),
        item('2026-05-17', 'netflix', 17),
      ],
      { key: (i) => i.key, date: (i) => i.date, day: (i) => i.day },
    )
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ months: 3, day: 17 })
  })

  it('écarte ce qui revient plusieurs fois par mois', () => {
    const many = Array.from({ length: 30 }, (_, n) =>
      item(`2026-0${(n % 3) + 3}-${String((n % 28) + 1).padStart(2, '0')}`, 'resto', (n % 28) + 1),
    )
    expect(
      findRecurring(many, { key: (i) => i.key, date: (i) => i.date, day: (i) => i.day }),
    ).toEqual([])
  })

  it('respecte le nombre de mois minimum demandé', () => {
    const two = [item('2026-04-10', 'x', 10), item('2026-05-10', 'x', 10)]
    const opts = { key: (i: typeof two[0]) => i.key, date: (i: typeof two[0]) => i.date, day: (i: typeof two[0]) => i.day }
    expect(findRecurring(two, opts)).toEqual([])
    expect(findRecurring(two, { ...opts, minMonths: 2 })).toHaveLength(1)
  })
})
