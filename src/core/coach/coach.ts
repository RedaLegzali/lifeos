import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '@/lib/db'

/**
 * Le coach : guide l'utilisateur sur plusieurs jours, sans jamais
 * bloquer. UNE suggestion à la fois — la première étape utile encore
 * incomplète. « Plus tard » la masque jusqu'au lendemain (l'utilisateur
 * pressé peut toujours tout remplir de lui-même via les widgets).
 */

export interface CoachSuggestion {
  id: string
  emoji: string
  title: string
  benefit: string
  cta: string
  route: string
}

const SUGGESTIONS: CoachSuggestion[] = [
  {
    id: 'people',
    emoji: '🎂',
    title: 'Ajoute tes proches',
    benefit: 'pour ne plus jamais oublier un anniversaire.',
    cta: 'Ajouter (30 s)',
    route: '/semaine',
  },
  {
    id: 'subscriptions',
    emoji: '💳',
    title: 'Ajoute tes abonnements',
    benefit: 'pour savoir exactement ce que tu paies chaque mois.',
    cta: 'Ajouter (2 min)',
    route: '/abonnements',
  },
  {
    id: 'tasks',
    emoji: '✅',
    title: 'Note tes premières tâches',
    benefit: 'ton brief du matin te les rappellera.',
    cta: 'Noter (30 s)',
    route: '/taches',
  },
]

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function isDismissedToday(id: string): boolean {
  return localStorage.getItem(`lifeos.coach.${id}`) === todayKey()
}

export function dismissForToday(id: string): void {
  localStorage.setItem(`lifeos.coach.${id}`, todayKey())
}

/** La prochaine suggestion à afficher, ou null. */
export function useCoachSuggestion(): {
  suggestion: CoachSuggestion | null
  dismiss: () => void
} {
  // Tick local pour re-rendre après un « Plus tard ».
  const [, setTick] = useState(0)
  const counts = useLiveQuery(
    async () => ({
      people: await db.people.count(),
      subscriptions: await db.subscriptions.count(),
      tasks: await db.tasks.count(),
    }),
    [],
  )

  if (!counts) return { suggestion: null, dismiss: () => {} }

  const doneById: Record<string, boolean> = {
    people: counts.people > 0,
    subscriptions: counts.subscriptions > 0,
    tasks: counts.tasks > 0,
  }
  const next = SUGGESTIONS.find((s) => !doneById[s.id] && !isDismissedToday(s.id)) ?? null

  return {
    suggestion: next,
    dismiss: () => {
      if (next) {
        dismissForToday(next.id)
        setTick((t) => t + 1)
      }
    },
  }
}

/** Pour les tests : liste ordonnée des étapes du coach. */
export const coachSuggestions = SUGGESTIONS
