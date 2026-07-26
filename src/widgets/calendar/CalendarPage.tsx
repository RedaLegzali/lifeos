import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Button } from '@/design/form'
import { addDays, daysUntil, isSameDay, startOfWeekMonday } from '@/lib/dates'
import { bridgeMap, holidayMap, toISODate } from '@/lib/holidays'
import { capitalize } from '@/lib/format'
import { BirthdayQuickAdd } from './BirthdayQuickAdd'
import { useCalendarEvents } from './useCalendarEvents'
import { toggleLeaveDay, useLeave } from './leave'
import { describeWeather, useWeather } from './weather'
import { calendarWidget } from './manifest'

const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

const monthLabel = (d: Date) =>
  capitalize(new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d))

const longDate = (d: Date) =>
  capitalize(
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(d),
  )

/** Les six semaines qui couvrent le mois affiché, lundi en première colonne. */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = startOfWeekMonday(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export function CalendarPage() {
  const today = new Date()
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selected, setSelected] = useState<Date>(today)

  const events = useCalendarEvents()
  const weather = useWeather()
  const leave = useLeave(today.getFullYear())
  const people = useLiveQuery(() => db.people.toArray(), [])

  const days = useMemo(() => monthGrid(month), [month])
  const years = useMemo(() => [...new Set(days.map((d) => d.getFullYear()))], [days])
  const holidays = useMemo(() => holidayMap(years), [years])
  const ponts = useMemo(() => bridgeMap(years), [years])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>()
    for (const e of events) {
      const key = toISODate(e.date)
      map.set(key, [...(map.get(key) ?? []), e])
    }
    return map
  }, [events])

  const selectedKey = toISODate(selected)
  const selectedEvents = eventsByDate.get(selectedKey) ?? []
  const selectedHoliday = holidays.get(selectedKey)
  const selectedBridge = ponts.get(selectedKey)
  const selectedWeather = weather.byDate.get(selectedKey)
  const isLeave = leave.days.has(selectedKey)

  const Icon = calendarWidget.icon

  // Les prochains ponts se cherchent SUR DEUX ANS, indépendamment du mois
  // affiché : le suivant peut tomber l'année prochaine.
  const upcomingPonts = useMemo(() => {
    const y = today.getFullYear()
    return [...bridgeMap([y, y + 1]).entries()]
      .filter(([date]) => daysUntil(new Date(date)) >= 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 3)
    // La liste ne dépend que de l'année courante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.getFullYear()])

  return (
    <motion.div
      className="pt-11"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-center gap-4">
        <span
          className="grid size-12 flex-none place-items-center rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--color-week) 14%, transparent)',
            color: 'var(--color-week)',
          }}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Calendrier</h1>
          <p className="text-sm text-ink-2">
            {leave.remaining} jour{leave.remaining > 1 ? 's' : ''} de congé restant
            {leave.remaining > 1 ? 's' : ''} sur {leave.allowance}
          </p>
        </div>

        {!weather.loading && !weather.failed && weather.days[0] && (
          <div className="ml-auto flex items-center gap-2.5 rounded-2xl border border-white/[0.075] bg-white/[0.03] px-4 py-2.5">
            <span className="text-[20px]">
              {describeWeather(weather.days[0].code).emoji}
            </span>
            <span className="text-[13px] leading-tight">
              <span className="font-semibold">{weather.days[0].tempMax}°</span>
              <span className="text-ink-3"> / {weather.days[0].tempMin}°</span>
              <br />
              <span className="text-[11.5px] text-ink-3">{weather.location.name}</span>
            </span>
          </div>
        )}
      </div>

      {/* ---- Navigation du mois ---- */}
      <div className="mt-8 flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-[-0.02em]">{monthLabel(month)}</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="secondary"
            aria-label="Mois précédent"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="!px-3"
          >
            ←
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelected(today)
            }}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="secondary"
            aria-label="Mois suivant"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="!px-3"
          >
            →
          </Button>
        </div>
      </div>

      {/* ---- Grille du mois ---- */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3"
          >
            {d}
          </div>
        ))}

        {days.map((day) => {
          const key = toISODate(day)
          const inMonth = day.getMonth() === month.getMonth()
          const isToday = isSameDay(day, today)
          const isSelected = isSameDay(day, selected)
          const holiday = holidays.get(key)
          const pont = ponts.get(key)
          const onLeave = leave.days.has(key)
          const dayEvents = eventsByDate.get(key) ?? []
          const weekend = day.getDay() === 0 || day.getDay() === 6

          const tone = isSelected
            ? 'border-accent/60 bg-accent/[0.09]'
            : onLeave
              ? 'border-money/35 bg-money/[0.09] hover:bg-money/[0.14]'
              : holiday
                ? 'border-week/25 bg-week/[0.08] hover:bg-week/[0.13]'
                : pont
                  ? 'border-dashed border-accent/35 hover:bg-white/[0.04]'
                  : 'border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.05]'

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(day)}
              aria-label={longDate(day)}
              aria-current={isToday ? 'date' : undefined}
              className={`flex min-h-[52px] cursor-pointer flex-col items-start gap-1 overflow-hidden rounded-xl border p-1.5 text-left transition-all duration-150 sm:min-h-[76px] sm:p-2 ${
                inMonth ? '' : 'opacity-35'
              } ${tone}`}
            >
              <span className="flex w-full items-center gap-1">
                <span
                  className={`grid size-[22px] place-items-center rounded-full text-[12.5px] tabular-nums ${
                    isToday
                      ? 'bg-accent font-bold text-bg'
                      : weekend
                        ? 'text-ink-3'
                        : 'font-medium'
                  }`}
                >
                  {day.getDate()}
                </span>
                {onLeave && <span className="ml-auto text-[10px]">🌴</span>}
              </span>

              {/* Sur mobile, la cellule est trop étroite pour un libellé :
                  la teinte de fond suffit, et le détail nomme le jour. */}
              {holiday && (
                <span className="hidden w-full truncate text-left text-[9.5px] font-semibold leading-tight text-week sm:block">
                  {holiday.name}
                </span>
              )}
              {pont && !holiday && (
                <span className="hidden text-[9.5px] font-semibold uppercase tracking-wider text-accent sm:block">
                  pont
                </span>
              )}
              {(holiday || pont) && (
                <span
                  className={`size-[5px] rounded-full sm:hidden ${
                    holiday ? 'bg-week' : 'bg-accent'
                  }`}
                />
              )}

              {dayEvents.length > 0 && (
                <span className="mt-auto flex flex-wrap gap-[3px]">
                  {dayEvents.slice(0, 4).map((e) => (
                    <i
                      key={e.id}
                      className="size-[5px] rounded-full"
                      style={{ background: e.tint }}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ---- Jour sélectionné ---- */}
      <div className="mt-5 grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass-card p-5" style={{ '--tint': 'var(--color-week)' } as never}>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[15px] font-bold tracking-[-0.01em]">{longDate(selected)}</h3>
            {selectedWeather && (
              <span className="text-[12.5px] text-ink-3">
                {describeWeather(selectedWeather.code).emoji} {selectedWeather.tempMax}° ·{' '}
                {selectedWeather.rainChance} % de pluie
              </span>
            )}
            <Button
              variant={isLeave ? 'tinted' : 'secondary'}
              onClick={() => void toggleLeaveDay(selectedKey)}
              className="ml-auto !px-3.5 !py-1.5 !text-[12.5px]"
            >
              {isLeave ? '🌴 Congé posé' : 'Poser un congé'}
            </Button>
          </div>

          {selectedHoliday && (
            <p className="mt-3 rounded-xl border border-week/25 bg-week/[0.07] px-3.5 py-2 text-[13px]">
              <b className="font-semibold text-week">{selectedHoliday.name}</b>
              <span className="text-ink-3"> — jour férié</span>
            </p>
          )}
          {selectedBridge && (
            <p className="mt-3 rounded-xl border border-dashed border-accent/35 px-3.5 py-2 text-[13px] text-ink-2">
              <b className="font-semibold text-accent">Pont possible</b> — un seul jour de
              congé pour quatre jours, grâce à {selectedBridge.because}.
            </p>
          )}

          <div className="mt-3 flex flex-col">
            {selectedEvents.length === 0 && !selectedHoliday && !selectedBridge ? (
              <p className="py-2 text-[13px] text-ink-3">Rien de prévu ce jour-là.</p>
            ) : (
              selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 border-b border-white/[0.04] py-2.5 text-[13.5px] last:border-0"
                >
                  <span
                    className="h-4 w-[3px] flex-none rounded-sm"
                    style={{ background: e.tint }}
                  />
                  <span className="truncate">
                    {e.emoji && `${e.emoji} `}
                    {e.label}
                  </span>
                  {e.time && (
                    <span className="ml-auto flex-none text-xs tabular-nums text-ink-3">
                      {e.time}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3.5">
          {upcomingPonts.length > 0 && (
            <section
              className="glass-card p-5"
              style={{ '--tint': 'var(--color-accent)' } as never}
            >
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Prochains ponts
              </h3>
              <div className="mt-3 flex flex-col gap-1">
                {upcomingPonts.map(([date, b]) => {
                  const d = new Date(date)
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
                        setSelected(d)
                      }}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.05]"
                    >
                      <span className="text-[14px]">🌴</span>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate font-medium">{longDate(d)}</span>
                        <span className="text-[11.5px] text-ink-3">{b.because}</span>
                      </span>
                      <span className="ml-auto flex-none text-[11.5px] tabular-nums text-ink-3">
                        dans {daysUntil(d)} j
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <section
            className="glass-card p-5"
            style={{ '--tint': 'var(--color-week)' } as never}
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
              Anniversaires · {people?.length ?? 0}
            </h3>
            <div className="mt-3">
              <BirthdayQuickAdd onAdd={(p) => void db.people.add(p)} />
            </div>
          </section>
        </div>
      </div>

      <p className="mt-5 px-2 text-xs text-ink-3">
        Jours fériés et ponts calculés localement · météo Open-Meteo · les prélèvements
        proviennent du module Argent.
      </p>
    </motion.div>
  )
}
