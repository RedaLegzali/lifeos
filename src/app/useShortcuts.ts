import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { widgets } from '@/core/widgets/registry'

/**
 * Raccourcis clavier globaux (hors champs de saisie) :
 *   1        → Accueil
 *   2 … 6    → widgets, dans l'ordre du registre
 *   7        → Réglages
 * (⌘K / Ctrl+K est géré par la palette elle-même.)
 */
export function useShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const routes = ['/', ...widgets.map((w) => w.route), '/reglages']

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        return
      }
      const n = Number.parseInt(e.key, 10)
      const route = routes[n - 1]
      if (n >= 1 && route) navigate(route)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}
