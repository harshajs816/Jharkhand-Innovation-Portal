const User      = require('../models/User')
const Challenge = require('../models/Challenge')
const { success, badRequest } = require('../utils/response')

// GET /api/profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).lean()

  // Recompute live stats
  const [totalSubmitted, challengesSolved, totalUpvotes] = await Promise.all([
    Challenge.countDocuments({ submittedBy: user._id, isDeleted: false }),
    Challenge.countDocuments({ submittedBy: user._id, isDeleted: false, status: { $in: ['deployed','impact-measured','completed'] } }),
    Challenge.aggregate([
      { $match: { submittedBy: user._id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$endorseCount' } } },
    ]).then(r => r[0]?.total ?? 0),
  ])

  return success(res, {
    user: { ...user, totalSubmitted, challengesSolved, totalUpvotes },
  })
}

// PATCH /api/profile
exports.updateProfile = async (req, res) => {
  const allowed  = ['name', 'phone', 'district', 'address', 'avatar']
  const updates  = {}
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
  return success(res, { user }, 'Profile updated.')
}

// PATCH /api/profile/password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id).select('+password')

  const isMatch = await user.matchPassword(currentPassword)
  if (!isMatch) return badRequest(res, 'Current password is incorrect.')

  user.password = newPassword
  await user.save()
  return success(res, {}, 'Password changed successfully.')
}
