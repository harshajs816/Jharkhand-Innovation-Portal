const Notification = require('../models/Notification')
const { success, notFound } = require('../utils/response')

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 30 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ])

  // Format time-ago string
  const withTime = notifications.map(n => ({
    ...n,
    time: timeAgo(n.createdAt),
  }))

  return success(res, { notifications: withTime, total, unreadCount })
}

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  )
  if (!notif) return notFound(res, 'Notification not found.')
  return success(res, { notification: notif })
}

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
  return success(res, {}, 'All notifications marked as read.')
}

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id })
  return success(res, {}, 'Notification deleted.')
}

// ── helper ────────────────────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60)      return 'Just now'
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
