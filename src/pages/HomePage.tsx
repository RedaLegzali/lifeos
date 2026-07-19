import { Suspense, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'
import { widgets } from '@/core/widgets/registry'
import { applyWidgetOrder, useSettings } from '@/core/settings/store'
import { useCoachSuggestion } from '@/core/coach/coach'
import type { WidgetManifest } from '@/core/widgets/types'

/**
 * Un widget déplaçable sur la grille. Le drag démarre après 8 px de
 * mouvement : les clics (liens, cases à cocher) restent naturels.
 */
function SortableWidget({ widget, index }: { widget: WidgetManifest; index: number }) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })
  return (
    <article
      ref={setNodeRef}
      {...listeners}
      className={`glass-card card-rise wspan-${widget.span} flex flex-col gap-3.5 p-5 ${
        isDragging ? 'relative z-10 shadow-[0_20px_50px_rgb(0_0_0/50%)]' : ''
      }`}
      style={
        {
          '--tint': widget.tint,
          transform: CSS.Transform.toString(transform),
          transition,
          cursor: isDragging ? 'grabbing' : undefined,
          // Entrée en scène décalée carte par carte (stagger).
          animationDelay: `${0.08 + index * 0.06}s`,
        } as CSSProperties
      }
    >
      {/* Les cartes sont chargées paresseusement (chunk par widget). */}
      <Suspense fallback={null}>
        <widget.Card />
      </Suspense>
    </article>
  )
}

/** Page d'accueil : le brief du matin (l'assistant), puis les widgets. */
export function HomePage() {
  const userName = useSettings((s) => s.userName)
  const hiddenWidgets = useSettings((s) => s.hiddenWidgets)
  const widgetOrder = useSettings((s) => s.widgetOrder)
  const setWidgetOrder = useSettings((s) => s.setWidgetOrder)

  // HOOKS DE BRIEF : appelés pour TOUS les widgets du registre (ordre
  // stable garanti — le registre est figé au build), puis filtrés.
  const briefByWidget = widgets.map((w) => ({
    id: w.id,
    items: w.useBriefItems?.() ?? [],
  }))
  const briefItems = briefByWidget
    .filter((b) => !hiddenWidgets.includes(b.id))
    .flatMap((b) => b.items)
    .sort((a, b) => a.priority - b.priority)

  const { suggestion, dismiss } = useCoachSuggestion()

  const ordered = applyWidgetOrder(widgets, widgetOrder)
  const visible = ordered.filter((w) => !hiddenWidgets.includes(w.id))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = ordered.map((w) => w.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    setWidgetOrder(arrayMove(ids, from, to))
  }

  return (
    <>
      <motion.section
        className="pb-3 pt-11"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h1 className="text-balance text-[clamp(30px,4.4vw,42px)] font-bold tracking-[-0.03em]">
          Bonjour {userName || 'toi'} 👋
        </h1>

        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          Aujourd'hui
        </p>
        <div className="mt-2 grid gap-x-7 gap-y-1 md:grid-cols-2" aria-label="Résumé du jour">
          {briefItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl px-2.5 py-[9px] text-[14.5px] text-ink-2 transition-colors hover:bg-white/[0.035] [&_b]:font-semibold [&_b]:text-ink"
            >
              <span className="grid size-8 flex-none place-items-center rounded-[9px] border border-white/[0.075] bg-white/[0.06] text-[15px]">
                {item.emoji}
              </span>
              <span className="min-w-0">{item.text}</span>
              {item.when && (
                <span className="ml-auto whitespace-nowrap text-xs tabular-nums text-ink-3">
                  {item.when}
                </span>
              )}
            </div>
          ))}
          {briefItems.length === 0 && (
            <p className="px-2.5 py-[9px] text-[14.5px] text-ink-3">
              Ton brief s'écrira ici, au fil de ce que tu confies à LifeOS.
            </p>
          )}
        </div>

        {suggestion && (
          <div className="mt-5 flex items-center gap-3.5 rounded-2xl border border-accent/20 bg-accent/[0.07] px-4 py-3.5">
            <span className="grid size-9 flex-none place-items-center rounded-xl bg-accent/15 text-[17px]">
              {suggestion.emoji}
            </span>
            <span className="min-w-0 text-[13.5px] text-ink-2">
              <b className="font-semibold text-ink">{suggestion.title}</b>{' '}
              {suggestion.benefit}
            </span>
            <span className="ml-auto flex flex-none items-center gap-1.5">
              <button
                type="button"
                onClick={dismiss}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-ink-3 transition-colors hover:text-ink"
              >
                Plus tard
              </button>
              <Link
                to={suggestion.route}
                className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-bg transition-all hover:brightness-110"
              >
                {suggestion.cta}
              </Link>
            </span>
          </div>
        )}
      </motion.section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visible.map((w) => w.id)} strategy={rectSortingStrategy}>
          <section
            className="mt-9 grid grid-cols-1 gap-3.5 md:grid-cols-6"
            aria-label="Widgets"
          >
            {visible.map((w, i) => (
              <SortableWidget key={w.id} widget={w} index={i} />
            ))}
          </section>
        </SortableContext>
      </DndContext>
    </>
  )
}
