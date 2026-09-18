import { Outlet, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import CommandPalette from './CommandPalette'
import { PaletteContext } from './palette-context'

export default function Layout() {
  const { pathname } = useLocation()
  const mainId = 'app-main'
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Scroll to top on route change.
  useEffect(() => {
    const el = document.getElementById(mainId)
    if (el) el.scrollTo({ top: 0 })
  }, [pathname])

  // Global ⌘K / Ctrl+K toggles the palette from any page (prevents browser find).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const paletteCtx = useMemo(() => ({ open: openPalette }), [openPalette])

  return (
    <PaletteContext.Provider value={paletteCtx}>
      <div className="flex h-screen overflow-hidden bg-[#eef1f6]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main id={mainId} className="flex-1 overflow-y-auto">
            <div className="w-full px-8 py-8 xl:px-12">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </PaletteContext.Provider>
  )
}
