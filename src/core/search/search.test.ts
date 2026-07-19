import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { collectSearchItems, createSearchIndex, runSearch } from './search'

/**
 * Plus aucune donnée fictive dans l'app : les tests sèment une vraie
 * base (fake-indexeddb) puis vérifient que la recherche la retrouve.
 */
beforeAll(async () => {
  await db.people.clear()
  await db.subscriptions.clear()
  await db.tasks.clear()
  await db.people.add({
    id: 'p1',
    name: 'Maman',
    birthDay: 22,
    birthMonth: 7,
    giftIdeas: 'Livre de cuisine',
  })
  await db.subscriptions.add({
    id: 's1',
    serviceId: 'netflix',
    name: 'Netflix',
    initial: 'N',
    brandColor: '#e50914',
    brandInk: '#ffffff',
    priceCents: 1349,
    cycle: 'monthly',
    billingDay: 15,
  })
  await db.tasks.add({
    id: 't1',
    title: 'Acheter le cadeau de Maman',
    done: false,
    createdAt: new Date(),
  })
})

describe('recherche globale (données réelles)', () => {
  it('trouve un abonnement par son nom (« netflix »)', async () => {
    const index = createSearchIndex(await collectSearchItems())
    expect(runSearch(index, 'netflix').some((r) => r.title === 'Netflix')).toBe(true)
  })

  it('trouve anniversaire ET idées cadeaux par prénom (« maman »)', async () => {
    const index = createSearchIndex(await collectSearchItems())
    const results = runSearch(index, 'maman')
    expect(results.some((r) => r.title === 'Anniversaire de Maman')).toBe(true)
    expect(results.some((r) => r.title.includes('idées cadeaux'))).toBe(true)
  })

  it('trouve une tâche (« cadeau »)', async () => {
    const index = createSearchIndex(await collectSearchItems())
    expect(runSearch(index, 'cadeau').some((r) => r.group === 'Tâches')).toBe(true)
  })

  it('propose les commandes de navigation (« réglages »)', async () => {
    const index = createSearchIndex(await collectSearchItems())
    expect(runSearch(index, 'réglages').some((r) => r.route === '/reglages')).toBe(true)
  })

  it('retourne une liste vide pour une requête vide', async () => {
    const index = createSearchIndex(await collectSearchItems())
    expect(runSearch(index, '   ')).toEqual([])
  })

  it('collecte des ids uniques sur tous les widgets', async () => {
    const ids = (await collectSearchItems()).map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
