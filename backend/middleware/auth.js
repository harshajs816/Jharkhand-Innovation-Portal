const { verifyAccessToken } = require('../utils/jwt')
const User = require('../models/User')

const {
  unauthorized,
  forbidden
} = require('../utils/response')


// ─────────────────────────────────────────────────────────────────────────────
// Protect
// Authentication middleware
// ─────────────────────────────────────────────────────────────────────────────

const protect = async (req, res, next) => {
  try {

    let token

    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (
      authHeader &&
      authHeader.startsWith('Bearer ')
    ) {
      token = authHeader.split(' ')[1]
    }


    // Token missing
    if (!token) {
      return unauthorized(
        res,
        'No token provided. Please log in.'
      )
    }


    // Verify JWT
    const decoded = verifyAccessToken(token)


    // Find user
    const user = await User
      .findById(decoded.id)
      .select('-password -refreshToken')


    // User not found
    if (!user) {
      return unauthorized(
        res,
        'User not found.'
      )
    }


    // Account inactive
    if (!user.isActive) {
      return unauthorized(
        res,
        'Your account has been deactivated.'
      )
    }


    // Attach user to request
    req.user = user

    next()

  } catch (err) {

    console.error(
      'Authentication error:',
      err.message
    )


    // JWT expired
    if (err.name === 'TokenExpiredError') {

      return unauthorized(
        res,
        'Token expired. Please log in again.'
      )

    }


    // Invalid JWT
    return unauthorized(
      res,
      'Invalid token.'
    )
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Authorize
// Role-based authorization middleware
// ─────────────────────────────────────────────────────────────────────────────

const authorize = (...roles) => {

  return (req, res, next) => {

    // protect middleware should run before authorize
    if (!req.user) {

      return unauthorized(
        res,
        'Authentication required.'
      )

    }


    // Check role
    if (!roles.includes(req.user.role)) {

      return forbidden(
        res,
        `Role '${req.user.role}' is not allowed to access this resource.`
      )

    }


    next()
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Optional Authentication
// Token ho to user attach hoga.
// Token nahi ho to request continue karegi.
// ─────────────────────────────────────────────────────────────────────────────

const optionalAuth = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization


    if (
      authHeader &&
      authHeader.startsWith('Bearer ')
    ) {

      const token = authHeader.split(' ')[1]

      const decoded = verifyAccessToken(token)


      const user = await User
        .findById(decoded.id)
        .select('-password -refreshToken')


      if (user && user.isActive) {
        req.user = user
      }

    }

  } catch (err) {

    // Optional auth mein invalid token ke wajah se
    // request ko block nahi karna hai.

    req.user = null
  }


  next()
}


// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  protect,
  authorize,
  optionalAuth
}