import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Button, Select } from '@/design/form'
import { ALL_CATEGORIES, setOverride } from './rules'
import { formatCents, formatCentsRounded } from '@/lib/format'
import { CATEGORY_TINT } from './categories'
import {
  importStatement,
  perMonth,
  removeSource,
  useMoneyData,
  useOwnerName,
  type ImportReport,
} from './useMoneyData'
import { moneyWidget } from './manifest'

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'warn'
}) {
  const color =
    tone === 'good' ? 'text-money' : tone === 'warn' ? 'text-subs' : 'text-ink'
  return (
    <div className="glass-card p-5" style={{ '--tint': moneyWidget.tint } as never}>
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
        {label}
      </div>
      <div className={`mt-1.5 text-[26px] font-bold tabular-nums tracking-[-0.02em] ${color}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[12.5px] text-ink-3">{hint}</div>}
    </div>
  )
}

/** Zone de dépôt : glisser un relevé PDF, ou cliquer pour le choisir. */
function ImportZone({ onImported }: { onImported: (r: ImportReport) => void }) {
  const ownerName = useOwnerName()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          setError(`« ${file.name} » n'est pas un PDF.`)
          continue
        }
        onImported(await importStatement(file, ownerName))
      }
    } catch (e) {
      setError(
        `Lecture impossible : ${e instanceof Error ? e.message : 'format non reconnu'}. Ce parseur lit les relevés Société Générale.`,
      )
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void handle(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center gap-2.5 rounded-[20px] border border-dashed p-8 text-center transition-colors ${
          over ? 'border-money/60 bg-money/[0.07]' : 'border-white/15 bg-white/[0.02]'
        }`}
      >
        <span className="text-[26px]">📄</span>
        <p className="text-[14px] font-semibold">
          {busy ? 'Lecture du relevé…' : 'Dépose tes relevés PDF ici'}
        </p>
        <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-2">
          Ils sont lus <b className="font-semibold text-ink">sur ton appareil</b>, jamais
          envoyés nulle part. Chaque relevé est recoupé avec ses propres totaux imprimés.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => void handle(e.target.files)}
          className="hidden"
        />
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-1"
        >
          Choisir des fichiers
        </Button>
      </div>
      {error && (
        <p className="mt-2.5 rounded-xl border border-danger/25 bg-danger/[0.08] px-3.5 py-2.5 text-[13px] text-ink-2">
          {error}
        </p>
      )}
    </div>
  )
}

function CategoryRow({
  cat,
  share,
  months,
  max,
}: {
  cat: { name: string; cents: number; count: number; merchants: { name: string; cents: number; count: number }[] }
  share: number
  months: number
  max: number
}) {
  const [open, setOpen] = useState(false)
  const tint = CATEGORY_TINT[cat.name] ?? '#8b93ff'

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full cursor-pointer border-b border-white/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.035]"
      >
        <span className="flex items-baseline gap-3">
          <span className="text-[14px] font-semibold">
            {cat.name}
            <span
              className="ml-2 inline-block text-[11px] text-ink-3 transition-transform"
              style={{ transform: open ? 'rotate(90deg)' : 'none' }}
            >
              ▶
            </span>
          </span>
          <span className="text-[12px] tabular-nums text-ink-3">
            {share.toFixed(1)} % · {cat.count} op.
          </span>
          <span className="ml-auto whitespace-nowrap text-[15px] font-bold tabular-nums">
            {formatCentsRounded(perMonth(cat.cents, months))}
            <small className="text-[11.5px] font-medium text-ink-3"> /mois</small>
          </span>
        </span>
        <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <i
            className="block h-full rounded-full transition-[width] duration-500"
            style={{ width: `${(cat.cents / max) * 100}%`, background: tint }}
          />
        </span>
      </button>
      {open && (
        <div className="border-b border-white/[0.04] bg-black/20 px-4 pb-4 pt-1">
          {cat.merchants.slice(0, 12).map((m) => (
            <div
              key={m.name}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-white/[0.03] py-2 text-[13px] text-ink-2 last:border-0"
            >
              <span className="font-medium text-ink">{m.name}</span>
              <span className="text-[11.5px] tabular-nums text-ink-3">{m.count}×</span>
              <span className="ml-auto font-semibold tabular-nums text-ink">
                {formatCents(m.cents)}
              </span>
              <Select
                value={cat.name}
                aria-label={`Catégorie de ${m.name}`}
                onChange={(e) => void setOverride(m.name, e.target.value)}
                className="!py-1 !text-[11.5px]"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          ))}
          {cat.merchants.length > 12 && (
            <p className="pt-2 text-[12px] text-ink-3">
              + {cat.merchants.length - 12} autres marchands
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function MoneyPage() {
  const data = useMoneyData()
  const [reports, setReports] = useState<ImportReport[]>([])
  const Icon = moneyWidget.icon

  const net = data.totalCredits - data.totalDebits
  const max = Math.max(...data.categories.map((c) => c.cents), 1)

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
            background: 'color-mix(in srgb, var(--color-money) 14%, transparent)',
            color: 'var(--color-money)',
          }}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Argent</h1>
          <p className="text-sm text-ink-2">
            {data.empty
              ? 'Importe un relevé pour voir où va ton argent.'
              : `${data.operations} opérations · ${data.months.toFixed(1)} mois couverts · ${data.sources.length} relevé${data.sources.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="mt-8 grid max-w-3xl gap-3.5">
        <ImportZone onImported={(r) => setReports((prev) => [r, ...prev])} />

        {reports.map((r, i) => (
          <div
            key={`${r.fileName}-${i}`}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-[13px] ${
              r.valid
                ? 'border-money/25 bg-money/[0.07]'
                : 'border-subs/25 bg-subs/[0.07]'
            }`}
          >
            <span className="font-semibold">{r.fileName}</span>
            <span className="text-ink-2">
              {r.added} opération{r.added > 1 ? 's' : ''} ajoutée{r.added > 1 ? 's' : ''}
              {r.duplicates > 0 && ` · ${r.duplicates} déjà présente${r.duplicates > 1 ? 's' : ''}`}
            </span>
            <span className={`ml-auto text-[12px] ${r.valid ? 'text-money' : 'text-subs'}`}>
              {r.valid
                ? `✓ vérifié au centime (${r.checks} relevé${r.checks > 1 ? 's' : ''})`
                : '⚠ totaux non concordants'}
            </span>
          </div>
        ))}

        {!data.empty && (
          <>
            <div className="mt-3 grid gap-3.5 sm:grid-cols-3">
              <StatTile
                label="Revenus"
                value={formatCentsRounded(perMonth(data.totalCredits, data.months))}
                hint="par mois"
                tone="good"
              />
              <StatTile
                label="Dépenses"
                value={formatCentsRounded(perMonth(data.totalDebits, data.months))}
                hint="par mois"
              />
              <StatTile
                label="Ce qu'il reste"
                value={formatCents(perMonth(net, data.months))}
                hint="par mois"
                tone={net > 0 ? 'warn' : undefined}
              />
            </div>

            <section className="mt-4">
              <h2 className="mb-1 text-[19px] font-bold tracking-[-0.02em]">
                Où va ton argent
              </h2>
              <p className="mb-4 text-[13.5px] text-ink-3">
                Clique sur une catégorie pour voir le détail. Un marchand mal classé ? Change
                sa catégorie — la règle s'applique à tout ton historique.
              </p>
              <div className="glass-card overflow-hidden" style={{ '--tint': moneyWidget.tint } as never}>
                {data.categories.map((c) => (
                  <CategoryRow
                    key={c.name}
                    cat={c}
                    share={(c.cents / data.totalDebits) * 100}
                    months={data.months}
                    max={max}
                  />
                ))}
              </div>
            </section>

            <section className="mt-4">
              <h2 className="mb-3 text-[19px] font-bold tracking-[-0.02em]">
                Relevés importés
              </h2>
              <div className="flex flex-col gap-1.5">
                {data.sources.map((s) => (
                  <div
                    key={s}
                    className="glass-card flex items-center gap-3 px-4 py-2.5 text-[13.5px]"
                    style={{ '--tint': moneyWidget.tint } as never}
                  >
                    <span>📄</span>
                    <span className="truncate">{s}</span>
                    <button
                      type="button"
                      onClick={() => void removeSource(s)}
                      aria-label={`Retirer ${s}`}
                      className="ml-auto cursor-pointer rounded-lg px-2 py-1 text-ink-3 transition-colors hover:text-danger"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <p className="px-2 text-xs text-ink-3">
              À venir : abonnements détectés automatiquement, prévisions des prélèvements,
              règles de catégorisation modifiables.
            </p>
          </>
        )}
      </div>
    </motion.div>
  )
}
