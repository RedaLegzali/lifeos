/**
 * Bibliothèque des services d'abonnement populaires.
 *
 * Choix design : monogrammes aux couleurs de marque plutôt que logos
 * officiels — 0 dépendance externe, 0 question de licence, rendu
 * cohérent avec le design system. Les prix sont des valeurs par défaut
 * indicatives (France, 2026) que l'utilisateur ajuste à son offre réelle.
 */

export interface CatalogService {
  id: string
  name: string
  initial: string
  brandColor: string
  brandInk: string
  defaultPriceCents: number
  category: string
  /** Termes de recherche supplémentaires. */
  keywords?: string
}

export const serviceCatalog: CatalogService[] = [
  // Streaming vidéo
  { id: 'netflix', name: 'Netflix', initial: 'N', brandColor: '#e50914', brandInk: '#ffffff', defaultPriceCents: 1349, category: 'Streaming' },
  { id: 'disney-plus', name: 'Disney+', initial: 'D+', brandColor: '#01147c', brandInk: '#ffffff', defaultPriceCents: 899, category: 'Streaming' },
  { id: 'prime-video', name: 'Amazon Prime', initial: 'P', brandColor: '#00a8e1', brandInk: '#0a0b10', defaultPriceCents: 699, category: 'Streaming', keywords: 'video amazon' },
  { id: 'canal-plus', name: 'Canal+', initial: 'C+', brandColor: '#1c1c1e', brandInk: '#ffffff', defaultPriceCents: 2599, category: 'Streaming' },
  { id: 'max', name: 'Max', initial: 'M', brandColor: '#002be7', brandInk: '#ffffff', defaultPriceCents: 999, category: 'Streaming', keywords: 'hbo' },
  { id: 'paramount-plus', name: 'Paramount+', initial: 'P+', brandColor: '#0064ff', brandInk: '#ffffff', defaultPriceCents: 799, category: 'Streaming' },
  { id: 'apple-tv-plus', name: 'Apple TV+', initial: 'tv', brandColor: '#1c1c1e', brandInk: '#ffffff', defaultPriceCents: 999, category: 'Streaming' },
  { id: 'youtube-premium', name: 'YouTube Premium', initial: 'YT', brandColor: '#ff0000', brandInk: '#ffffff', defaultPriceCents: 1299, category: 'Streaming' },
  { id: 'crunchyroll', name: 'Crunchyroll', initial: 'CR', brandColor: '#f47521', brandInk: '#0a0b10', defaultPriceCents: 699, category: 'Streaming', keywords: 'anime manga' },
  { id: 'bein-sports', name: 'beIN Sports', initial: 'bN', brandColor: '#5c2483', brandInk: '#ffffff', defaultPriceCents: 1500, category: 'Sport', keywords: 'foot football' },
  { id: 'dazn', name: 'DAZN', initial: 'DZ', brandColor: '#f8f8f5', brandInk: '#0a0b10', defaultPriceCents: 1999, category: 'Sport', keywords: 'foot football boxe' },

  // Musique
  { id: 'spotify', name: 'Spotify', initial: 'S', brandColor: '#1db954', brandInk: '#0a0b10', defaultPriceCents: 1199, category: 'Musique' },
  { id: 'apple-music', name: 'Apple Music', initial: 'AM', brandColor: '#fa243c', brandInk: '#ffffff', defaultPriceCents: 1099, category: 'Musique' },
  { id: 'deezer', name: 'Deezer', initial: 'DZ', brandColor: '#a238ff', brandInk: '#ffffff', defaultPriceCents: 1199, category: 'Musique' },

  // IA
  { id: 'chatgpt', name: 'ChatGPT', initial: 'G', brandColor: '#10a37f', brandInk: '#ffffff', defaultPriceCents: 2299, category: 'IA', keywords: 'openai gpt' },
  { id: 'claude', name: 'Claude', initial: 'C', brandColor: '#d97757', brandInk: '#0a0b10', defaultPriceCents: 2160, category: 'IA', keywords: 'anthropic' },
  { id: 'gemini', name: 'Gemini', initial: 'Ge', brandColor: '#4285f4', brandInk: '#ffffff', defaultPriceCents: 2199, category: 'IA', keywords: 'google' },

  // Gaming
  { id: 'ps-plus', name: 'PlayStation Plus', initial: 'PS', brandColor: '#0070d1', brandInk: '#ffffff', defaultPriceCents: 899, category: 'Gaming', keywords: 'sony psn' },
  { id: 'game-pass', name: 'Xbox Game Pass', initial: 'X', brandColor: '#107c10', brandInk: '#ffffff', defaultPriceCents: 1299, category: 'Gaming', keywords: 'microsoft' },
  { id: 'nintendo-online', name: 'Nintendo Switch Online', initial: 'NS', brandColor: '#e60012', brandInk: '#ffffff', defaultPriceCents: 399, category: 'Gaming', keywords: 'switch' },

  // Cloud & productivité
  { id: 'icloud', name: 'iCloud+', initial: 'iC', brandColor: '#147efb', brandInk: '#ffffff', defaultPriceCents: 299, category: 'Cloud', keywords: 'apple stockage' },
  { id: 'google-one', name: 'Google One', initial: 'G1', brandColor: '#4285f4', brandInk: '#ffffff', defaultPriceCents: 199, category: 'Cloud', keywords: 'drive stockage' },
  { id: 'dropbox', name: 'Dropbox', initial: 'Db', brandColor: '#0061ff', brandInk: '#ffffff', defaultPriceCents: 1199, category: 'Cloud' },
  { id: 'notion', name: 'Notion', initial: 'No', brandColor: '#1c1c1e', brandInk: '#ffffff', defaultPriceCents: 950, category: 'Productivité' },
  { id: 'microsoft-365', name: 'Microsoft 365', initial: 'M3', brandColor: '#d83b01', brandInk: '#ffffff', defaultPriceCents: 1000, category: 'Productivité', keywords: 'office word excel' },
  { id: 'adobe-cc', name: 'Adobe Creative Cloud', initial: 'Ae', brandColor: '#fa0f00', brandInk: '#ffffff', defaultPriceCents: 6799, category: 'Productivité', keywords: 'photoshop premiere' },
  { id: 'linkedin-premium', name: 'LinkedIn Premium', initial: 'in', brandColor: '#0a66c2', brandInk: '#ffffff', defaultPriceCents: 3999, category: 'Carrière' },
]

/** Recherche simple, insensible aux accents et à la casse. */
export function searchCatalog(query: string): CatalogService[] {
  const q = normalize(query)
  if (!q) return serviceCatalog
  return serviceCatalog.filter((s) =>
    normalize(`${s.name} ${s.category} ${s.keywords ?? ''}`).includes(q),
  )
}

function normalize(s: string): string {
  // NFD sépare les accents (é → e + ́) puis on retire les diacritiques.
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
