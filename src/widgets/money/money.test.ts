import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/lib/db'
import { classify } from './categories'
import { buildMoneyData, coveredMonths, transactionId } from './useMoneyData'

const raw = (label: string, detail = '') => ({
  date: '2026-06-17',
  label,
  detail,
  cents: 1499,
  kind: 'debit' as const,
})

describe('normalisation des libellés bancaires', () => {
  it('retrouve le marchand derrière le bruit de la carte', () => {
    expect(classify(raw('CARTE X4069 17/06 NETFLIX COM')).merchant).toBe('Netflix')
    expect(classify(raw('CARTE X4069 08/01 UBER *EATS')).merchant).toBe('Uber Eats')
    expect(classify(raw('CARTE X4069 21/06 UBER *ONE MEMBERSHIP')).merchant).toBe('Uber One')
  })

  it('distingue les cas particuliers des cas généraux', () => {
    // Un crédit à la consommation n'est pas un achat, et Prime n'est pas Amazon.
    expect(classify(raw('CARTE X4069 21/04 COFIDIS AMAZON')).merchant).toBe(
      'Crédit à la consommation',
    )
    expect(classify(raw('CARTE X4069 03/07 AMAZON PRIME FR')).merchant).toBe('Amazon Prime')
    expect(classify(raw('CARTE X4069 12/05 AMZN MKTPLACE')).merchant).toBe('Amazon')
  })

  it('range chaque marchand dans sa catégorie', () => {
    expect(classify(raw('NETFLIX COM')).category).toBe('Abonnements')
    expect(classify(raw('UBER *EATS')).category).toBe('Livraison de repas')
    expect(classify(raw('COFIDIS AMAZON')).category).toBe('Crédits en cours')
  })

  it('exclut les virements que le titulaire se fait à lui-même', () => {
    const t = raw('VIR EUROPEEN EMIS LOGITEL', 'POUR: M. JEAN DUPONT | REF: 96012544')
    const c = classify(t, 'Jean')
    expect(c.excluded).toBe(true)
    expect(c.merchant).toBe('Transfert interne')
  })

  it('nomme la contrepartie sans amputer son prénom', () => {
    // Le retrait de la civilité ne doit pas manger le M de « Marie ».
    const t = raw('VIR INSTANTANE EMIS', 'POUR: Marie Martin | DATE: 12/01/2026')
    expect(classify(t, 'Jean').merchant).toBe('Virement · Marie Martin')
    const u = raw('VIR INSTANTANE EMIS', 'POUR: M. PAUL DURAND')
    expect(classify(u, 'Jean').merchant).toBe('Virement · PAUL DURAND')
  })
})

describe('identité des opérations', () => {
  it('donne la même clé au même relevé réimporté', () => {
    expect(transactionId(raw('CARTE X4069 17/06 NETFLIX'))).toBe(
      transactionId(raw('CARTE X4069 17/06 NETFLIX')),
    )
  })

  it('sépare deux virements identiques du même jour via leur référence', () => {
    // Cas réel : deux virements de 30 € le 26/05, seule la référence diffère.
    const a = transactionId(raw('VIR EUROPEEN EMIS', 'REF: 9614358773743'))
    const b = transactionId(raw('VIR EUROPEEN EMIS', 'REF: 9614459314298'))
    expect(a).not.toBe(b)
  })
})

describe('agrégation', () => {
  const tx = (over: Partial<Transaction>): Transaction => ({
    id: crypto.randomUUID(),
    date: '2026-06-17',
    label: '',
    detail: '',
    cents: 1000,
    kind: 'debit',
    merchant: 'Netflix',
    category: 'Abonnements',
    excluded: false,
    source: 'juin.pdf',
    ...over,
  })

  it('signale l’absence de données plutôt que d’afficher des zéros', () => {
    expect(buildMoneyData([]).empty).toBe(true)
  })

  it('exclut les transferts internes des totaux même quand ils dominent', () => {
    const data = buildMoneyData([tx({ cents: 5000 })])
    expect(data.totalDebits).toBe(5000)
  })

  it('tient les transferts internes hors des totaux', () => {
    const data = buildMoneyData([
      tx({ cents: 5000 }),
      tx({ cents: 90000, excluded: true, category: 'Transferts internes' }),
    ])
    expect(data.totalDebits).toBe(5000)
    expect(data.categories.some((c) => c.name === 'Transferts internes')).toBe(false)
  })

  it('classe les catégories par montant décroissant', () => {
    const data = buildMoneyData([
      tx({ cents: 1000, category: 'Courses' }),
      tx({ cents: 8000, category: 'Logement', merchant: 'Loyer' }),
      tx({ cents: 3000, category: 'Abonnements' }),
    ])
    expect(data.categories.map((c) => c.name)).toEqual([
      'Logement',
      'Abonnements',
      'Courses',
    ])
  })

  it('cumule les marchands au sein d’une catégorie', () => {
    const data = buildMoneyData([
      tx({ cents: 1499, merchant: 'Netflix' }),
      tx({ cents: 1720, merchant: 'Spotify' }),
      tx({ cents: 1499, merchant: 'Netflix' }),
    ])
    const abos = data.categories[0]!
    expect(abos.merchants[0]).toEqual({ name: 'Netflix', cents: 2998, count: 2 })
  })

  it('applique les règles de l’utilisateur par-dessus la détection', () => {
    const data = buildMoneyData(
      [tx({ cents: 62200, merchant: 'Virement · DURAND', category: 'Virements à des proches' })],
      { 'Virement · DURAND': 'Logement' },
    )
    expect(data.categories[0]!.name).toBe('Logement')
  })
})

describe('durée couverte par les données', () => {
  it('compte un mois complet comme 1', () => {
    expect(coveredMonths(['2026-06-01', '2026-06-30'])).toBeCloseTo(1, 2)
  })

  it('ne compte qu’une fraction pour un mois partiel', () => {
    // Du 1er au 8 juillet : 8 jours sur 31.
    expect(coveredMonths(['2026-07-01', '2026-07-08'])).toBeCloseTo(8 / 31, 2)
  })

  it('ne facture pas les mois absents des données', () => {
    // Février et juin pleins, avec un trou de mars à mai au milieu.
    const dates = ['2026-02-01', '2026-02-28', '2026-06-01', '2026-06-30']
    expect(coveredMonths(dates)).toBeCloseTo(2, 1)
  })

  it('retrouve ~5 mois sur le cas réel (5 relevés, avril manquant)', () => {
    // Relevés SG allant du 10/01 au 08/07 avec le relevé d'avril absent.
    const dates = [
      '2026-01-10', '2026-01-31',
      '2026-02-01', '2026-02-28',
      '2026-03-01', '2026-03-09',
      '2026-04-10', '2026-04-30',
      '2026-05-01', '2026-05-31',
      '2026-06-01', '2026-06-30',
      '2026-07-01', '2026-07-08',
    ]
    expect(coveredMonths(dates)).toBeGreaterThan(4.7)
    expect(coveredMonths(dates)).toBeLessThan(5.2)
  })
})
