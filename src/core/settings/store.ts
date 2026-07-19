import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Préférences utilisateur — persistées dans localStorage.
 *
 * Choix technique : les préférences (petites, synchrones, lues au premier
 * rendu) vivent dans localStorage via zustand/persist ; les DONNÉES
 * métier (abonnements, personnes, dépenses…) vivent dans IndexedDB
 * (Dexie), mieux adapté aux volumes et aux requêtes.
 */
interface SettingsState {
  userName: string
  /** L'assistant de première utilisation a-t-il été terminé ? */
  onboarded: boolean
  /** Ids des widgets masqués sur l'accueil. */
  hiddenWidgets: string[]
  /** Ordre d'affichage des widgets (ids) — les absents vont à la fin. */
  widgetOrder: string[]
  setUserName: (name: string) => void
  setOnboarded: (v: boolean) => void
  toggleWidget: (id: string) => void
  setWidgetOrder: (order: string[]) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      userName: '',
      onboarded: false,
      hiddenWidgets: [],
      widgetOrder: [],
      setUserName: (userName) => set({ userName }),
      setOnboarded: (onboarded) => set({ onboarded }),
      toggleWidget: (id) =>
        set((s) => ({
          hiddenWidgets: s.hiddenWidgets.includes(id)
            ? s.hiddenWidgets.filter((x) => x !== id)
            : [...s.hiddenWidgets, id],
        })),
      setWidgetOrder: (widgetOrder) => set({ widgetOrder }),
    }),
    { name: 'lifeos.settings' },
  ),
)

/** Trie une liste de widgets selon l'ordre sauvegardé. */
export function applyWidgetOrder<T extends { id: string }>(
  widgets: T[],
  order: string[],
): T[] {
  if (order.length === 0) return widgets
  const rank = new Map(order.map((id, i) => [id, i]))
  return [...widgets].sort(
    (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
  )
}
