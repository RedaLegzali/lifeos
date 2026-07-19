import { lazy } from 'react'
import type { BriefItem, WidgetManifest } from '@/core/widgets/types'
import { IconCalendar } from '@/design/icons'
import { db } from '@/lib/db'
import { daysUntil, formatDayMonth } from '@/lib/dates'
import { birthdayToEvent, useBirthdays } from './birthdays'

// Chargement paresseux : évite tout cycle manifest → composant → registre
// et découpe le bundle par widget.
const WeekCard = lazy(async () => ({ default: (await import('./WeekCard')).WeekCard }))
const WeekPage = lazy(async () => ({ default: (await import('./WeekPage')).WeekPage }))

export const weekWidget: WidgetManifest = {
  id: 'week',
  title: 'Semaine',
  route: '/semaine',
  tint: 'var(--color-week)',
  icon: IconCalendar,
  span: 3,
  description: 'Anniversaires, agenda et évènements de la semaine.',
  planned: [
    "Agenda de la semaine avec saisie d'évènements",
    'Notifications avant chaque anniversaire',
    'Vue planning mensuelle',
  ],
  Card: WeekCard,
  Page: WeekPage,
  useCalendarEvents: () => useBirthdays() ?? [],
  useBriefItems: () => {
    const birthdays = useBirthdays() ?? []
    const items: BriefItem[] = []

    const next = birthdays
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
    if (next && daysUntil(next.date) <= 14) {
      const d = daysUntil(next.date)
      items.push({
        id: 'brief-birthday',
        emoji: '🎂',
        text: (
          <>
            <b>{next.label}</b>{' '}
            {d === 0 ? (
              <b>aujourd'hui 🎉</b>
            ) : d === 1 ? (
              <b>demain</b>
            ) : (
              <>
                dans <b>{d} jours</b>
              </>
            )}
          </>
        ),
        when: formatDayMonth(next.date),
        priority: 1,
      })
    }
    return items
  },
  getSearchItems: async () => {
    const people = await db.people.toArray()
    const items = people.map((p) => {
      const e = birthdayToEvent(p)
      return {
        id: `week-${e.id}`,
        group: 'Personnes',
        emoji: '🎂',
        title: e.label,
        meta: `${formatDayMonth(e.date)} · dans ${daysUntil(e.date)} j`,
        route: '/semaine',
        keywords: 'anniversaire famille',
      }
    })
    for (const p of people) {
      if (p.giftIdeas) {
        items.push({
          id: `week-gift-${p.id}`,
          group: 'Personnes',
          emoji: '🎁',
          title: `${p.name} — idées cadeaux`,
          meta: p.giftIdeas,
          route: '/semaine',
          keywords: 'cadeau idée',
        })
      }
    }
    return items
  },
}
