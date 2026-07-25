import { useLiveQuery } from 'dexie-react-hooks'
import { getKV, setKV } from '@/lib/db'

/**
 * Règles de catégorisation de l'utilisateur.
 *
 * L'app ne peut pas deviner qu'un virement mensuel à une personne est un
 * loyer, ni qu'un commerçant inconnu est une pharmacie. L'utilisateur
 * réaffecte un marchand à une catégorie, et la règle s'applique
 * rétroactivement à tout l'historique — sans réimporter quoi que ce soit.
 */

const KEY = 'money.categoryOverrides'

export type CategoryOverrides = Record<string, string>

/** Catégories proposées à la réaffectation. */
export const ALL_CATEGORIES = [
  'Logement',
  'Courses',
  'Livraison de repas',
  'Restaurants & bars',
  'Transport',
  'Abonnements',
  'Crédits en cours',
  'Shopping',
  'Santé',
  'Jeux vidéo',
  'Paris sportifs',
  'Retraits espèces',
  'Virements à des proches',
  'Frais bancaires',
  'Revenus',
  'Autres',
] as const

export async function loadOverrides(): Promise<CategoryOverrides> {
  return getKV<CategoryOverrides>(KEY, {})
}

export async function setOverride(merchant: string, category: string): Promise<void> {
  const current = await loadOverrides()
  await setKV(KEY, { ...current, [merchant]: category })
}

export async function clearOverride(merchant: string): Promise<void> {
  const current = await loadOverrides()
  delete current[merchant]
  await setKV(KEY, current)
}

/** Réactif : la grille se recalcule dès qu'une règle change. */
export function useOverrides(): CategoryOverrides {
  return useLiveQuery(async () => loadOverrides(), [], {} as CategoryOverrides)
}
