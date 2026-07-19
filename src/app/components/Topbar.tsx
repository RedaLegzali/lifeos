import { useUI } from '@/core/ui/store'
import { IconSearch } from '@/design/icons'
import { Kbd } from '@/design/ui'
import { formatFullDate } from '@/lib/dates'

export function Topbar() {
  const openPalette = useUI((s) => s.openPalette)

  return (
    <div className="sticky top-0 z-20 flex items-center gap-4 bg-gradient-to-b from-bg from-70% to-transparent pb-2 pt-[18px]">
      <button
        type="button"
        onClick={openPalette}
        aria-label="Recherche globale"
        className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.075] bg-white/[0.035] px-3.5 py-[9px] text-left text-[13.5px] text-ink-3 transition-all duration-150 hover:border-white/15 hover:bg-white/[0.06] hover:text-ink-2 sm:max-w-[420px]"
      >
        <IconSearch className="size-[15px] flex-none" />
        <span className="flex-1">Rechercher dans LifeOS…</span>
        <Kbd>⌘K</Kbd>
      </button>
      <span className="ml-auto hidden text-[13px] text-ink-3 md:block">
        {formatFullDate(new Date())}
      </span>
    </div>
  )
}
