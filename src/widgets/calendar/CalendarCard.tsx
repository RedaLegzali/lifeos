import { EmptyState, WidgetHeader } from '@/design/ui'
import {
  addDays,
  daysUntil,
  formatDayMonth,
  formatDayShort,
  isSameDay,
  startOfWeekMonday,
} from '@/lib/dates'
import { bridgeMap, holidayMap, toISODate } from '@/lib/holidays'
import { calendarWidget } from './manifest'
import { useCalendarEvents } from './useCalendarEvents'

function whenLabel(date: Date, time?: string): string {
  const d = daysUntil(date)
  if (d === 0) return time ?? "aujourd'hui"
  if (d === 1) return 'demain'
  return formatDayMonth(date)
}

export function CalendarCard() {
  const events = useCalendarEvents()
  const today = new Date()
  const monday = startOfWeekMonday(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const years = [...new Set(days.map((d) => d.getFullYear()))]
  const holidays = holidayMap(years)
  const ponts = bridgeMap(years)

  const upcoming = events.filter((e) => daysUntil(e.date) >= 0).slice(0, 3)
  const weekHasSomething =
    events.length > 0 || days.some((d) => holidays.has(toISODate(d)))

  return (
    <>
      <WidgetHeader widget={calendarWidget} />

      {!weekHasSomething ? (
        <EmptyState
          widget={calendarWidget}
          emoji="🎂"
          benefit="N'oublie plus jamais un anniversaire, et repère les ponts à poser bien à l'avance."
          cta="Ouvrir le calendrier"
          to="/calendrier"
        />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days.map((day) => {
              const key = toISODate(day)
              const isToday = isSameDay(day, today)
              const holiday = holidays.get(key)
              const pont = ponts.get(key)
              const dots = events.filter((e) => isSameDay(e.date, day))
              return (
                <div
                  key={key}
                  title={holiday?.name ?? (pont ? `Pont — ${pont.because}` : undefined)}
                  className={`flex flex-col items-center gap-1.5 rounded-[10px] px-0.5 pb-2.5 pt-2 ${
                    isToday
                      ? 'bg-accent/15'
                      : holiday
                        ? 'bg-week/[0.12]'
                        : pont
                          ? 'border border-dashed border-accent/30'
                          : ''
                  }`}
                >
                  <span className="text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
                    {formatDayShort(day)}
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isToday ? 'text-accent' : holiday ? 'text-week' : ''
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span className="flex h-[5px] gap-[3px]">
                    {dots.slice(0, 3).map((e) => (
                      <i
                        key={e.id}
                        className="size-[5px] rounded-full"
                        style={{ background: e.tint }}
                      />
                    ))}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 text-[13px] text-ink-2">
                <span
                  className="h-4 w-[3px] flex-none rounded-sm"
                  style={{ background: e.tint }}
                />
                <span className="truncate">
                  {e.emoji && `${e.emoji} `}
                  <b className="font-semibold text-ink">{e.label}</b>
                </span>
                <span className="ml-auto flex-none text-xs tabular-nums text-ink-3">
                  {whenLabel(e.date, e.time)}
                </span>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-[13px] text-ink-3">Rien de prévu cette semaine.</p>
            )}
          </div>
        </>
      )}
    </>
  )
}
