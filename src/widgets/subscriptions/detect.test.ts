import { describe, expect, it } from 'vitest'
import type { Subscription, Transaction } from '@/lib/db'
import { detectSubscriptions, filterAlreadyAdded, toSubscription } from './detect'

let seq = 0
function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: `t${seq++}`,
    date: '2026-06-17',
    label: 'CARTE X4069 17/06 NETFLIX COM',
    detail: '',
    cents: 1499,
    kind: 'debit',
    merchant: 'Netflix',
    category: 'Abonnements',
    excluded: false,
    source: 'juin.pdf',
    ...over,
  }
}

/** Un abonnement mensuel régulier, sur les mois donnés. */
function monthly(
  merchant: string,
  cents: number,
  months: string[],
  day = 17,
): Transaction[] {
  return months.map((m) =>
    tx({
      merchant,
      cents,
      date: `${m}-${String(day).padStart(2, '0')}`,
      label: `CARTE X4069 ${String(day).padStart(2, '0')}/${m.slice(5)} ${merchant.toUpperCase()}`,
    }),
  )
}

describe('détection des abonnements', () => {
  it('repère un abonnement mensuel régulier', () => {
    const found = detectSubscriptions(
      monthly('Netflix', 1499, ['2026-02', '2026-03', '2026-05', '2026-06']),
    )
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ merchant: 'Netflix', cents: 1499, confident: true })
  })

  it('résiste à un relevé manquant au milieu', () => {
    // Avril absent : la détection par mois distincts ne doit pas s'effondrer.
    const found = detectSubscriptions(
      monthly('Spotify', 1720, ['2026-02', '2026-03', '2026-05', '2026-06'], 18),
    )
    expect(found).toHaveLength(1)
    expect(found[0]!.months).toBe(4)
  })

  it('exige au moins trois mois', () => {
    expect(detectSubscriptions(monthly('Netflix', 1499, ['2026-05', '2026-06']))).toEqual(
      [],
    )
  })

  it('exige un montant strictement identique', () => {
    const varying = [
      tx({ merchant: 'Truc', cents: 1000, date: '2026-02-10' }),
      tx({ merchant: 'Truc', cents: 1050, date: '2026-03-10' }),
      tx({ merchant: 'Truc', cents: 1100, date: '2026-04-10' }),
    ]
    expect(detectSubscriptions(varying)).toEqual([])
  })

  it('écarte un marchand fréquent malgré des montants qui se répètent', () => {
    // Cas réel : 170 commandes de livraison créent des coïncidences.
    const orders: Transaction[] = []
    for (const month of ['2026-02', '2026-03', '2026-04']) {
      for (let day = 1; day <= 20; day++) {
        orders.push(
          tx({
            merchant: 'Uber Eats',
            cents: 1551,
            date: `${month}-${String(day).padStart(2, '0')}`,
            label: `CARTE X4069 ${String(day).padStart(2, '0')}/${month.slice(5)} UBER EATS`,
          }),
        )
      }
    }
    expect(detectSubscriptions(orders)).toEqual([])
  })

  it('écarte les paiements dispersés dans le mois', () => {
    const scattered = [
      tx({ merchant: 'Truc', cents: 2000, date: '2026-02-03', label: 'CARTE X4069 03/02 TRUC' }),
      tx({ merchant: 'Truc', cents: 2000, date: '2026-03-19', label: 'CARTE X4069 19/03 TRUC' }),
      tx({ merchant: 'Truc', cents: 2000, date: '2026-04-27', label: 'CARTE X4069 27/04 TRUC' }),
    ]
    expect(detectSubscriptions(scattered)).toEqual([])
  })

  it('ignore virements, retraits et transferts internes', () => {
    const noise = [
      ...monthly('Virement · Marie Martin', 10000, ['2026-02', '2026-03', '2026-04']),
      ...monthly('Retrait espèces', 5000, ['2026-02', '2026-03', '2026-04']),
      ...monthly('Transfert interne', 20000, ['2026-02', '2026-03', '2026-04']),
    ]
    expect(detectSubscriptions(noise)).toEqual([])
  })

  it('ignore les crédits et les opérations exclues', () => {
    const credits = monthly('Salaire', 200000, ['2026-02', '2026-03', '2026-04']).map(
      (t) => ({ ...t, kind: 'credit' as const }),
    )
    expect(detectSubscriptions(credits)).toEqual([])
  })

  it('marque « à confirmer » ce qui n’est vu que trois mois', () => {
    const found = detectSubscriptions(
      monthly('Uber One', 599, ['2026-04', '2026-05', '2026-06'], 21),
    )
    expect(found[0]!.confident).toBe(false)
  })

  it('classe les suggestions du plus cher au moins cher', () => {
    const found = detectSubscriptions([
      ...monthly('Netflix', 1499, ['2026-02', '2026-03', '2026-04']),
      ...monthly('Orange', 3399, ['2026-02', '2026-03', '2026-04'], 11),
    ])
    expect(found.map((d) => d.merchant)).toEqual(['Orange', 'Netflix'])
  })
})

describe('conversion en abonnement', () => {
  it('récupère le logo de la bibliothèque quand le service est connu', () => {
    const [d] = detectSubscriptions(
      monthly('Netflix', 1499, ['2026-02', '2026-03', '2026-04']),
    )
    const sub = toSubscription(d!)
    expect(sub).toMatchObject({
      name: 'Netflix',
      serviceId: 'netflix',
      brandColor: '#e50914',
      priceCents: 1499,
      cycle: 'monthly',
    })
  })

  it('fabrique un monogramme pour un marchand inconnu', () => {
    const [d] = detectSubscriptions(
      monthly('Salle de sport', 2990, ['2026-02', '2026-03', '2026-04'], 5),
    )
    const sub = toSubscription(d!)
    expect(sub.serviceId).toBeUndefined()
    expect(sub.initial).toBe('SD')
    expect(sub.billingDay).toBe(5)
  })
})

describe('filtrage des suggestions', () => {
  const detected = detectSubscriptions([
    ...monthly('Netflix', 1499, ['2026-02', '2026-03', '2026-04']),
    ...monthly('Orange', 3399, ['2026-02', '2026-03', '2026-04'], 11),
  ])

  const existing = (over: Partial<Subscription>): Subscription => ({
    id: 'x',
    name: 'Netflix',
    initial: 'N',
    brandColor: '#e50914',
    brandInk: '#fff',
    priceCents: 1499,
    cycle: 'monthly',
    billingDay: 17,
    ...over,
  })

  it('ne propose pas un abonnement déjà enregistré', () => {
    const left = filterAlreadyAdded(detected, [existing({})])
    expect(left.map((d) => d.merchant)).toEqual(['Orange'])
  })

  it('reconnaît le doublon par identifiant de service', () => {
    const left = filterAlreadyAdded(detected, [
      existing({ name: 'Mon Netflix perso', serviceId: 'netflix' }),
    ])
    expect(left.map((d) => d.merchant)).toEqual(['Orange'])
  })

  it('respecte les suggestions écartées', () => {
    const left = filterAlreadyAdded(detected, [], [detected[0]!.key])
    expect(left.map((d) => d.merchant)).toEqual(['Netflix'])
  })
})
