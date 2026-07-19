import { useState } from 'react'
import { motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { IconCheck } from '@/design/icons'
import { db, type Task } from '@/lib/db'
import { tasksWidget } from './manifest'
import { toggleTask } from './TasksCard'

function TaskRow({ task }: { task: Task }) {
  return (
    <div
      className="glass-card flex items-center gap-3 px-3.5 py-2.5 text-[13.5px]"
      style={{ '--tint': 'var(--color-task)' } as never}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Rouvrir « ${task.title} »` : `Terminer « ${task.title} »`}
        onClick={() => toggleTask(task)}
        className={`grid size-[18px] flex-none cursor-pointer place-items-center rounded-md border-[1.5px] transition-all duration-200 ${
          task.done ? 'border-task bg-task' : 'border-ink-3 hover:border-task'
        }`}
      >
        <IconCheck
          className={`size-[11px] text-bg transition-all duration-200 ${
            task.done ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        />
      </button>
      <span className={task.done ? 'text-ink-3 line-through' : ''}>{task.title}</span>
      <button
        type="button"
        onClick={() => void db.tasks.delete(task.id)}
        aria-label={`Supprimer « ${task.title} »`}
        className="ml-auto cursor-pointer rounded-lg px-2 py-1 text-ink-3 transition-colors hover:text-danger"
      >
        ✕
      </button>
    </div>
  )
}

export function TasksPage() {
  const [title, setTitle] = useState('')
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) ?? []
  const pending = tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const done = tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt?.getTime() ?? 0) - (a.doneAt?.getTime() ?? 0))
  const Icon = tasksWidget.icon

  function add() {
    const t = title.trim()
    if (!t) return
    void db.tasks.add({
      id: crypto.randomUUID(),
      title: t,
      done: false,
      createdAt: new Date(),
    })
    setTitle('')
  }

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
            background: 'color-mix(in srgb, var(--color-task) 14%, transparent)',
            color: 'var(--color-task)',
          }}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Tâches</h1>
          <p className="text-sm text-ink-2">
            {pending.length > 0
              ? `${pending.length} à faire · ${done.length} ${done.length > 1 ? 'terminées' : 'terminée'}`
              : 'Écris, appuie sur Entrée, passe à autre chose.'}
          </p>
        </div>
      </div>

      <div className="mt-8 grid max-w-2xl gap-3.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          placeholder="Nouvelle tâche… (Entrée pour ajouter)"
          className="rounded-xl border border-white/[0.075] bg-white/[0.035] px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent/50"
        />

        <div className="flex flex-col gap-1.5">
          {pending.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </div>

        {done.length > 0 && (
          <>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
              Terminées
            </p>
            <div className="flex flex-col gap-1.5">
              {done.slice(0, 10).map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </>
        )}

        <p className="px-2 text-xs text-ink-3">
          À venir : échéances, habitudes avec séries, objectifs.
        </p>
      </div>
    </motion.div>
  )
}
