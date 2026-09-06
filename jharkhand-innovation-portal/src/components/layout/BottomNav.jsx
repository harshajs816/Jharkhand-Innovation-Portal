import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, ListChecks,
  Globe2, Bell, User,
} from 'lucide-react'
import { useNotifications } from '../../hooks/useQueries'
import { useApp } from '../../context/AppContext'
import { cn } from '../../utils/helpers'

const BOTTOM_NAV = [
  { to: '/',               label: 'Home',      Icon: LayoutDashboard },
  { to: '/my-challenges',  label: 'Mine',      Icon: ListChecks },
  { to: '/submit',         label: 'Submit',    Icon: PlusCircle,  accent: true },
  { to: '/public-feed',    label: 'Feed',      Icon: Globe2 },
  { to: '/notifications',  label: 'Alerts',    Icon: Bell, badge: true },
]

export function BottomNav() {
  const { data } = useNotifications()
  const unread   = data?.unreadCount ?? 0

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30
                 flex items-stretch h-16 safe-bottom"
      style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.07)' }}
    >
      {BOTTOM_NAV.map(({ to, label, Icon, badge, accent }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all',
              accent
                ? 'relative'
                : isActive
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600'
            )
          }
        >
          {({ isActive }) =>
            accent ? (
              // Submit FAB in the middle
              <>
                <div className="absolute -top-5 w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30
                                flex items-center justify-center border-4 border-white">
                  <Icon size={22} className="text-white" />
                </div>
                <span className="mt-7 text-[10px] font-semibold text-primary">{label}</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge && unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] rounded-full
                                     min-w-[14px] h-[14px] flex items-center justify-center px-0.5 font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </>
            )
          }
        </NavLink>
      ))}
    </nav>
  )
}
