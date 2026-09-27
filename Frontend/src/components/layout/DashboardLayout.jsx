import { useState } from 'react'
import { Sidebar }   from './Sidebar'
import { TopBar }    from './TopBar'
import { BottomNav } from './BottomNav'

export function DashboardLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — desktop fixed, mobile drawer */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset only on desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* TopBar — full width on mobile, offset on desktop */}
        <TopBar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content:
            • pt-14 on mobile  (TopBar is 56px)
            • pt-16 on sm+     (TopBar is 64px)
            • pb-20 on mobile  (BottomNav is 64px)
            • pb-0  on lg+     (no bottom nav)  */}
        <main className="flex-1 pt-14 sm:pt-16 pb-20 lg:pb-0">
          <div className="p-4 sm:p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
