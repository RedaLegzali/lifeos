import Fuse from 'fuse.js'
import { widgets } from '@/core/widgets/registry'
import type { SearchItem } from '@/core/widgets/types'

/**
 * Recherche globale (⌘K).
 *
 * Chaque widget expose ses entités via `getSearchItems()` ; on y ajoute
 * les commandes de navigation. L'index Fuse est reconstruit à l'ouverture
 * de la palette — trivial tant que le volume reste faible ; on passera à
 * un index incrémental si le besoin apparaît (Expert Performance).
 */

/** Commandes de navigation, dérivées automatiquement du registre. */
export function navigationCommands(): SearchItem[] {
  return [
    ...widgets.map((w) => ({
      id: `nav-${w.id}`,
      group: 'Navigation',
      emoji: '↗️',
      title: `Ouvrir ${w.title}`,
      route: w.route,
      keywords: `aller page ${w.id}`,
    })),
    {
      id: 'nav-settings',
      group: 'Navigation',
      emoji: '⚙️',
      title: 'Ouvrir les Réglages',
      route: '/reglages',
      keywords: 'paramètres préférences options',
    },
  ]
}

export async function collectSearchItems(): Promise<SearchItem[]> {
  const perWidget = await Promise.all(widgets.map((w) => w.getSearchItems?.() ?? []))
  return [...perWidget.flat(), ...navigationCommands()]
}

export function createSearchIndex(items: SearchItem[]) {
  return new Fuse(items, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'keywords', weight: 1 },
      { name: 'meta', weight: 0.5 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
  })
}

export function runSearch(index: Fuse<SearchItem>, query: string): SearchItem[] {
  const q = query.trim()
  if (!q) return []
  return index.search(q, { limit: 12 }).map((r) => r.item)
}

/** Suggestions affichées quand la palette est vide. */
export function defaultSuggestions(): SearchItem[] {
  return navigationCommands().slice(0, 5)
}
