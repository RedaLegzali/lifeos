import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { widgets } from '@/core/widgets/registry'
import { useSettings } from '@/core/settings/store'
import { Kbd } from '@/design/ui'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass-card p-6">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Interrupteur du design system. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[22px] w-10 flex-none cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? 'bg-accent' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-[3px] size-4 rounded-full bg-white transition-all duration-200 ${
          checked ? 'left-[21px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-2 py-2 text-[13.5px] text-ink-2">
      <span>{label}</span>
      <span className="ml-auto flex gap-1">
        {keys.map((k) => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </span>
    </div>
  )
}

export function SettingsPage() {
  const { userName, setUserName, hiddenWidgets, toggleWidget, setOnboarded } =
    useSettings()

  return (
    <motion.div
      className="pt-11"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <h1 className="text-[26px] font-bold tracking-[-0.02em]">Réglages</h1>
      <p className="mt-1 text-sm text-ink-2">
        Tout est stocké localement sur cette machine. Aucun compte, aucun serveur.
      </p>

      <div className="mt-8 grid max-w-2xl gap-3.5">
        <Section title="Profil">
          <label className="flex items-center gap-4 text-[13.5px]">
            <span className="w-24 text-ink-2">Prénom</span>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="flex-1 rounded-xl border border-white/[0.075] bg-white/[0.035] px-3.5 py-2 text-ink outline-none transition-colors focus:border-accent/50"
            />
          </label>
        </Section>

        <Section title="Widgets de l'accueil">
          <div className="flex flex-col">
            {widgets.map((w) => {
              const Icon = w.icon
              const visible = !hiddenWidgets.includes(w.id)
              return (
                <div key={w.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                  <span
                    className="grid size-[30px] flex-none place-items-center rounded-[9px]"
                    style={{
                      background: `color-mix(in srgb, ${w.tint} 14%, transparent)`,
                      color: w.tint,
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[13.5px] font-medium">{w.title}</span>
                  <span className="ml-auto">
                    <Toggle
                      checked={visible}
                      onChange={() => toggleWidget(w.id)}
                      label={`Afficher le widget ${w.title}`}
                    />
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 px-2 text-xs text-ink-3">
            Astuce : sur l'accueil, glisse une carte pour réorganiser la grille.
          </p>
        </Section>

        <Section title="Raccourcis clavier">
          <div className="flex flex-col">
            <ShortcutRow keys={['⌘', 'K']} label="Recherche globale" />
            <ShortcutRow keys={['1']} label="Accueil" />
            <ShortcutRow keys={['2', '…', '6']} label="Widgets (ordre du registre)" />
            <ShortcutRow keys={['7']} label="Réglages" />
            <ShortcutRow keys={['Échap']} label="Fermer la palette" />
          </div>
        </Section>

        <Section title="Configuration">
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            L'assistant de première utilisation gère ton profil, tes anniversaires et tes
            abonnements. Tu peux le relancer — il sera pré-rempli avec l'existant.
          </p>
          <button
            type="button"
            onClick={() => setOnboarded(false)}
            className="mt-4 cursor-pointer rounded-xl border border-white/[0.075] bg-white/[0.035] px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-white/[0.06]"
          >
            Relancer la configuration
          </button>
        </Section>

        <Section title="Données">
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            LifeOS est <b className="font-semibold text-ink">local-first</b> : préférences
            dans ce navigateur, données des widgets dans une base IndexedDB. L'export et la
            sauvegarde arriveront avec les premiers vrais modules.
          </p>
        </Section>

        <p className="px-2 text-xs text-ink-3">LifeOS · base v0.2 · expérience</p>
      </div>
    </motion.div>
  )
}
