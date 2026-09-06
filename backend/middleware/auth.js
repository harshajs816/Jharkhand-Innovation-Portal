const { verifyAccessToken } = require('../utils/jwt')
const User                  = require('../models/User')
const { unauthorized, forbidden } = require('../utils/response')

/**
 * protect – verifies JWT and attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) return unauthorized(res, 'No token provided. Please log in.')

    const decoded = verifyAccessToken(token)
    const user    = await User.findById(decoded.id)
    if (!user || !user.isActive) return unauthorized(res, 'User not found or deactivated.')

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired. Please log in again.')
    return unauthorized(res, 'Invalid token.')
  }
}

/**
 * authorize(...roles) – role-based guard, used after protect
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return forbidden(res, `Role '${req.user.role}' is not allowed to access this resource.`)
  }
  next()
}

/**
 * optionalAuth – attaches req.user if token present, otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const token   = header.split(' ')[1]
      const decoded = verifyAccessToken(token)
      req.user      = await User.findById(decoded.id)
    }
  } catch (_) { /* ignore */ }
  next()
}

module.exports = { protect, authorize, optionalAuth }
