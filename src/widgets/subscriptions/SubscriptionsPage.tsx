import { useState } from 'react'
import { motion } from 'motion/react'
import { db, type Subscription } from '@/lib/db'
import { formatCents } from '@/lib/format'
import { daysUntil, formatDayMonth } from '@/lib/dates'
import { searchCatalog, type CatalogService } from './catalog'
import { subscriptionsWidget } from './manifest'
import { useSubscriptionsData, type SubscriptionView } from './useSubscriptionsData'

const inputCls =
  'rounded-xl border border-white/[0.075] bg-white/[0.035] px-3.5 py-2 text-[13.5px] text-ink outline-none transition-colors focus:border-accent/50 placeholder:text-ink-3'

function fromService(s: CatalogService): Subscription {
  return {
    id: crypto.randomUUID(),
    serviceId: s.id,
    name: s.name,
    initial: s.initial,
    brandColor: s.brandColor,
    brandInk: s.brandInk,
    priceCents: s.defaultPriceCents,
    cycle: 'monthly',
    billingDay: new Date().getDate(),
    category: s.category,
  }
}

/** Sélecteur bibliothèque : taper « Net… », cliquer, c'est ajouté. */
function CatalogPicker({ excludeServiceIds }: { excludeServiceIds: Set<string> }) {
  const [query, setQuery] = useState('')
  const matches = searchCatalog(query).filter((c) => !excludeServiceIds.has(c.id))

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ajouter : Net…, Spo…, Chat…"
        className={`${inputCls} w-full`}
      />
      <div className="mt-2.5 grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
        {matches.slice(0, 12).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              void db.subscriptions.add(fromService(c))
              setQuery('')
            }}
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
                {formatCents(c.defaultPriceCents)} · {c.category}
              </span>
            </span>
          </button>
        ))}
        {matches.length === 0 && (
          <p className="col-span-full px-1 py-2 text-[13px] text-ink-3">
            Introuvable ? La saisie libre arrive avec la suite du module.
          </p>
        )}
      </div>
    </div>
  )
}

/** Ligne éditable : prix, cycle, jour de prélèvement, suppression. */
function SubscriptionRow({ sub }: { sub: SubscriptionView }) {
  const [priceInput, setPriceInput] = useState(
    (sub.priceCents / 100).toFixed(2).replace('.', ','),
  )

  function commitPrice() {
    const n = Number.parseFloat(priceInput.trim().replace(',', '.'))
    if (Number.isFinite(n) && n >= 0) {
      void db.subscriptions.update(sub.id, { priceCents: Math.round(n * 100) })
    } else {
      setPriceInput((sub.priceCents / 100).toFixed(2).replace('.', ','))
    }
  }

  const d = daysUntil(sub.nextBillingAt)

  return (
    <div
      className="glass-card flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 text-[13px]"
      style={{ '--tint': 'var(--color-subs)' } as never}
    >
      <span
        className="grid size-8 flex-none place-items-center rounded-[9px] text-[11px] font-bold"
        style={{ background: sub.brandColor, color: sub.brandInk }}
      >
        {sub.initial}
      </span>
      <span className="min-w-28">
        <span className="font-semibold">{sub.name}</span>
        <br />
        <span className="text-[11.5px] text-ink-3">
          {d === 0
            ? "débite aujourd'hui"
            : d === 1
              ? 'débite demain'
              : `prochain : ${formatDayMonth(sub.nextBillingAt)}`}
        </span>
      </span>
      <span className="ml-auto flex items-center gap-2">
        <input
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          onBlur={commitPrice}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          aria-label={`Prix de ${sub.name}`}
          inputMode="decimal"
          className={`${inputCls} w-20 py-1.5 text-right tabular-nums`}
        />
        €
        <select
          value={sub.cycle}
          onChange={(e) =>
            void db.subscriptions.update(sub.id, {
              cycle: e.target.value as 'monthly' | 'annual',
            })
          }
          aria-label={`Cycle de ${sub.name}`}
          className={`${inputCls} cursor-pointer py-1.5`}
        >
          <option value="monthly">/mois</option>
          <option value="annual">/an</option>
        </select>
        <select
          value={sub.billingDay}
          onChange={(e) =>
            void db.subscriptions.update(sub.id, { billingDay: Number(e.target.value) })
          }
          aria-label={`Jour de prélèvement de ${sub.name}`}
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
          onClick={() => void db.subscriptions.delete(sub.id)}
          aria-label={`Supprimer ${sub.name}`}
          className="cursor-pointer rounded-lg px-1.5 py-1 text-ink-3 transition-colors hover:text-danger"
        >
          ✕
        </button>
      </span>
    </div>
  )
}

export function SubscriptionsPage() {
  const { subs, totalMonthlyCents } = useSubscriptionsData()
  const Icon = subscriptionsWidget.icon
  const excluded = new Set(
    subs.flatMap((s) => (s.serviceId ? [s.serviceId] : [])),
  )

  return (
    <motion.div
      className="pt-11"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-center gap-4">
        <span
          className="grid size-12 flex-none place-items-center rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--color-subs) 14%, transparent)',
            color: 'var(--color-subs)',
          }}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Abonnements</h1>
          <p className="text-sm text-ink-2">
            {subs.length > 0
              ? `${subs.length} ${subs.length > 1 ? 'abonnements' : 'abonnement'} · ${formatCents(totalMonthlyCents)}/mois`
              : 'Ajoute ton premier abonnement — 10 secondes suffisent.'}
          </p>
        </div>
      </div>

      <div className="mt-8 grid max-w-2xl gap-3.5">
        <CatalogPicker excludeServiceIds={excluded} />
        <div className="flex flex-col gap-1.5">
          {subs.map((s) => (
            <SubscriptionRow key={s.id} sub={s} />
          ))}
        </div>
        <p className="px-2 text-xs text-ink-3">
          À venir : historique, alertes de non-usage, saisie libre hors bibliothèque.
        </p>
      </div>
    </motion.div>
  )
}
