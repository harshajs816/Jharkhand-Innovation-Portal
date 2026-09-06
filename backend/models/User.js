const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const BadgeSchema = new mongoose.Schema({
  id:     String,
  name:   String,
  icon:   String,
  desc:   String,
  earned: { type: Boolean, default: false },
  earnedAt: Date,
}, { _id: false })

const UserSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:   { type: String, trim: true },
  password:{ type: String, required: true, select: false },
  role:    { type: String, enum: ['citizen','admin','university','student','industry'], default: 'citizen' },
  district:{ type: String, default: 'Ranchi' },
  address: { type: String },
  avatar:  { type: String },

  // Gamification
  badges: {
    type: [BadgeSchema],
    default: [
      { id: 'b1', name: 'Civic Catalyst',    icon: '🏆', desc: 'Your challenge led to a deployed solution',     earned: false },
      { id: 'b2', name: 'Community Leader',  icon: '👑', desc: 'Received 100+ community endorsements',          earned: false },
      { id: 'b3', name: 'Early Adopter',     icon: '🌱', desc: 'Among the first 100 platform registrations',    earned: false },
      { id: 'b4', name: 'Impact Maker',      icon: '⚡', desc: 'Have 5 challenges reach Deployed status',       earned: false },
      { id: 'b5', name: 'Problem Solver',    icon: '🔬', desc: 'Collaborate on a university research team',     earned: false },
      { id: 'b6', name: 'District Champion', icon: '🎯', desc: 'Top contributor in your district for a month', earned: false },
    ],
  },

  // Computed stats (denormalised for quick reads)
  totalSubmitted:   { type: Number, default: 0 },
  challengesSolved: { type: Number, default: 0 },
  totalUpvotes:     { type: Number, default: 0 },

  // Auth
  refreshToken:   { type: String, select: false },
  isActive:       { type: Boolean, default: true },
  lastLogin:      { type: Date },
}, { timestamps: true })

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Instance method
UserSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password)
}

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  return obj
}

module.exports = mongoose.model('User', UserSchema)
