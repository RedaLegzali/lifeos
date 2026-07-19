import { describe, expect, it } from 'vitest'
import { coachSuggestions } from './coach'
import { widgets } from '@/core/widgets/registry'

describe('coach', () => {
  it('a des étapes uniques, dans un ordre pensé (proches → abos → tâches)', () => {
    const ids = coachSuggestions.map((s) => s.id)
    expect(ids).toEqual(['people', 'subscriptions', 'tasks'])
  })

  it("chaque suggestion pointe vers la page d'un widget existant", () => {
    const routes = new Set(widgets.map((w) => w.route))
    for (const s of coachSuggestions) {
      expect(routes.has(s.route)).toBe(true)
    }
  })

  it('ne suggère que des actions réellement possibles (widget avec vraie page)', () => {
    for (const s of coachSuggestions) {
      const widget = widgets.find((w) => w.route === s.route)
      expect(widget?.Page, `${s.id} → ${s.route} doit avoir une vraie page`).toBeDefined()
    }
  })
})
