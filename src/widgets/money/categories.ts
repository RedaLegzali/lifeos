import type { RawTransaction } from './import/parseSG'

/**
 * Normalisation des libellés et catégorisation.
 *
 * Les banques écrivent « CARTE X4069 17/06 UBER *EATS 0,82 EUR PAYS-BAS » :
 * l'essentiel du travail est de retrouver le marchand là-dedans. Les règles
 * sont ordonnées — la première qui correspond gagne, donc les cas
 * particuliers (COFIDIS AMAZON, AMAZON PRIME) précèdent les cas généraux.
 */

const MERCHANT_RULES: [RegExp, string][] = [
  // Salaires : libellés génériques employés par les banques françaises.
  // Le nom de l'employeur n'a rien à faire ici — il sera reconnu par une
  // règle utilisateur, comme n'importe quel virement récurrent.
  [/\bSALAIRE\b|\bPAIE\b|\bREMUNERATION\b|VIR\s+SALAIRE/, 'Salaire'],
  [/COFIDIS|CETELEM|SOFINCO|YOUNITED/, 'Crédit à la consommation'],
  [/UBER ?EATS/, 'Uber Eats'],
  [/UBER ?ONE/, 'Uber One'],
  [/UBER/, 'Uber'],
  [/DELIVEROO/, 'Deliveroo'],
  [/JUST ?EAT/, 'Just Eat'],
  [/HELLOFRESH/, 'HelloFresh'],
  [/AMAZON PRIME/, 'Amazon Prime'],
  [/AMZN|AMAZON/, 'Amazon'],
  [/NETFLIX/, 'Netflix'],
  [/SPOTIFY/, 'Spotify'],
  [/DEEZER/, 'Deezer'],
  [/DISNEY/, 'Disney+'],
  [/CANAL\+|CANALPLUS/, 'Canal+'],
  [/APPLE/, 'Apple'],
  [/GOOGLE/, 'Google'],
  [/OPENAI|CHATGPT/, 'ChatGPT'],
  [/ANTHROPIC/, 'Claude'],
  [/PLAYSTATION|SONY ?INT/, 'PlayStation'],
  [/STEAM|VALVE/, 'Steam'],
  [/NINTENDO/, 'Nintendo'],
  [/BETCLIC|WINAMAX|UNIBET|PMU/, 'Paris sportifs'],
  [/NAVIGO|IDF ?MOBILITES|RATP|SNCF/, 'Navigo / Transport IDF'],
  [/BOLT/, 'Bolt'],
  [/FREE ?MOBILE/, 'Free Mobile'],
  [/ORANGE/, 'Orange'],
  [/BOUYGUES/, 'Bouygues'],
  [/SFR/, 'SFR'],
  [/EDF|ENGIE|TOTALENERGIES/, 'Énergie'],
  [/CARREFOUR|CARREFMARKET/, 'Carrefour'],
  [/FRANPRIX/, 'Franprix'],
  [/MONOPRIX/, 'Monoprix'],
  [/INTERMARCHE/, 'Intermarché'],
  [/LECLERC/, 'Leclerc'],
  [/AUCHAN/, 'Auchan'],
  [/LIDL/, 'Lidl'],
  [/PICARD/, 'Picard'],
  [/ZARA/, 'Zara'],
  [/DECATHLON/, 'Decathlon'],
  [/FNAC/, 'Fnac'],
  [/UNIQLO|H&M|SHEIN|VINTED/, 'Vêtements'],
  [/MCDO|MCDONALD/, 'McDonald’s'],
  [/BURGER ?KING/, 'Burger King'],
  [/KFC/, 'KFC'],
  [/STARBUCKS/, 'Starbucks'],
  [/PHARMACIE/, 'Pharmacie'],
  [/DOCTOLIB|MEDECIN|LABORATOIRE|DENTAIRE/, 'Santé'],
  [/MUTUELLE|SOGESSUR|ASSURANCE/, 'Assurance'],
  [/TABAC/, 'Tabac'],
  [/FRAIS PAIEMENT HORS ZONE EURO/, 'Frais de change'],
  [/COTIS|FRAIS|COMMISSION/, 'Frais bancaires'],
  [/RETRAIT|DAB/, 'Retrait espèces'],
]

