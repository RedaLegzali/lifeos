import { describe, expect, it } from 'vitest'
import { searchCatalog, serviceCatalog } from './catalog'

describe('bibliothèque de services', () => {
  it('a des ids uniques et des données complètes', () => {
    const ids = serviceCatalog.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of serviceCatalog) {
      expect(s.name.length).toBeGreaterThan(0)
      expect(s.brandColor).toMatch(/^#[0-9a-f]{6}$/)
      expect(s.defaultPriceCents).toBeGreaterThan(0)
    }
  })

  it('trouve par préfixe (« net » → Netflix)', () => {
    expect(searchCatalog('net').some((s) => s.id === 'netflix')).toBe(true)
  })

  it('trouve par mot-clé (« anime » → Crunchyroll)', () => {
    expect(searchCatalog('anime').some((s) => s.id === 'crunchyroll')).toBe(true)
  })

  it('ignore accents et casse (« CINE » ne plante pas, « bein » → beIN)', () => {
    expect(() => searchCatalog('CINÉ')).not.toThrow()
    expect(searchCatalog('bein').some((s) => s.id === 'bein-sports')).toBe(true)
  })

  it('retourne tout le catalogue pour une requête vide', () => {
    expect(searchCatalog('')).toHaveLength(serviceCatalog.length)
  })
})
