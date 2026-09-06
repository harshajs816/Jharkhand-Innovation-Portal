import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, HelpCircle, ChevronDown, Mic, Plus, Menu, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useQueries'

export function TopBar({ title, onMenuClick }) {
  const { t }       = useApp()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const { data }    = useNotifications()
  const unread      = data?.unreadCount ?? 0
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch]         = useState('')

  return (
    <header
      className="fixed top-0 right-0 h-14 sm:h-16 bg-white border-b border-gray-100 flex items-center z-20
                 left-0 lg:left-64 gap-3 px-3 sm:px-6"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* ── Hamburger (mobile only) ── */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-600
                   hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Page title — hidden when search is open on mobile ── */}
      <h1 className={`text-sm sm:text-base font-semibold text-gray-800 flex-shrink-0 truncate
                       transition-all duration-200 ${searchOpen ? 'hidden sm:block' : 'block'}`}>
        {title}
      </h1>

      {/* ── Search bar — full on desktop, expandable on mobile ── */}
      <div className={`transition-all duration-200 relative
                       ${searchOpen ? 'flex flex-1' : 'hidden sm:flex flex-1 max-w-md'}`}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder={t('Search challenges, stories...', 'खोजें...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus={searchOpen}
          className="w-full pl-9 pr-9 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                     transition-all placeholder-gray-400"
        />
        {searchOpen ? (
          <button onClick={() => { setSearchOpen(false); setSearch('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        ) : (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
            <Mic size={14} />
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1 hidden sm:block" />

      {/* ── Actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        {/* Search toggle — mobile only */}
        {!searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Search size={15} />
          </button>
        )}

        {/* Submit button — hidden on mobile (handled by bottom nav) */}
        <button
          onClick={() => navigate('/submit')}
          className="hidden md:flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white
                     text-sm font-medium px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          <Plus size={15} />
          <span className="hidden lg:inline">{t('Submit New Challenge', 'नई चुनौती')}</span>
          <span className="lg:hidden">Submit</span>
        </button>

        {/* Voice */}
        <button
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary hover:bg-primary-dark flex items-center justify-center text-white transition-colors"
          title={t('Voice Input', 'वॉयस इनपुट')}
        >
          <Mic size={14} />
        </button>

        {/* Help — hidden on mobile */}
        <button className="hidden sm:flex w-9 h-9 rounded-xl border border-gray-200 items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <HelpCircle size={15} />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              {unread}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-1.5 sm:px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[100px] truncate">
            {user?.name ?? 'User'}
          </span>
          <ChevronDown size={13} className="text-gray-400 hidden md:block flex-shrink-0" />
        </button>
      </div>
    </header>
  )
}
