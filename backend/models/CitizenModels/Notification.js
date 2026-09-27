const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:    { type: String, enum: ['status','endorsement','university','ai','badge','feedback','system'], default: 'system' },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  icon:    { type: String, default: '🔔' },
  read:    { type: Boolean, default: false },
  link:    { type: String },  // optional front-end route to navigate on click
  meta:    { type: mongoose.Schema.Types.Mixed },  // challengeId, badgeId, etc.
}, { timestamps: true })

NotificationSchema.index({ user: 1, read: 1 })
NotificationSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Notification', NotificationSchema)
