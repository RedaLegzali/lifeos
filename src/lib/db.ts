import Dexie, { type EntityTable } from 'dexie'

/**
 * Base locale de LifeOS — IndexedDB via Dexie.
 *
 * Principe local-first : TOUTES les données vivent sur cette machine,
 * aucun serveur, coût de fonctionnement : 0 €.
 *
 * Règle absolue : ne jamais modifier un schéma existant sans
 * incrémenter le numéro de version (migrations Dexie).
 */

/** Paire clé/valeur générique — préférences et petits états persistants. */
export interface KVEntry {
  key: string
  value: unknown
}

/** Une personne dont on suit l'anniversaire (saisie via l'onboarding). */
export interface Person {
  id: string
  name: string
  /** 1–12 */
  birthMonth: number
  /** 1–31 */
  birthDay: number
  /** Optionnel — permet d'afficher l'âge. */
  birthYear?: number
  /** Idées / habitudes de cadeaux. */
  giftIdeas?: string
}

/** Un abonnement réel (saisi via l'onboarding ou le module Abonnements). */
export interface Subscription {
  id: string
  /** Référence dans la bibliothèque de services (catalog.ts), si choisi là. */
  serviceId?: string
  name: string
  /** Monogramme affiché dans la pastille. */
  initial: string
  brandColor: string
  brandInk: string
  /** Prix du cycle en centimes (mensuel OU annuel selon `cycle`). */
  priceCents: number
  cycle: 'monthly' | 'annual'
  /** Jour du mois du prélèvement (1–31, borné à la fin du mois). */
  billingDay: number
  category?: string
}

/** Une tâche (module Tâches minimal — quick-add depuis le dashboard). */
export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: Date
  doneAt?: Date
}

export const db = new Dexie('lifeos') as Dexie & {
  kv: EntityTable<KVEntry, 'key'>
  people: EntityTable<Person, 'id'>
  subscriptions: EntityTable<Subscription, 'id'>
  tasks: EntityTable<Task, 'id'>
}

db.version(1).stores({
  kv: 'key',
})

// v2 — onboarding : anniversaires et abonnements réels.
db.version(2).stores({
  kv: 'key',
  people: 'id, name',
  subscriptions: 'id, name, billingDay',
})

// v3 — tâches réelles (le booléen `done` est filtré en JS, volumes faibles).
db.version(3).stores({
  kv: 'key',
  people: 'id, name',
  subscriptions: 'id, name, billingDay',
  tasks: 'id, createdAt',
})

export async function getKV<T>(key: string, fallback: T): Promise<T> {
  const entry = await db.kv.get(key)
  return entry === undefined ? fallback : (entry.value as T)
}

export async function setKV(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value })
}
