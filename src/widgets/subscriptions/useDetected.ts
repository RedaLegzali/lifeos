import { useLiveQuery } from 'dexie-react-hooks'
import { db, getKV, setKV } from '@/lib/db'
import {
  detectSubscriptions,
  filterAlreadyAdded,
  toSubscription,
  type DetectedSubscription,
} from './detect'

/** Suggestions que l'utilisateur a explicitement écartées. */
const IGNORED_KEY = 'subscriptions.ignoredSuggestions'

async function loadIgnored(): Promise<string[]> {
  return getKV<string[]>(IGNORED_KEY, [])
}

export async function ignoreSuggestion(key: string): Promise<void> {
  const current = await loadIgnored()
  if (!current.includes(key)) await setKV(IGNORED_KEY, [...current, key])
}

/** Rend visibles à nouveau toutes les suggestions écartées. */
export async function resetIgnored(): Promise<void> {
  await setKV(IGNORED_KEY, [])
}

/** Enregistre une suggestion en abonnement réel. */
export async function confirmSuggestion(d: DetectedSubscription): Promise<void> {
  await db.subscriptions.add(toSubscription(d))
}

export async function confirmAll(list: DetectedSubscription[]): Promise<void> {
  await db.subscriptions.bulkAdd(list.map(toSubscription))
}

export interface DetectionState {
  /** Suggestions restantes, hors déjà ajoutées et hors écartées. */
  suggestions: DetectedSubscription[]
  /** true tant qu'aucun relevé n'a été importé. */
  noStatements: boolean
  /** Nombre de suggestions écartées, pour proposer de les revoir. */
  ignoredCount: number
}

export function useDetectedSubscriptions(): DetectionState {
  const state = useLiveQuery(async () => {
    const [transactions, existing, ignored] = await Promise.all([
      db.transactions.toArray(),
      db.subscriptions.toArray(),
      loadIgnored(),
    ])
    const detected = detectSubscriptions(transactions)
    return {
      suggestions: filterAlreadyAdded(detected, existing, ignored),
      noStatements: transactions.length === 0,
      ignoredCount: ignored.length,
    }
  }, [])

  return state ?? { suggestions: [], noStatements: true, ignoredCount: 0 }
}
