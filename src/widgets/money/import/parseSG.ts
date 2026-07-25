/**
 * Parseur de relevés PDF Société Générale.
 *
 * Le tableau d'opérations n'a pas de structure sémantique dans le PDF :
 * on reconstitue les lignes par position verticale, puis on distingue
 * débit et crédit par la position HORIZONTALE du montant, comparée à
 * celle des en-têtes « Débit » et « Crédit ».
 *
 * Ce parseur a été validé au centime près contre les totaux imprimés
 * (« TOTAUX DES MOUVEMENTS ») de cinq relevés réels — c'est ce contrôle
 * que `checks` restitue à l'appelant.
 */

export interface RawTransaction {
  date: string
  label: string
  detail: string
  cents: number
  kind: 'debit' | 'credit'
}

/** Contrôle d'un relevé : totaux recalculés vs totaux imprimés. */
export interface StatementCheck {
  debit: number
  credit: number
  officialDebit: number
  officialCredit: number
  valid: boolean
}

export interface ParseResult {
  transactions: RawTransaction[]
  checks: StatementCheck[]
  /** true si chaque relevé du fichier tombe juste au centime. */
  valid: boolean
}

// SG écrit les milliers avec un point ou une espace : « 2.802,89 », « 2 802,89 ».
const AMOUNT = /^\d{1,3}(?:[\s.]\d{3})*,\d{2}$/
const DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/

const NOISE =
  /^(RELEVÉ|COMPTE|Date Valeur|n°|du \d|envoi|suite|Société Générale|S\.A\.|29, bd|Pour toute|1\.|2\.|En dernier|RA\d|Depuis l'étranger|VOS CONTACTS|Votre |M\. |par |sur |Code client|PSJ)/

export function toCents(s: string): number {
  return Math.round(Number(s.replace(/[\s.]/g, '').replace(',', '.')) * 100)
}

interface Item {
  x: number
  s: string
}

/** Charge pdfjs à la demande : ~350 Ko qui ne pèsent pas sur le démarrage. */
async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
}

export async function parseSGStatement(file: File): Promise<ParseResult> {
  const pdfjs = await loadPdfjs()
  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise

  const transactions: RawTransaction[] = []
  const checks: StatementCheck[] = []
  let pageDebit = 0
  let pageCredit = 0

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()

    // Regroupe les fragments de texte par ligne (position Y arrondie).
    const rows = new Map<number, Item[]>()
    for (const item of content.items) {
      if (!('str' in item)) continue
      const s = item.str.trim()
      if (!s) continue
      const y = Math.round(item.transform[5])
      const list = rows.get(y) ?? []
      list.push({ x: item.transform[4], s })
      rows.set(y, list)
    }

    const ordered = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => items.sort((a, b) => a.x - b.x))

    // Position des colonnes Débit / Crédit, lue sur l'en-tête du tableau.
    let midX: number | null = null
    for (const items of ordered) {
      const d = items.find((i) => i.s === 'Débit')
      const c = items.find((i) => i.s === 'Crédit')
      if (d && c) {
        midX = (d.x + c.x) / 2
        break
      }
    }
    if (midX === null) continue

    let current: RawTransaction | null = null
    for (const items of ordered) {
      const text = items.map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim()

      // Ligne de contrôle imprimée en fin de relevé.
      if (text.startsWith('TOTAUX DES MOUVEMENTS')) {
        const amounts = items.filter((i) => AMOUNT.test(i.s))
        if (amounts.length >= 2) {
          const officialDebit = toCents(amounts[0]!.s)
          const officialCredit = toCents(amounts[1]!.s)
          checks.push({
            debit: pageDebit,
            credit: pageCredit,
            officialDebit,
            officialCredit,
            valid: pageDebit === officialDebit && pageCredit === officialCredit,
          })
          pageDebit = 0
          pageCredit = 0
        }
        current = null
        continue
      }
      if (/^(SOLDE|NOUVEAU SOLDE)/.test(text)) {
        current = null
        continue
      }

      const first = items[0]
      const dateMatch = first ? DATE.exec(first.s) : null

      if (dateMatch) {
        const amountItem = [...items].reverse().find((i) => AMOUNT.test(i.s))
        if (!amountItem) {
          current = null
          continue
        }
        const cents = toCents(amountItem.s)
        const kind = amountItem.x < midX ? 'debit' : 'credit'
        if (kind === 'debit') pageDebit += cents
        else pageCredit += cents

        current = {
          date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`,
          label: items
            .filter((i) => i !== amountItem && !DATE.test(i.s))
            .map((i) => i.s)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
          detail: '',
          cents,
          kind,
        }
        transactions.push(current)
      } else if (current && text && !NOISE.test(text) && text.length < 200) {
        // Ligne de continuation : détail de l'opération précédente.
        current.detail += (current.detail ? ' | ' : '') + text
      }
    }
  }

  return {
    transactions,
    checks,
    valid: checks.length > 0 && checks.every((c) => c.valid),
  }
}

/** Reconnaît un relevé SG à sa première page. */
export function isLikelySG(text: string): boolean {
  return /Société Générale|RELEVÉ DE COMPTE/i.test(text)
}
