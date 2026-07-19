import type { ComponentType, ReactNode } from 'react'
import type { IconProps } from '@/design/icons'

/**
 * Contrat d'un widget LifeOS.
 *
 * Un widget est un module 100 % autonome sous `src/widgets/<id>/` :
 * il fournit sa carte d'accueil, ses signaux pour le brief du matin
 * et ses entités pour la recherche globale. L'ajouter ou le retirer
 * se résume à une ligne dans le registre (`registry.ts`).
 */

/** Un signal du brief du matin (« Netflix débite demain »). */
export interface BriefItem {
  id: string
  emoji: string
  /** Contenu de la ligne — utiliser <b> pour les segments importants. */
  text: ReactNode
  /** Valeur alignée à droite : date, montant, heure… */
  when?: string
  /** Ordre d'affichage : plus petit = plus haut. */
  priority: number
}

/** Un évènement daté exposé par un widget (prélèvement, anniversaire…). */
export interface CalendarEvent {
  id: string
  label: string
  date: Date
  /** Heure « HH:MM » si horodaté. */
  time?: string
  emoji?: string
  /** Token CSS de la teinte (pastilles, barres). */
  tint: string
}

/** Une entité exposée à la recherche globale (⌘K). */
export interface SearchItem {
  id: string
  /** Groupe affiché dans la palette : « Abonnements », « Personnes »… */
  group: string
  emoji: string
  title: string
  /** Détail aligné à droite : prix, date, durée… */
  meta?: string
  /** Route ouverte quand on sélectionne le résultat. */
  route: string
  /** Termes supplémentaires pour la correspondance (synonymes…). */
  keywords?: string
}

export interface WidgetManifest {
  /** Identifiant stable, kebab-case — sert de clé partout. */
  id: string
  title: string
  /** Route de la page dédiée, ex. « /argent ». */
  route: string
  /** Teinte du widget — référence un token CSS (« var(--color-money) »). */
  tint: string
  icon: ComponentType<IconProps>
  /** Largeur sur la grille d'accueil (6 colonnes au total). */
  span: 2 | 3 | 6
  /** Une phrase : ce que fait le widget. */
  description: string
  /** Fonctionnalités prévues — affichées sur la page en construction. */
  planned: string[]
  /** Carte compacte affichée sur l'accueil. */
  Card: ComponentType
  /**
   * Page dédiée du widget. Absente → page « programme » générique
   * (WidgetPage) tant que le module n'est pas développé.
   */
  Page?: ComponentType
  /**
   * Évènements datés du widget, agrégés par le widget Semaine.
   * Même règle que useBriefItems : hook appelé dans un ordre stable.
   */
  useCalendarEvents?: () => CalendarEvent[]
  /**
   * Signaux du widget pour le brief du matin.
   * C'est un HOOK React (peut utiliser useLiveQuery pour des données
   * réactives). Contrainte : il est appelé pour TOUS les widgets du
   * registre dans un ordre stable — le registre ne change jamais au
   * runtime, la règle des hooks est donc respectée.
   */
  useBriefItems?: () => BriefItem[]
  /**
   * Entités du widget pour la recherche globale.
   * Peut être asynchrone (lecture IndexedDB) — l'index est reconstruit
   * à chaque ouverture de la palette.
   */
  getSearchItems?: () => SearchItem[] | Promise<SearchItem[]>
}
