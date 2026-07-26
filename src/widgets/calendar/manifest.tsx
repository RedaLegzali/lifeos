import { lazy } from 'react'
import type { BriefItem, WidgetManifest } from '@/core/widgets/types'
import { IconCalendar } from '@/design/icons'
import { db } from '@/lib/db'
import { daysUntil, formatDayMonth } from '@/lib/dates'
import { bridgeMap, holidayMap, toISODate } from '@/lib/holidays'
import { birthdayToEvent, useBirthdays } from './birthdays'

// Chargement paresseux : évite tout cycle manifest → composant → registre
// et découpe le bundle par widget.
const CalendarCard = lazy(async () => ({
  default: (await import('./CalendarCard')).CalendarCard,
}))
const CalendarPage = lazy(async () => ({
  default: (await import('./CalendarPage')).CalendarPage,
}))

export const calendarWidget: WidgetManifest = {
  id: 'calendar',
  title: 'Calendrier',
  route: '/calendrier',
  tint: 'var(--color-week)',
  icon: IconCalendar,
  span: 3,
  description: 'Anniversaires, jours fériés, ponts, congés et échéances.',
  planned: [
    "Saisie d'évènements et de rendez-vous",
    'Horaires de travail récurrents',
    'Notifications avant chaque échéance',
  ],
  Card: CalendarCard,
  Page: CalendarPage,
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

    // Premier jour férié ou pont des dix prochains jours : de quoi
    // s'organiser sans avoir à ouvrir le calendrier.
    const today = new Date()
    const years = [today.getFullYear(), today.getFullYear() + 1]
    const holidays = holidayMap(years)
    const ponts = bridgeMap(years)

    for (let i = 0; i <= 10; i++) {
      const day = new Date(today)
      day.setDate(day.getDate() + i)
      const key = toISODate(day)

      const holiday = holidays.get(key)
      if (holiday) {
        items.push({
          id: 'brief-holiday',
          emoji: '🎌',
          text: (
            <>
              <b>{holiday.name}</b>{' '}
              {i === 0 ? (
                <b>aujourd'hui</b>
              ) : i === 1 ? (
                <b>demain</b>
              ) : (
                <>
                  dans <b>{i} jours</b>
                </>
              )}
            </>
          ),
          when: formatDayMonth(day),
          priority: 8,
        })
        break
      }

      const pont = ponts.get(key)
      if (pont) {
        items.push({
          id: 'brief-bridge',
          emoji: '🌴',
          text: (
            <>
              <b>Pont possible</b> le {formatDayMonth(day)} — un jour de congé pour quatre
            </>
          ),
          when: i === 0 ? "aujourd'hui" : `dans ${i} j`,
          priority: 8,
        })
        break
      }
    }

    return items
  },
  getSearchItems: async () => {
    const people = await db.people.toArray()
    const items = people.map((p) => {
      const e = birthdayToEvent(p)
      return {
        id: `calendar-${e.id}`,
        group: 'Personnes',
        emoji: '🎂',
        title: e.label,
        meta: `${formatDayMonth(e.date)} · dans ${daysUntil(e.date)} j`,
        route: '/calendrier',
        keywords: 'anniversaire famille',
      }
    })

    for (const p of people) {
      if (p.giftIdeas) {
        items.push({
          id: `calendar-gift-${p.id}`,
          group: 'Personnes',
          emoji: '🎁',
          title: `${p.name} — idées cadeaux`,
          meta: p.giftIdeas,
          route: '/calendrier',
          keywords: 'cadeau idée',
        })
      }
    }

    // Les ponts à venir sont cherchables (« pont », « congé », « vacances »).
    const year = new Date().getFullYear()
    for (const [date, b] of bridgeMap([year, year + 1])) {
      const d = new Date(date)
      // Un an d'avance : le prochain pont peut être à dix mois, et c'est
      // justement le moment de poser ses congés.
      const away = daysUntil(d)
      if (away < 0 || away > 400) continue
      items.push({
        id: `calendar-bridge-${date}`,
        group: 'Calendrier',
        emoji: '🌴',
        title: `Pont — ${formatDayMonth(d)}`,
        meta: b.because,
        route: '/calendrier',
        keywords: 'pont congé vacances férié',
      })
    }

    return items
  },
}
