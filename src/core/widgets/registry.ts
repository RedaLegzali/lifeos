import type { WidgetManifest } from './types'
import { calendarWidget } from '@/widgets/calendar/manifest'
import { moneyWidget } from '@/widgets/money/manifest'
import { subscriptionsWidget } from '@/widgets/subscriptions/manifest'
import { gamingWidget } from '@/widgets/gaming/manifest'
import { tasksWidget } from '@/widgets/tasks/manifest'

/**
 * Registre central des widgets.
 * Ajouter un widget = créer son dossier sous `src/widgets/` puis
 * l'importer ici. Rien d'autre à toucher : navigation, accueil,
 * recherche et réglages se mettent à jour automatiquement.
 */
export const widgets: WidgetManifest[] = [
  calendarWidget,
  moneyWidget,
  subscriptionsWidget,
  gamingWidget,
  tasksWidget,
]

export function getWidget(id: string): WidgetManifest | undefined {
  return widgets.find((w) => w.id === id)
}
