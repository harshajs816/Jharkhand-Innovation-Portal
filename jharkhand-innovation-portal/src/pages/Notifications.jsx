import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../hooks/useQueries'
import { useApp } from '../context/AppContext'
import { useState } from 'react'

const TYPE_FILTERS = ['All','status','endorsement','university','ai','badge','feedback']

function NotifCard({ notif, onMarkRead, onDelete }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
      notif.read ? 'bg-white border-gray-100' : 'bg-primary-light/50 border-primary/20'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${
        notif.read ? 'bg-gray-100' : 'bg-primary/10'
      }`}>
        {notif.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
              {notif.title}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notif.read && (
              <button onClick={() => onMarkRead(notif._id)}
                className="text-xs text-primary hover:underline whitespace-nowrap mt-0.5">
                Mark read
              </button>
            )}
            <button onClick={() => onDelete(notif._id)}
              className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{notif.time}</p>
      </div>
      {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
    </div>
  )
}

export default function Notifications() {
  const { t } = useApp()
  const [filter, setFilter] = useState('All')

  const { data, isLoading }  = useNotifications()
  const markRead             = useMarkNotificationRead()
  const markAll              = useMarkAllNotificationsRead()
  const deleteNotif          = useDeleteNotification()

  const notifications = data?.notifications ?? []
  const unreadCount   = data?.unreadCount ?? 0

  const filtered = filter === 'All'
    ? notifications
    : notifications.filter(n => n.type === filter)

  return (
    <DashboardLayout title={t('Notifications', 'सूचनाएं')}>
      <div className="max-w-3xl mx-auto space-y-5">
        <Card className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">{t('All Notifications', 'सभी सूचनाएं')}</h2>
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm"
                disabled={markAll.isPending}
                onClick={() => markAll.mutate()}>
                <CheckCheck size={14} /> {t('Mark all read', 'सभी पढ़ें')}
              </Button>
            )}
          </div>
        </Card>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading notifications..." />
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-600 font-medium">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <NotifCard
                key={n._id}
                notif={n}
                onMarkRead={id => markRead.mutate(id)}
                onDelete={id => deleteNotif.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
