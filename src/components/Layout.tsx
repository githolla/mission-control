import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const { pathname } = useLocation()
  const mainId = 'app-main'

  // Scroll to top on route change.
  useEffect(() => {
    const el = document.getElementById(mainId)
    if (el) el.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f6]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id={mainId} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