const CATEGORY_RULES: [string, RegExp][] = [
  ['Logement', /^Loyer$|Énergie/],
  ['Livraison de repas', /Uber Eats|Deliveroo|Just Eat|HelloFresh/],
  ['Crédits en cours', /Crédit à la consommation/],
  [
    'Abonnements',
    /Netflix|Spotify|Deezer|Disney\+|Canal\+|Apple|Google|ChatGPT|Claude|Amazon Prime|Uber One|Navigo|Orange|Free Mobile|SFR|Bouygues/,
  ],
  ['Transport', /^Uber$|Bolt/],
  ['Courses', /Carrefour|Franprix|Monoprix|Intermarché|Leclerc|Auchan|Lidl|Picard/],
  [
    'Restaurants & bars',
    /McDonald|Burger King|KFC|Starbucks|Tabac|RESTAU|BRASSERIE|PIZZ|SUSHI|KEBAB|BOULANG|CAFE/i,
  ],
  ['Shopping', /Amazon$|Zara|Decathlon|Fnac|Vêtements/],
  ['Jeux vidéo', /PlayStation|Steam|Nintendo/],
  ['Paris sportifs', /Paris sportifs/],
  ['Santé', /Pharmacie|Santé|Assurance/],
  ['Retraits espèces', /Retrait espèces/],
  ['Virements à des proches', /^Virement · /],
  ['Frais bancaires', /Frais bancaires|Frais de change/],
  ['Revenus', /^Salaire$/],
]

/** Extrait la contrepartie d'un virement (« POUR: … » / « DE: … »). */
function transferParty(raw: string): string | null {
  const pour = /POUR:\s*([^|]+?)(?:\s*\||\s*IBAN|\s*\d{2} \d{2}|$)/.exec(raw)?.[1]
  const de = /DE:\s*([^|]+?)(?:\s*\||\s*DATE|\s*MOTIF|$)/.exec(raw)?.[1]
  return (pour ?? de)?.trim() ?? null
}

export interface Classified {
  merchant: string
  category: string
  /** Virement entre comptes du même titulaire : hors statistiques. */
  excluded: boolean
}

/**
 * `ownerName` permet de reconnaître les virements que l'utilisateur se fait
 * à lui-même — ce ne sont pas des dépenses et ils fausseraient tout.
 */
export function classify(t: RawTransaction, ownerName = ''): Classified {
  const raw = `${t.label} ${t.detail}`
  const normalized = raw
    .toUpperCase()
    .replace(/CARTE X\d+/g, '')
    .replace(/\bREF:\s*\S+/g, '')
    .replace(/IBAN:\s*\S+/g, '')
    .replace(/\b\d{6,}\b/g, '')
    .replace(/[*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  for (const [re, name] of MERCHANT_RULES) {
    if (re.test(normalized)) return withCategory(name)
  }

  const party = transferParty(raw)
  if (party) {
    const owner = ownerName.trim().toUpperCase()
    if (owner && party.toUpperCase().includes(owner)) {
      return { merchant: 'Transfert interne', category: 'Transferts internes', excluded: true }
    }
    const clean = party.replace(/^(M\.|MME\.?|MLLE\.?|MR\.?)\s+/i, '').trim()
    return withCategory(`Virement · ${clean.split(' ').slice(0, 2).join(' ')}`)
  }

  if (/PRELEVEMENT|PRLV/.test(normalized)) return withCategory('Prélèvement divers')

  const fallback = normalized
    .replace(/^(COMMERCE ELECTRONIQUE|EUR|FRANCE|\d{2}\/\d{2})\s*/g, '')
    .split(' ')
    .slice(0, 3)
    .join(' ')
  return withCategory(titleCase(fallback) || 'Non catégorisé')
}

function withCategory(merchant: string): Classified {
  const category = CATEGORY_RULES.find(([, re]) => re.test(merchant))?.[0] ?? 'Autres'
  return { merchant, category, excluded: false }
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/** Teinte associée à chaque catégorie, pour les graphiques. */
export const CATEGORY_TINT: Record<string, string> = {
  Logement: '#f87b8e',
  'Livraison de repas': '#ff6b6e',
  Abonnements: '#f5b65c',
  'Crédits en cours': '#8b93ff',
  Transport: '#63b3f6',
  Courses: '#5de3a6',
  'Restaurants & bars': '#f87b8e',
  Shopping: '#f5b65c',
  'Jeux vidéo': '#a78bfa',
  'Paris sportifs': '#ff6b6e',
  Santé: '#5de3a6',
  'Retraits espèces': '#9ba0b4',
  'Virements à des proches': '#8b93ff',
  'Frais bancaires': '#5d6275',
  Revenus: '#5de3a6',
  Autres: '#5d6275',
}
