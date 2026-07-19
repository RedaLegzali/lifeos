import { Outlet } from 'react-router-dom'
import { Rail } from './components/Rail'
import { Topbar } from './components/Topbar'
import { CommandPalette } from './components/CommandPalette'
import { useShortcuts } from './useShortcuts'

export function Layout() {
  useShortcuts()
  return (
    <div className="flex min-h-screen">
      <Rail />
      <main className="mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-5 pb-20 sm:px-8">
        <Topbar />
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  )
}
