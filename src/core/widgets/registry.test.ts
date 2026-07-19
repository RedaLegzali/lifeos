import { describe, expect, it } from 'vitest'
import { widgets } from './registry'

describe('registre des widgets', () => {
  it('contient au moins les 5 widgets de la V1', () => {
    const ids = widgets.map((w) => w.id)
    expect(ids).toEqual(
      expect.arrayContaining(['week', 'money', 'subscriptions', 'gaming', 'tasks']),
    )
  })

  it('a des ids uniques', () => {
    const ids = widgets.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('a des routes uniques commençant par « / »', () => {
    const routes = widgets.map((w) => w.route)
    expect(new Set(routes).size).toBe(routes.length)
    for (const route of routes) expect(route).toMatch(/^\/[a-z-]+$/)
  })

  it('fournit une carte et une teinte pour chaque widget', () => {
    for (const w of widgets) {
      // Composant classique (fonction) ou React.lazy (objet exotique).
      expect(['function', 'object']).toContain(typeof w.Card)
      expect(w.Card).toBeTruthy()
      expect(w.tint).toMatch(/^var\(--color-[a-z-]+\)$/)
      expect([2, 3, 6]).toContain(w.span)
    }
  })
})
