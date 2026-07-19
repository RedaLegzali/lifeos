/**
 * Formatage centralisé — tout montant est stocké en CENTIMES (entier)
 * pour éviter les erreurs d'arrondi en virgule flottante.
 */

const euroFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

const euroFmtRounded = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** 1349 → « 13,49 € » */
export function formatCents(cents: number): string {
  return euroFmt.format(cents / 100)
}

/** 124700 → « 1 247 € » (montants agrégés, sans décimales) */
export function formatCentsRounded(cents: number): string {
  return euroFmtRounded.format(Math.round(cents / 100))
}

/** « samedi » → « Samedi » */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
