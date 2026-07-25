import { describe, expect, it } from 'vitest'
import type { Subscription, Transaction } from '@/lib/db'
import { buildForecast } from './forecast'

let seq = 0
function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: `t${seq++}`,
    date: '2026-06-17',
    label: 'CARTE X4069 17/06 NETFLIX',
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

/** Série mensuelle régulière, pour produire une récurrence détectable. */
function series(
  merchant: string,
  cents: number,
  months: string[],
  day: number,
  kind: 'debit' | 'credit' = 'debit',
): Transaction[] {
  const dd = String(day).padStart(2, '0')
  return months.map((m) =>
    tx({
      merchant,
      cents,
      kind,
      date: `${m}-${dd}`,
      label: `CARTE X4069 ${dd}/${m.slice(5)} ${merchant.toUpperCase()}`,
    }),
  )
}

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 's1',
  name: 'Netflix',
  initial: 'N',
  brandColor: '#e50914',
  brandInk: '#fff',
  priceCents: 1499,
  cycle: 'monthly',
  billingDay: 17,
  ...over,
})

// Point de départ fixe pour que les tests ne dépendent pas du jour réel.
const LE_10_JUIN = new Date(2026, 5, 10)

describe('prévision de trésorerie', () => {
  it('ne prévoit rien sans historique ni abonnement', () => {
    expect(buildForecast([], [], 30, LE_10_JUIN).empty).toBe(true)
  })

  it('projette un abonnement confirmé à sa prochaine échéance', () => {
    const f = buildForecast([], [sub()], 30, LE_10_JUIN)
    expect(f.payments).toHaveLength(1)
    expect(f.payments[0]).toMatchObject({ label: 'Netflix', daysAway: 7, confident: true })
    expect(f.debitCents).toBe(1499)
  })

  it('ignore ce qui tombe au-delà de la fenêtre', () => {
    // Prélèvement le 5 : la prochaine échéance est dans 26 jours.
    expect(buildForecast([], [sub({ billingDay: 5 })], 10, LE_10_JUIN).payments).toEqual([])
  })

  it('inclut le loyer, que la détection d’abonnements écarte', () => {
    // Un virement mensuel régulier n'est pas un abonnement, mais il sort
    // bien du compte : la prévision doit le voir.
    const loyer = series('Virement · DURAND', 62000, ['2026-03', '2026-04', '2026-05'], 28)
    const f = buildForecast(loyer, [], 30, LE_10_JUIN)
    expect(f.payments.map((p) => p.label)).toContain('Virement · DURAND')
    expect(f.debitCents).toBe(62000)
  })

  it('compte les revenus réguliers comme des entrées', () => {
    const salaire = series('Salaire', 200000, ['2026-03', '2026-04', '2026-05'], 28, 'credit')
    const f = buildForecast(salaire, [], 30, LE_10_JUIN)
    expect(f.creditCents).toBe(200000)
    expect(f.debitCents).toBe(0)
    expect(f.netCents).toBe(200000)
  })

  it('ne compte pas deux fois un abonnement déjà confirmé', () => {
    // Netflix est à la fois enregistré et visible dans l'historique.
    const historique = series('Netflix', 1499, ['2026-03', '2026-04', '2026-05'], 17)
    const f = buildForecast(historique, [sub()], 30, LE_10_JUIN)
    expect(f.payments.filter((p) => p.label === 'Netflix')).toHaveLength(1)
    expect(f.debitCents).toBe(1499)
  })

  it('exclut les transferts internes et les retraits', () => {
    const bruit = [
      ...series('Transfert interne', 50000, ['2026-03', '2026-04', '2026-05'], 15),
      ...series('Retrait espèces', 10000, ['2026-03', '2026-04', '2026-05'], 15),
    ]
    expect(buildForecast(bruit, [], 30, LE_10_JUIN).payments).toEqual([])
  })

  it('n’extrapole pas un paiement ponctuel', () => {
    const unique = [tx({ date: '2026-06-12', merchant: 'Achat unique', cents: 9900 })]
    expect(buildForecast(unique, [], 30, LE_10_JUIN).payments).toEqual([])
  })

  it('borne un prélèvement du 31 à la fin des mois courts', () => {
    // Le « 31 » doit tomber le 30 en avril, pas déborder sur mai.
    const f = buildForecast([], [sub({ billingDay: 31 })], 30, new Date(2026, 3, 1))
    expect(f.payments[0]!.date).toEqual(new Date(2026, 3, 30))
  })

  it('trie les échéances de la plus proche à la plus lointaine', () => {
    const f = buildForecast(
      [],
      [
        sub({ id: 'a', name: 'Tardif', billingDay: 28 }),
        sub({ id: 'b', name: 'Proche', billingDay: 12 }),
        sub({ id: 'c', name: 'Milieu', billingDay: 20 }),
      ],
      30,
      LE_10_JUIN,
    )
    expect(f.payments.map((p) => p.label)).toEqual(['Proche', 'Milieu', 'Tardif'])
  })

  it('signale comme incertain ce qui n’est vu que trois mois', () => {
    const f = buildForecast(
      series('Assurance', 4300, ['2026-03', '2026-04', '2026-05'], 15),
      [],
      30,
      LE_10_JUIN,
    )
    expect(f.payments[0]!.confident).toBe(false)
  })

  it('ramène un abonnement annuel à son montant réellement prélevé', () => {
    // Un abonnement annuel prélève sa totalité le jour venu, pas 1/12e.
    const f = buildForecast([], [sub({ cycle: 'annual', priceCents: 8988 })], 30, LE_10_JUIN)
    expect(f.payments[0]!.cents).toBe(8988)
  })
})
