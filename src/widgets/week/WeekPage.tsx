import { motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { daysUntil, formatDayMonth, nextOccurrence } from '@/lib/dates'
import { monthNames } from '@/pages/onboarding/drafts'
import { BirthdayQuickAdd } from './BirthdayQuickAdd'
import { weekWidget } from './manifest'

/**
 * Page Semaine — première brique réelle : la gestion des anniversaires.
 * (Agenda et planning viendront avec le module Semaine complet.)
 */
export function WeekPage() {
  const people = useLiveQuery(() => db.people.toArray(), [])
  const Icon = weekWidget.icon

  const sorted = (people ?? [])
    .map((p) => ({ ...p, next: nextOccurrence(p.birthMonth, p.birthDay) }))
    .sort((a, b) => a.next.getTime() - b.next.getTime())

  return (
    <motion.div
      className="pt-11"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-center gap-4">
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
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Semaine</h1>
          <p className="text-sm text-ink-2">
            {sorted.length > 0
              ? `${sorted.length} ${sorted.length > 1 ? 'anniversaires suivis' : 'anniversaire suivi'} — le prochain ${
                  daysUntil(sorted[0]!.next) === 0
                    ? "est aujourd'hui 🎉"
                    : `dans ${daysUntil(sorted[0]!.next)} j`
                }`
              : 'Commence par les anniversaires — le reste de la semaine suivra.'}
          </p>
        </div>
      </div>

      <div className="mt-8 grid max-w-2xl gap-3.5">
        <BirthdayQuickAdd onAdd={(p) => void db.people.add(p)} />

        <div className="flex flex-col gap-1.5">
          {sorted.map((p) => {
            const d = daysUntil(p.next)
            const age =
              p.birthYear !== undefined ? p.next.getFullYear() - p.birthYear : undefined
            return (
              <div
                key={p.id}
                className="glass-card flex items-center gap-3.5 px-4 py-3 text-[13.5px]"
                style={{ '--tint': 'var(--color-week)' } as never}
              >
                <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-week/12 text-[15px]">
                  🎂
                </span>
                <span className="min-w-0">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-ink-3">
                    {' '}
                    · {p.birthDay} {monthNames[p.birthMonth - 1]}
                    {age !== undefined ? ` · ${age} ans` : ''}
                  </span>
                  {p.giftIdeas && (
                    <>
                      <br />
                      <span className="text-[12px] text-ink-3">🎁 {p.giftIdeas}</span>
                    </>
                  )}
                </span>
                <span className="ml-auto flex-none text-xs tabular-nums text-ink-2">
                  {d === 0 ? "aujourd'hui 🎉" : d === 1 ? 'demain' : `${formatDayMonth(p.next)} · ${d} j`}
                </span>
                <button
                  type="button"
                  onClick={() => void db.people.delete(p.id)}
                  aria-label={`Retirer ${p.name}`}
                  className="cursor-pointer rounded-lg px-2 py-1 text-ink-3 transition-colors hover:text-danger"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        <p className="px-2 text-xs text-ink-3">
          À venir dans ce module : agenda, évènements, vue planning.
        </p>
      </div>
    </motion.div>
  )
}
