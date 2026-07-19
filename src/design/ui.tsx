import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { WidgetManifest } from '@/core/widgets/types'

/**
 * État vide d'un widget : jamais d'écran creux ni de fausse donnée —
 * une invitation qui explique le bénéfice et propose LA prochaine
 * action utile.
 */
export function EmptyState({
  widget,
  emoji,
  benefit,
  cta,
  to,
}: {
  widget: WidgetManifest
  emoji: string
  benefit: string
  cta: string
  to: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 text-center">
      <span
        className="grid size-11 place-items-center rounded-2xl text-[20px]"
        style={{ background: `color-mix(in srgb, ${widget.tint} 12%, transparent)` }}
      >
        {emoji}
      </span>
      <p className="max-w-[26ch] text-balance text-[13.5px] leading-relaxed text-ink-2">
        {benefit}
      </p>
      <Link
        to={to}
        className="rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all hover:brightness-125"
        style={{
          background: `color-mix(in srgb, ${widget.tint} 15%, transparent)`,
          color: widget.tint,
        }}
      >
        {cta}
      </Link>
    </div>
  )
}

/** Primitives partagées du design system. */

export function Badge({ tint, children }: { tint?: string; children: ReactNode }) {
  const c = tint ?? 'var(--color-accent)'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold"
      style={{ background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c }}
    >
      {children}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="kbd">{children}</span>
}

/**
 * En-tête standard d'une carte widget : pastille d'icône teintée,
 * titre, contenu optionnel à droite et lien vers la page dédiée.
 */
export function WidgetHeader({
  widget,
  right,
  moreLabel = 'Ouvrir →',
}: {
  widget: WidgetManifest
  right?: ReactNode
  moreLabel?: string
}) {
  const Icon = widget.icon
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid size-[30px] flex-none place-items-center rounded-[9px]"
        style={{
          background: `color-mix(in srgb, ${widget.tint} 14%, transparent)`,
          color: widget.tint,
        }}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight">{widget.title}</span>
      {right}
      <Link
        to={widget.route}
        className="text-ink-3 hover:text-ink -my-1 ml-auto rounded-lg px-2 py-1 text-xs transition-colors"
      >
        {moreLabel}
      </Link>
    </div>
  )
}
