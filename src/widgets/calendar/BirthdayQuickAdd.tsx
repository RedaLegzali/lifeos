import { useRef, useState } from 'react'
import type { Person } from '@/lib/db'
import { monthNames } from '@/pages/onboarding/drafts'

/**
 * Saisie ultra-rapide d'un anniversaire : un clic sur le lien de
 * parenté pré-remplit le prénom, deux sélecteurs, « Ajouter » —
 * moins de 10 secondes par personne, enchaînable sans navigation.
 * Réutilisé par l'onboarding ET la page Semaine.
 */

const RELATIONS = ['Papa', 'Maman', 'Frère', 'Sœur', 'Conjoint·e', 'Ami·e', 'Autre']

const inputCls =
  'rounded-xl border border-white/[0.075] bg-white/[0.035] px-3.5 py-2 text-[13.5px] text-ink outline-none transition-colors focus:border-accent/50 placeholder:text-ink-3'

export function BirthdayQuickAdd({ onAdd }: { onAdd: (p: Person) => void }) {
  const [active, setActive] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [day, setDay] = useState(1)
  const [month, setMonth] = useState(1)
  const [year, setYear] = useState('')
  const [gift, setGift] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  function open(relation: string) {
    setActive(relation)
    setName(relation === 'Autre' ? '' : relation)
    // Laisse le formulaire se monter avant de focaliser.
    requestAnimationFrame(() => nameRef.current?.focus())
  }

  function reset() {
    setActive(null)
    setName('')
    setYear('')
    setGift('')
  }

  function add() {
    if (!name.trim()) return
    const parsedYear = Number.parseInt(year, 10)
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      birthDay: day,
      birthMonth: month,
      birthYear: Number.isFinite(parsedYear) ? parsedYear : undefined,
      giftIdeas: gift.trim() || undefined,
    })
    reset()
  }

  if (active === null) {
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {RELATIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => open(r)}
              className="cursor-pointer rounded-full border border-white/[0.075] bg-white/[0.035] px-4 py-2 text-[13px] font-medium text-ink-2 transition-all hover:border-week/40 hover:bg-week/10 hover:text-ink"
            >
              + {r}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-3">
          Un clic, une date, c'est ajouté — enchaîne toute la famille.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4" style={{ '--tint': 'var(--color-week)' } as never}>
      <div className="flex flex-wrap gap-2">
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          placeholder="Prénom"
          className={`${inputCls} min-w-36 flex-1`}
        />
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          aria-label="Jour"
          className={`${inputCls} cursor-pointer`}
        >
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          aria-label="Mois"
          className={`${inputCls} cursor-pointer`}
        >
          {monthNames.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Année (opt.)"
          inputMode="numeric"
          className={`${inputCls} w-28`}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={gift}
          onChange={(e) => setGift(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          placeholder="Idée cadeau (optionnel)"
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-xl px-3 py-2 text-[13px] text-ink-3 transition-colors hover:text-ink"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          className="cursor-pointer rounded-xl bg-week/90 px-4 py-2 text-[13px] font-semibold text-bg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>
    </div>
  )
}
