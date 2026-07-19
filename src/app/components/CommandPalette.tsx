import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import type Fuse from 'fuse.js'
import { useUI } from '@/core/ui/store'
import {
  collectSearchItems,
  createSearchIndex,
  defaultSuggestions,
  runSearch,
} from '@/core/search/search'
import type { SearchItem } from '@/core/widgets/types'

/**
 * Palette de commande globale (⌘K / Ctrl+K).
 * Fusionne entités des widgets et commandes de navigation.
 */
export function CommandPalette() {
  const { paletteOpen, closePalette, togglePalette } = useUI()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // L'index est reconstruit à chaque ouverture : les données (IndexedDB)
  // peuvent avoir changé entre deux ouvertures.
  const [index, setIndex] = useState<Fuse<SearchItem> | null>(null)
  useEffect(() => {
    if (!paletteOpen) return
    let cancelled = false
    collectSearchItems().then((items) => {
      if (!cancelled) setIndex(createSearchIndex(items))
    })
    return () => {
      cancelled = true
    }
  }, [paletteOpen])

  const results: SearchItem[] = useMemo(() => {
    if (!index) return []
    return query.trim() ? runSearch(index, query) : defaultSuggestions()
  }, [index, query])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        togglePalette()
      }
      if (e.key === 'Escape') closePalette()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePalette, closePalette])

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setSelected(0)
      // Laisse la frame d'animation démarrer avant de prendre le focus.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [paletteOpen])

  useEffect(() => setSelected(0), [query])

  function activate(item: SearchItem) {
    closePalette()
    navigate(item.route)
  }

  function onInputKey(e: ReactKeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      const item = results[selected]
      if (item) activate(item)
    }
  }

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[14vh] backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePalette()
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Recherche globale"
        >
          <motion.div
            className="w-[min(560px,92vw)] overflow-hidden rounded-2xl border border-white/15 bg-[#12141e]/95 shadow-[0_30px_80px_rgb(0_0_0/60%)] backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.16, ease: [0.2, 0.9, 0.3, 1] }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Netflix, Maman, Rainbow Six…"
              autoComplete="off"
              className="w-full border-b border-white/[0.075] bg-transparent px-5 py-4 text-base text-ink outline-none placeholder:text-ink-3"
            />
            <div className="max-h-[330px] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="p-6 text-center text-[13.5px] text-ink-3">
                  Aucun résultat pour « {query} ».
                </div>
              ) : (
                results.map((item, i) => {
                  const showGroup = i === 0 || results[i - 1]?.group !== item.group
                  return (
                    <div key={item.id}>
                      {showGroup && (
                        <div className="px-3 pb-1 pt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                          {item.group}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => activate(item)}
                        onMouseEnter={() => setSelected(i)}
                        className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-[9px] text-left text-[13.5px] ${
                          i === selected ? 'bg-white/[0.06]' : ''
                        }`}
                      >
                        <span className="grid size-7 flex-none place-items-center rounded-lg bg-white/[0.06] text-[13px]">
                          {item.emoji}
                        </span>
                        <span className="truncate">{item.title}</span>
                        {item.meta && (
                          <span className="ml-auto flex-none text-xs tabular-nums text-ink-3">
                            {item.meta}
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
