import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Person } from '@/lib/db'
import { nextOccurrence } from '@/lib/dates'
import type { CalendarEvent } from '@/core/widgets/types'

/** Anniversaires — SANS import du registre (utilisé par le manifest). */

export function birthdayToEvent(p: Person): CalendarEvent {
  return {
    id: `person-${p.id}`,
    label: `Anniversaire de ${p.name}`,
    date: nextOccurrence(p.birthMonth, p.birthDay),
    emoji: '🎂',
    tint: 'var(--color-week)',
  }
}

/** Anniversaires réels (réactif). `undefined` pendant le chargement. */
export function useBirthdays(): CalendarEvent[] | undefined {
  const people = useLiveQuery(() => db.people.toArray(), [])
  return people?.map(birthdayToEvent)
}
