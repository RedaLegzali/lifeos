import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { db } from '@/lib/db'
import { useSettings } from '@/core/settings/store'
import { searchCatalog } from '@/widgets/subscriptions/catalog'
import { BirthdayQuickAdd } from '@/widgets/week/BirthdayQuickAdd'
import { formatCents } from '@/lib/format'
import {
  draftFromService,
  monthNames,
  parsePriceInput,
  type PersonDraft,
  type SubscriptionDraft,
} from './drafts'

/**
 * Assistant de première utilisation — 4 étapes, tout est optionnel
 * sauf le prénom. Relançable depuis les Réglages (pré-rempli avec
 * les données existantes ; l'enregistrement REMPLACE les tables).
 */

const STEPS = ['Bienvenue', 'Anniversaires', 'Abonnements', 'Prêt'] as const

const inputCls =
  'rounded-xl border border-white/[0.075] bg-white/[0.035] px-3.5 py-2 text-[13.5px] text-ink outline-none transition-colors focus:border-accent/50 placeholder:text-ink-3'

export function OnboardingPage() {
  const { userName, setUserName, setOnboarded } = useSettings()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(userName)
  const [people, setPeople] = useState<PersonDraft[]>([])
  const [subs, setSubs] = useState<SubscriptionDraft[]>([])
  const [saving, setSaving] = useState(false)

  // Relance depuis les Réglages : pré-remplit avec l'existant.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [existingPeople, existingSubs] = await Promise.all([
        db.people.toArray(),
        db.subscriptions.toArray(),
      ])
      if (cancelled) return
      setPeople(existingPeople)
      setSubs(
        existingSubs.map((s) => ({
          ...s,
          priceInput: (s.priceCents / 100).toFixed(2).replace('.', ','),
        })),
      )
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function finish() {
    setSaving(true)
    setUserName(name.trim())
    await db.transaction('rw', db.people, db.subscriptions, async () => {
      await db.people.clear()
      await db.people.bulkAdd(people)
      await db.subscriptions.clear()
      await db.subscriptions.bulkAdd(
        subs.map(({ priceInput, ...s }) => ({
          ...s,
          priceCents: parsePriceInput(priceInput) ?? s.priceCents,
        })),
      )
    })
    setOnboarded(true)
  }

  const canContinue = step !== 0 || name.trim().length > 0

  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-10">
      {/* Progression */}
      <div className="flex items-center gap-2" aria-label={`Étape ${step + 1} sur 4`}>
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-accent' : i < step ? 'w-1.5 bg-accent/50' : 'w-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="flex w-full max-w-xl flex-1 flex-col justify-center py-8">
        {/* Entrée animée, sortie instantanée : jamais bloquant, même si
            l'onglet est throttlé (pas d'AnimatePresence mode="wait"). */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {step === 0 && <StepWelcome name={name} setName={setName} />}
          {step === 1 && <StepBirthdays people={people} setPeople={setPeople} />}
          {step === 2 && <StepSubscriptions subs={subs} setSubs={setSubs} />}
          {step === 3 && <StepDone name={name} people={people} subs={subs} />}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex w-full max-w-xl items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="cursor-pointer rounded-xl border border-white/[0.075] bg-white/[0.035] px-4 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-white/[0.06]"
          >
            Retour
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          {(step === 1 || step === 2) && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="cursor-pointer rounded-xl px-3 py-2 text-[13px] text-ink-3 transition-colors hover:text-ink"
            >
              Plus tard
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
              className="cursor-pointer rounded-xl bg-accent px-5 py-2 text-[13px] font-semibold text-bg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void finish()}
              className="cursor-pointer rounded-xl bg-accent px-5 py-2 text-[13px] font-semibold text-bg transition-all hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Ouverture…' : 'Ouvrir LifeOS'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Étape 0 — Bienvenue ---------- */

function StepWelcome({ name, setName }: { name: string; setName: (v: string) => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-[20px] bg-gradient-to-br from-accent via-[#c58bfa] to-week text-[28px] font-bold text-bg shadow-[0_10px_40px_rgb(139_147_255/40%)]">
        L
      </div>
      <h1 className="mt-6 text-balance text-[34px] font-bold tracking-[-0.03em]">
        Bienvenue dans LifeOS
      </h1>
      <p className="mt-2 text-[15px] text-ink-2">
        Construisons ton espace personnel. Deux minutes, promis.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ton prénom"
        autoFocus
        className={`${inputCls} mt-8 w-64 py-3 text-center text-base`}
      />
      <p className="mt-3 text-xs text-ink-3">
        Tout reste sur cette machine. Aucun compte, aucun serveur.
      </p>
    </div>
  )
}

/* ---------- Étape 1 — Anniversaires ---------- */

function StepBirthdays({
  people,
  setPeople,
}: {
  people: PersonDraft[]
  setPeople: (p: PersonDraft[]) => void
}) {
  return (
    <div>
      <h2 className="text-[26px] font-bold tracking-[-0.02em]">🎂 Les anniversaires</h2>
      <p className="mt-1.5 text-[14px] text-ink-2">
        Le premier super-pouvoir de LifeOS : ne plus jamais oublier un anniversaire.
        Clique, date, ajouté — enchaîne toute la famille.
      </p>

      <div className="mt-6">
        <BirthdayQuickAdd onAdd={(p) => setPeople([...people, p])} />
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {people.length > 0 && (
          <p className="px-1 text-xs font-semibold text-ink-2">
            {people.length} {people.length > 1 ? 'personnes ajoutées' : 'personne ajoutée'}{' '}
            {people.length >= 3 ? '— belle liste 🎉' : ''}
          </p>
        )}
        {people.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-white/[0.075] bg-white/[0.03] px-3.5 py-2.5 text-[13.5px]"
          >
            <span className="grid size-8 flex-none place-items-center rounded-[9px] bg-week/15 text-[14px]">
              🎂
            </span>
            <span className="font-semibold">{p.name}</span>
            <span className="text-ink-3">
              {p.birthDay} {monthNames[p.birthMonth - 1]}
              {p.birthYear ? ` ${p.birthYear}` : ''}
            </span>
            {p.giftIdeas && <span className="truncate text-ink-3">🎁 {p.giftIdeas}</span>}
            <button
              type="button"
              onClick={() => setPeople(people.filter((x) => x.id !== p.id))}
              aria-label={`Retirer ${p.name}`}
              className="ml-auto cursor-pointer rounded-lg px-2 py-1 text-ink-3 transition-colors hover:text-danger"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Étape 2 — Abonnements ---------- */

function StepSubscriptions({
  subs,
  setSubs,
}: {
  subs: SubscriptionDraft[]
  setSubs: (s: SubscriptionDraft[]) => void
}) {
  const [query, setQuery] = useState('')
  const matches = searchCatalog(query).filter(
    (c) => !subs.some((s) => s.serviceId === c.id),
  )

  function update(id: string, patch: Partial<SubscriptionDraft>) {
    setSubs(subs.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  return (
    <div>
      <h2 className="text-[26px] font-bold tracking-[-0.02em]">💳 Tes abonnements</h2>
      <p className="mt-1.5 text-[14px] text-ink-2">
        Choisis dans la bibliothèque, ajuste le prix et le jour de prélèvement.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Net…, Spo…, Chat…"
        className={`${inputCls} mt-5 w-full`}
      />

      <div className="mt-3 grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
        {matches.slice(0, 12).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSubs([...subs, draftFromService(c)])}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.075] bg-white/[0.03] px-3 py-2 text-left text-[13px] transition-all hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span
              className="grid size-7 flex-none place-items-center rounded-lg text-[10px] font-bold"
              style={{ background: c.brandColor, color: c.brandInk }}
            >
              {c.initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{c.name}</span>
              <span className="text-[11px] text-ink-3">
                {formatCents(c.defaultPriceCents)}
              </span>
            </span>
          </button>
        ))}
        {matches.length === 0 && (
          <p className="col-span-full px-1 py-2 text-[13px] text-ink-3">
            Introuvable ? La saisie libre arrive avec le module Abonnements.
          </p>
        )}
      </div>

      {subs.length > 0 && (
        <div className="mt-4 flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
          {subs.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-white/[0.075] bg-white/[0.03] px-3 py-2 text-[13px]"
            >
              <span
                className="grid size-7 flex-none place-items-center rounded-lg text-[10px] font-bold"
                style={{ background: s.brandColor, color: s.brandInk }}
              >
                {s.initial}
              </span>
              <span className="min-w-24 font-semibold">{s.name}</span>
              <span className="ml-auto flex items-center gap-2">
                <input
                  value={s.priceInput}
                  onChange={(e) => update(s.id, { priceInput: e.target.value })}
                  aria-label={`Prix de ${s.name}`}
                  inputMode="decimal"
                  className={`${inputCls} w-20 py-1.5 text-right tabular-nums`}
                />
                €
                <select
                  value={s.cycle}
                  onChange={(e) =>
                    update(s.id, { cycle: e.target.value as 'monthly' | 'annual' })
                  }
                  aria-label={`Cycle de ${s.name}`}
                  className={`${inputCls} cursor-pointer py-1.5`}
                >
                  <option value="monthly">/mois</option>
                  <option value="annual">/an</option>
                </select>
                <select
                  value={s.billingDay}
                  onChange={(e) => update(s.id, { billingDay: Number(e.target.value) })}
                  aria-label={`Jour de prélèvement de ${s.name}`}
                  className={`${inputCls} cursor-pointer py-1.5`}
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      le {i + 1}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSubs(subs.filter((x) => x.id !== s.id))}
                  aria-label={`Retirer ${s.name}`}
                  className="cursor-pointer rounded-lg px-1.5 py-1 text-ink-3 transition-colors hover:text-danger"
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Étape 3 — Récapitulatif ---------- */

function StepDone({
  name,
  people,
  subs,
}: {
  name: string
  people: PersonDraft[]
  subs: SubscriptionDraft[]
}) {
  const monthly = subs.reduce((sum, s) => {
    const cents = parsePriceInput(s.priceInput) ?? s.priceCents
    return sum + (s.cycle === 'annual' ? Math.round(cents / 12) : cents)
  }, 0)

  return (
    <div className="text-center">
      <div className="text-[44px]">✨</div>
      <h2 className="mt-3 text-balance text-[30px] font-bold tracking-[-0.03em]">
        C'est prêt, {name}.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-ink-2">
        Ton brief du matin est déjà en train de s'écrire.
      </p>
      <div className="mx-auto mt-7 flex max-w-sm flex-col gap-2 text-left">
        <div className="glass-card flex items-center gap-3 px-4 py-3 text-[13.5px]">
          <span className="text-[16px]">🎂</span>
          <span>
            <b className="font-semibold">{people.length}</b>{' '}
            {people.length > 1 ? 'anniversaires suivis' : 'anniversaire suivi'}
          </span>
        </div>
        <div className="glass-card flex items-center gap-3 px-4 py-3 text-[13.5px]">
          <span className="text-[16px]">💳</span>
          <span>
            <b className="font-semibold">{subs.length}</b>{' '}
            {subs.length > 1 ? 'abonnements' : 'abonnement'}
            {subs.length > 0 && (
              <span className="text-ink-3"> · {formatCents(monthly)}/mois</span>
            )}
          </span>
        </div>
        <p className="mt-2 px-1 text-center text-xs text-ink-3">
          Tu pourras tout modifier plus tard — et relancer cet assistant depuis les
          Réglages.
        </p>
      </div>
    </div>
  )
}
