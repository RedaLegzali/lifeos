import type { CalendarEvent } from '@/core/widgets/types'
import { widgets } from '@/core/widgets/registry'
import { useBirthdays } from './birthdays'

/**
 * Tous les évènements datés : anniversaires + évènements exposés par
 * les AUTRES widgets via leur contrat `useCalendarEvents` (prélèvements
 * d'abonnements, échéances…). Zéro couplage direct entre widgets.
 *
 * Ce module importe le registre : il ne doit être importé QUE par des
 * composants chargés paresseusement (WeekCard), jamais par un manifest —
 * sinon cycle d'imports au chargement.
 */
export function useWeekEvents(): CalendarEvent[] {
  const birthdays = useBirthdays() ?? []
  // Ordre d'appel stable : le registre est figé au build.
  const fromWidgets = widgets.flatMap((w) =>
    w.id === 'week' ? [] : (w.useCalendarEvents?.() ?? []),
  )
  return [...birthdays, ...fromWidgets].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  )
}
