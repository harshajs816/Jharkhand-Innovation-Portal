import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, ListChecks, Globe2,
  Star, MessageSquare, Bell, User, LogOut, Lightbulb, X,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useQueries'
import { cn } from '../../utils/helpers'

const NAV = [
  { to: '/',                label: 'Dashboard',       labelHi: 'डैशबोर्ड',         Icon: LayoutDashboard },
  { to: '/submit',          label: 'Submit Challenge', labelHi: 'चुनौती दर्ज करें',  Icon: PlusCircle },
  { to: '/my-challenges',   label: 'My Challenges',    labelHi: 'मेरी चुनौतियां',     Icon: ListChecks },
  { to: '/public-feed',     label: 'Public Feed',      labelHi: 'सार्वजनिक फ़ीड',     Icon: Globe2 },
  { to: '/success-stories', label: 'Success Stories',  labelHi: 'सफलता की कहानियां', Icon: Star },
  { to: '/pilot-feedback',  label: 'Pilot Feedback',   labelHi: 'पायलट फीडबैक',      Icon: MessageSquare },
  { to: '/notifications',   label: 'Notifications',    labelHi: 'सूचनाएं',           Icon: Bell, badge: true },
  { to: '/profile',         label: 'Profile',          labelHi: 'प्रोफ़ाइल',          Icon: User },
]

export function Sidebar({ mobileOpen, onClose }) {
  const { language, toggleLanguage, t } = useApp()
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const { data }   = useNotifications()
  const unread     = data?.unreadCount ?? 0

  const handleLogout = async () => {
    await logout()
    onClose?.()
    navigate('/login')
  }

  const handleNavClick = () => onClose?.()

  const sidebarContent = (
    <aside
      className="h-full w-64 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#0f3d24 0%,#16522e 55%,#0b2d1a 100%)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 shadow-lg">
          <Lightbulb size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm leading-tight truncate">Jharkhand Societal</p>
          <p className="text-green-300 text-xs truncate">Innovation Portal</p>
        </div>
        {/* Close btn — only on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-0.5">
        {NAV.map(({ to, label, labelHi, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-green-200/80 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <span className="flex-1 leading-tight">{t(label, labelHi)}</span>
            {badge && unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language toggle */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <p className="text-green-400 text-[10px] uppercase tracking-widest mb-2 font-semibold">
          Switch Language
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-green-200/70 text-xs">English / हिन्दी / संथाली</span>
          <button
            onClick={toggleLanguage}
            className={cn(
              'relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200',
              language === 'hi' ? 'bg-accent' : 'bg-white/20'
            )}
            aria-label="Toggle language"
          >
            <span className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
              language === 'hi' ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-2 pb-4 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-green-200/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
        >
          <LogOut size={17} />
          <span>{t('Logout', 'लॉगआउट')}</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop: always visible fixed sidebar ── */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 z-30">
        {sidebarContent}
      </div>

      {/* ── Mobile: slide-in drawer with backdrop ── */}
      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={cn(
          'lg:hidden fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
