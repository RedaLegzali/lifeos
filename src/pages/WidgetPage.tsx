import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import type { WidgetManifest } from '@/core/widgets/types'
import { Badge } from '@/design/ui'

/**
 * Page dédiée d'un widget — squelette « en construction ».
 * Chaque module remplacera ce contenu lors de son développement,
 * conformément à la méthode : un widget à la fois, terminé et validé.
 */
export function WidgetPage({ widget }: { widget: WidgetManifest }) {
  const Icon = widget.icon
  return (
    <motion.section
      className="pt-11"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-center gap-4">
        <span
          className="grid size-12 flex-none place-items-center rounded-2xl"
          style={{
            background: `color-mix(in srgb, ${widget.tint} 14%, transparent)`,
            color: widget.tint,
          }}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">{widget.title}</h1>
          <p className="text-sm text-ink-2">{widget.description}</p>
        </div>
        <span className="ml-auto">
          <Badge tint={widget.tint}>Prochaine étape</Badge>
        </span>
      </div>

      <div className="glass-card mt-8 max-w-xl p-6" style={{ '--tint': widget.tint } as CSSProperties}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
          Au programme de ce module
        </h2>
        <ul className="mt-4 flex flex-col gap-2.5">
          {widget.planned.map((p) => (
            <li key={p} className="flex items-center gap-3 text-[13.5px] text-ink-2">
              <span
                className="size-1.5 flex-none rounded-full"
                style={{ background: widget.tint }}
              />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-ink-3">
          Ce module sera développé, testé puis validé avant de passer au suivant.
        </p>
      </div>
    </motion.section>
  )
}
