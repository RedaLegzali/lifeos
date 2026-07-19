import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { widgets } from '@/core/widgets/registry'
import { IconHome, IconSettings } from '@/design/icons'

function RailLink({
  to,
  title,
  children,
}: {
  to: string
  title: string
  children: ReactNode
}) {
  return (
    <NavLink
      to={to}
      title={title}
      aria-label={title}
      className={({ isActive }) =>
        `grid size-10 place-items-center rounded-xl transition-all duration-150 ${
          isActive
            ? 'bg-accent/15 text-accent'
            : 'text-ink-3 hover:bg-white/5 hover:text-ink'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export function Rail() {
  return (
    <aside className="sticky top-0 hidden h-screen w-16 flex-none flex-col items-center gap-1.5 border-r border-white/[0.075] bg-bg/60 py-4 backdrop-blur-xl sm:flex">
      <div className="mb-3.5 grid size-[34px] flex-none place-items-center rounded-[11px] bg-gradient-to-br from-accent via-[#c58bfa] to-week text-[15px] font-bold text-bg shadow-[0_4px_18px_rgb(139_147_255/35%)]">
        L
      </div>
      <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-1.5">
        <RailLink to="/" title="Accueil">
          <IconHome className="size-[19px]" />
        </RailLink>
        {widgets.map((w) => {
          const Icon = w.icon
          return (
            <RailLink key={w.id} to={w.route} title={w.title}>
              <Icon className="size-[19px]" />
            </RailLink>
          )
        })}
      </nav>
      <RailLink to="/reglages" title="Réglages">
        <IconSettings className="size-[19px]" />
      </RailLink>
    </aside>
  )
}
