import { useLiveQuery } from 'dexie-react-hooks'
import { Badge, EmptyState, WidgetHeader } from '@/design/ui'
import { IconCheck } from '@/design/icons'
import { db, type Task } from '@/lib/db'
import { tasksWidget } from './manifest'

export function toggleTask(t: Task) {
  void db.tasks.update(t.id, {
    done: !t.done,
    doneAt: t.done ? undefined : new Date(),
  })
}

export function TasksCard() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) ?? []
  const pending = tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const shown = pending.slice(0, 3)

  return (
    <>
      <WidgetHeader
        widget={tasksWidget}
        right={
          pending.length > 0 ? (
            <Badge tint={tasksWidget.tint}>{pending.length} à faire</Badge>
          ) : undefined
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          widget={tasksWidget}
          emoji="✅"
          benefit="Note ce que tu as en tête — LifeOS te le rappellera chaque matin dans ton brief."
          cta="Ajouter une tâche"
          to="/taches"
        />
      ) : pending.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-4 text-center">
          <span className="text-[22px]">🎉</span>
          <p className="text-[13.5px] text-ink-2">Tout est fait. Belle journée.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {shown.map((task) => (
            <button
              key={task.id}
              type="button"
              role="checkbox"
              aria-checked={task.done}
              onClick={() => toggleTask(task)}
              className="flex w-full cursor-pointer items-center gap-[11px] rounded-[10px] p-2 text-left text-[13.5px] transition-colors hover:bg-white/[0.035]"
            >
              <span className="grid size-[18px] flex-none place-items-center rounded-md border-[1.5px] border-ink-3 transition-all duration-200">
                <IconCheck className="size-[11px] scale-50 text-bg opacity-0 transition-all duration-200" />
              </span>
              <span className="truncate">{task.title}</span>
            </button>
          ))}
          {pending.length > shown.length && (
            <span className="px-2 pt-1 text-xs text-ink-3">
              + {pending.length - shown.length} autres
            </span>
          )}
        </div>
      )}
    </>
  )
}
