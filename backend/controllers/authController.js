const User = require('../models/User')
const CitizenProfile = require('../models/CitizenModels/CitizenProfile')
const UniversityProfile = require('../models/UniversityModels/UniversityProfile')
const IndustryProfile = require('../models/CitizenModels/IndustryProfile')
const StudentProfile = require('../models/StudentProfile')

const Notification = require('../models/CitizenModels/Notification')

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt')

const {
  success,
  created,
  badRequest,
  unauthorized,
  error
} = require('../utils/response')


// ─────────────────────────────────────────────────────────────────────────────
// Helper: Send Access + Refresh Tokens
// ─────────────────────────────────────────────────────────────────────────────

const sendTokens = async (res, user, statusCode = 200) => {
  const accessToken = signAccessToken(
    user._id,
    user.role
  )

  const refreshToken = signRefreshToken(
    user._id,
    user.role
  )

  // Store refresh token in database
  user.refreshToken = refreshToken
  await user.save()

  // httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })

  // Build user payload — attach universityName for university role
  const userPayload = user.toJSON ? user.toJSON() : user.toObject()

  if (userPayload.role === 'university') {

    const UniversityProfile = require('../models/UniversityModels/UniversityProfile')

    const profile = await UniversityProfile
      .findOne({ userId: user._id })
      .select('universityName universityCode universityType city district isVerified')

    if (profile) {
      userPayload.universityName = profile.universityName
      userPayload.universityCode = profile.universityCode
      userPayload.universityType = profile.universityType
      userPayload.city           = profile.city
      userPayload.district       = profile.district
      userPayload.isVerified     = profile.isVerified
    }

  }

  return res.status(statusCode).json({
    success: true,
    message:
      statusCode === 201
        ? 'Account created successfully'
        : 'Login successful',

    data: {
      accessToken,
      user: userPayload,
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {

  try {

    const {
      name,
      email,
      password,
      phone,
      role
    } = req.body


    // ── Check existing user ────────────────────────────────────────────────

    const exists = await User.findOne({ email })

    if (exists) {
      return badRequest(
        res,
        'Email already registered. Please log in.'
      )
    }


    // ── Allowed public roles ───────────────────────────────────────────────
    // Admin registration should NEVER be public.

    const allowedRoles = [
      'citizen',
      'university',
      'student',
      'industry'
    ]

    const userRole = role || 'citizen'

    if (!allowedRoles.includes(userRole)) {
      return badRequest(
        res,
        'Invalid registration role.'
      )
    }


    // ── Create User ────────────────────────────────────────────────────────

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole
    })


    // ── Create Role Specific Profile ──────────────────────────────────────

    if (userRole === 'citizen') {

      await CitizenProfile.create({
        userId: user._id
      })

    }


    else if (userRole === 'university') {

      const {
        universityName,
        universityCode,
        registrationNumber,
        establishedYear,
        universityType,
        accreditation,
        website,
        contactEmail,
        contactPhone,
        address,
        city,
        district,
        state,
        pincode,
        description,
        logo
      } = req.body


      if (!universityName) {

        await User.findByIdAndDelete(user._id)

        return badRequest(
          res,
          'University name is required.'
        )
      }


      await UniversityProfile.create({

        userId: user._id,

        universityName,
        universityCode,
        registrationNumber,
        establishedYear,
        universityType,
        accreditation,
        website,
        contactEmail,
        contactPhone,
        address,
        city,
        district,
        state,
        pincode,
        description,
        logo

      })

    }


    else if (userRole === 'industry') {

      const {
        companyName,
        companyCode,
        registrationNumber,
        industryType,
        sector,
        companySize,
        establishedYear,
        website,
        contactEmail,
        contactPhone,
        address,
        city,
        district,
        state,
        pincode,
        description,
        logo,
        linkedin
      } = req.body


      if (!companyName) {

        await User.findByIdAndDelete(user._id)

        return badRequest(
          res,
          'Company name is required.'
        )
      }


      if (!industryType) {

        await User.findByIdAndDelete(user._id)

        return badRequest(
          res,
          'Industry type is required.'
        )
      }


      await IndustryProfile.create({

        userId: user._id,

        companyName,
        companyCode,
        registrationNumber,
        industryType,
        sector,
        companySize,
        establishedYear,
        website,
        contactEmail,
        contactPhone,
        address,
        city,
        district,
        state,
        pincode,
        description,
        logo,
        linkedin

      })

    }


    else if (userRole === 'student') {

      const {
        universityId,
        enrollmentNumber,
        course,
        branch,
        year,
        semester,
        graduationYear,
        skills,
        interests,
        bio
      } = req.body


      if (!course) {

        await User.findByIdAndDelete(user._id)

        return badRequest(
          res,
          'Course is required.'
        )
      }


      await StudentProfile.create({

        userId: user._id,

        universityId,
        enrollmentNumber,
        course,
        branch,
        year,
        semester,
        graduationYear,
        skills,
        interests,
        bio

      })

    }


    // ── Citizen Early Adopter Badge ───────────────────────────────────────

    if (userRole === 'citizen') {

      const count = await User.countDocuments()

      if (count <= 100) {

        const badge = user.badges?.find(
          b => b.id === 'b3'
        )

        if (badge) {

          badge.earned = true
          badge.earnedAt = new Date()

          await user.save()

        }


        await Notification.create({

          user: user._id,

          type: 'badge',

          title: '🌱 Early Adopter Badge Earned!',

          message:
            "You're among the first 100 users on the platform. Badge unlocked!",

          icon: '🌱'

        })

      }

    }


    // ── Send tokens ────────────────────────────────────────────────────────

    return sendTokens(
      res,
      user,
      201
    )

  } catch (err) {

    console.error('Register error:', err)

    return error(
      res,
      'Registration failed.',
      err.message
    )
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body


    const user = await User
      .findOne({ email })
      .select('+password +refreshToken')


    if (
      !user ||
      !(await user.matchPassword(password))
    ) {

      return unauthorized(
        res,
        'Invalid email or password.'
      )

    }


    if (!user.isActive) {

      return unauthorized(
        res,
        'Your account has been deactivated.'
      )

    }


    user.lastLogin = new Date()

    await user.save()


    return sendTokens(
      res,
      user
    )

  } catch (err) {

    console.error('Login error:', err)

    return error(
      res,
      'Login failed.',
      err.message
    )
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

exports.refresh = async (req, res) => {

  try {

    const token = req.cookies?.refreshToken

    if (!token) {

      return unauthorized(
        res,
        'No refresh token.'
      )

    }


  const decoded = verifyRefreshToken(token)

const user = await User
  .findById(decoded.id)
  .select('+refreshToken')

if (!user) {
  return unauthorized(
    res,
    'User not found.'
  )
}

if (!user.isActive) {
  return unauthorized(
    res,
    'Your account has been deactivated.'
  )
}

// Check token stored in DB
if (
  !user.refreshToken ||
  user.refreshToken !== token
) {
  return unauthorized(
    res,
    'Invalid refresh token.'
  )
}

const accessToken = signAccessToken(
  user._id,
  user.role
)

return success(
  res,
  {
    accessToken,
    user,
  }
)

  } catch (err) {

    console.error('Refresh token error:', err.message)

    return unauthorized(
      res,
      'Invalid or expired refresh token.'
    )
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

exports.logout = async (req, res) => {

  try {

    if (req.user) {

      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken: null
          }
        }
      )

    }


    res.clearCookie(
      'refreshToken',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    )


    return success(
      res,
      {},
      'Logged out successfully.'
    )

  } catch (err) {

    console.error('Logout error:', err)

    return error(
      res,
      'Logout failed.',
      err.message
    )
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────

exports.getMe = async (req, res) => {

  try {

    // req.user is populated by protect middleware
    const user = req.user.toJSON ? req.user.toJSON() : req.user.toObject()

    // For university users, attach universityName from UniversityProfile
    // so the frontend doesn't need a second API call
    if (user.role === 'university') {

      const UniversityProfile = require('../models/UniversityModels/UniversityProfile')

      const profile = await UniversityProfile
        .findOne({ userId: user._id })
        .select('universityName universityCode universityType city district isVerified')

      if (profile) {
        user.universityName  = profile.universityName
        user.universityCode  = profile.universityCode
        user.universityType  = profile.universityType
        user.city            = profile.city
        user.district        = profile.district
        user.isVerified      = profile.isVerified
      }

    }

    return success(
      res,
      { user }
    )

  } catch (err) {

    return error(
      res,
      'Unable to fetch user.'
    )
  }
}