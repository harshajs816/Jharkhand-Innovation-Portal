require('dotenv').config()
require('express-async-errors')

const express      = require('express')
const cors         = require('cors')
const helmet       = require('helmet')
const morgan       = require('morgan')
const rateLimit    = require('express-rate-limit')
const path         = require('path')
const cookieParser = require('cookie-parser')

const connectDB = require('./config/db')

// ── Citizen / shared route imports ───────────────────────────────────────────
const authRoutes          = require('./routes/authRoutes')
const challengeRoutes     = require('./routes/CitizenRoutes/challengeRoutes')
const notificationRoutes  = require('./routes/CitizenRoutes/notificationRoutes')
const successStoryRoutes  = require('./routes/CitizenRoutes/successStoryRoutes')
const pilotFeedbackRoutes = require('./routes/CitizenRoutes/pilotFeedbackRoutes')
const profileRoutes       = require('./routes/CitizenRoutes/profileRoutes')

// ── University route imports ──────────────────────────────────────────────────
// NOTE: All university routes are mounted under /api/university/* to avoid
//       conflicts with the citizen /api/challenges router.
const uniChallengeRoutes = require('./routes/UniversityRoutes/challengeRoutes')
const teamRoutes         = require('./routes/UniversityRoutes/teamRoutes')
const proposalRoutes     = require('./routes/UniversityRoutes/proposalRoutes')
const milestoneRoutes    = require('./routes/UniversityRoutes/milestoneRoutes')
const governmentRoutes   = require('./routes/UniversityRoutes/governmentRoutes')
const adminRoutes        = require('./routes/adminRoutes')
const uniProfileRoutes   = require('./routes/UniversityRoutes/profileRoutes')
const projectRoutes      = require('./routes/UniversityRoutes/projectRoutes')

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB()

const app = express()

// ── Security & Utilities ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  skip:     (req) => req.method === 'GET',
  message:  { success: false, message: 'Too many auth requests, please try again later.' },
}))

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── Citizen / shared routes ───────────────────────────────────────────────────
app.use('/api/auth',            authRoutes)
app.use('/api/challenges',      challengeRoutes)
app.use('/api/notifications',   notificationRoutes)
app.use('/api/success-stories', successStoryRoutes)
app.use('/api/pilot-feedback',  pilotFeedbackRoutes)
app.use('/api/profile',         profileRoutes)

// ── University routes (all under /api/university) ────────────────────────────
app.use('/api/university/challenges', uniChallengeRoutes)
app.use('/api/university/teams',      teamRoutes)
app.use('/api/university/proposals',  proposalRoutes)
app.use('/api/university/milestones', milestoneRoutes)
app.use('/api/university/projects',   projectRoutes)
app.use('/api/university/profile',    uniProfileRoutes)
app.use('/api/government',            governmentRoutes)
app.use('/api/admin',                 adminRoutes)

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
