import { useLiveQuery } from 'dexie-react-hooks'
import type { WidgetManifest } from '@/core/widgets/types'
import { IconCheck } from '@/design/icons'
import { db } from '@/lib/db'
import { lazy } from 'react'

const TasksCard = lazy(async () => ({ default: (await import('./TasksCard')).TasksCard }))
const TasksPage = lazy(async () => ({ default: (await import('./TasksPage')).TasksPage }))

export const tasksWidget: WidgetManifest = {
  id: 'tasks',
  title: 'Tâches',
  route: '/taches',
  tint: 'var(--color-task)',
  icon: IconCheck,
  span: 2,
  description: 'Todo, habitudes et objectifs.',
  planned: [
    'Échéances et rappels',
    'Habitudes avec suivi de série',
    'Objectifs long terme',
  ],
  Card: TasksCard,
  Page: TasksPage,
  useBriefItems: () => {
    const pending =
      useLiveQuery(() => db.tasks.filter((t) => !t.done).count(), []) ?? 0
    if (pending === 0) return []
    return [
      {
        id: 'brief-tasks',
        emoji: '✅',
        text: (
          <>
            <b>
              {pending} {pending > 1 ? 'tâches' : 'tâche'}
            </b>{' '}
            en attente
          </>
        ),
        priority: 7,
      },
    ]
  },
  getSearchItems: async () => {
    const tasks = await db.tasks.toArray()
    return tasks
      .filter((t) => !t.done)
      .map((t) => ({
        id: `task-${t.id}`,
        group: 'Tâches',
        emoji: '✅',
        title: t.title,
        route: '/taches',
        keywords: 'tâche todo',
      }))
  },
}
