const User         = require('../models/User')
const Notification = require('../models/Notification')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')
const { success, created, badRequest, unauthorized, error } = require('../utils/response')

// ── Helper ────────────────────────────────────────────────────────────────────
const sendTokens = (res, user, statusCode = 200) => {
  const accessToken  = signAccessToken(user._id)
  const refreshToken = signRefreshToken(user._id)

  // httpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   30 * 24 * 60 * 60 * 1000,   // 30 days
  })

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Account created successfully' : 'Login successful',
    data: { accessToken, user },
  })
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, phone, district, address } = req.body

  const exists = await User.findOne({ email })
  if (exists) return badRequest(res, 'Email already registered. Please log in.')

  const count = await User.countDocuments()
  const user  = await User.create({ name, email, password, phone, district, address })

  // Early adopter badge for first 100 users
  if (count < 100) {
    const badge = user.badges.find(b => b.id === 'b3')
    if (badge) { badge.earned = true; badge.earnedAt = new Date() }
    await user.save()

    await Notification.create({
      user:    user._id,
      type:    'badge',
      title:   '🌱 Early Adopter Badge Earned!',
      message: "You're among the first 100 citizens on the platform. Badge unlocked!",
      icon:    '🌱',
    })
  }

  sendTokens(res, user, 201)
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.matchPassword(password)))
    return unauthorized(res, 'Invalid email or password.')

  if (!user.isActive) return unauthorized(res, 'Your account has been deactivated.')

  user.lastLogin = new Date()
  await user.save()

  sendTokens(res, user)
}

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return unauthorized(res, 'No refresh token.')

  try {
    const decoded = verifyRefreshToken(token)
    const user    = await User.findById(decoded.id)
    if (!user) return unauthorized(res, 'User not found.')
    const accessToken = signAccessToken(user._id)
    return success(res, { accessToken })
  } catch {
    return unauthorized(res, 'Invalid or expired refresh token.')
  }
}

// POST /api/auth/logout
exports.logout = (_req, res) => {
  res.clearCookie('refreshToken')
  return success(res, {}, 'Logged out successfully.')
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  // req.user is already populated by protect middleware
  return success(res, { user: req.user })
}
