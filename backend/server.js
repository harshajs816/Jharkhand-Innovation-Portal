require('dotenv').config()
require('express-async-errors')

const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')
const path       = require('path')
const cookieParser = require('cookie-parser')

const connectDB  = require('./config/db')

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/authRoutes')
const challengeRoutes     = require('./routes/challengeRoutes')
const notificationRoutes  = require('./routes/notificationRoutes')
const successStoryRoutes  = require('./routes/successStoryRoutes')
const pilotFeedbackRoutes = require('./routes/pilotFeedbackRoutes')
const profileRoutes       = require('./routes/profileRoutes')

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB()

const app = express()

// ── Security & Utilities ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      30,
  message:  { success: false, message: 'Too many auth requests, please try again later.' },
}))

// ── Static file serving (uploads) ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes)
app.use('/api/challenges',     challengeRoutes)
app.use('/api/notifications',  notificationRoutes)
app.use('/api/success-stories',successStoryRoutes)
app.use('/api/pilot-feedback', pilotFeedbackRoutes)
app.use('/api/profile',        profileRoutes)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'API is running', timestamp: new Date() })
)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
)

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err.message)
  const status = err.statusCode || err.status || 500
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`)
  console.log(`🌿  Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
