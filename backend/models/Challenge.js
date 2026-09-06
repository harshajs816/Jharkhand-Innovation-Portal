const mongoose = require('mongoose')

const TimelineEntrySchema = new mongoose.Schema({
  status:  { type: String, required: true },
  date:    { type: Date,   default: Date.now },
  note:    { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false })

const AIAnalysisSchema = new mongoose.Schema({
  category:         String,
  priorityScore:    { type: Number, min: 0, max: 100 },
  severity:         { type: String, enum: ['Low','Medium','High','Critical'] },
  estimatedImpact:  String,
  requiredSkills:   [String],
  suggestedSolutions: [String],
  duplicatesFound:  { type: Number, default: 0 },
  analyzedAt:       { type: Date, default: Date.now },
}, { _id: false })

const ChallengeSchema = new mongoose.Schema({
  // Auto-generated readable ID, e.g. JH-2026-000124
  challengeId: { type: String, unique: true },

  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Core fields
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category:    { type: String, required: true },
  subCategory: { type: String },
  urgency:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },

  // Location
  district:   { type: String, required: true },
  city:       { type: String },
  address:    { type: String },
  latitude:   { type: Number },
  longitude:  { type: Number },

  // Impact
  affectedPeople:   { type: Number, default: 0 },
  existingAttempts: { type: String },
  expectedSolution: { type: String },

  // Media (stored paths)
  images:    [String],
  videos:    [String],
  documents: [String],

  // Lifecycle
  status: {
    type: String,
    enum: [
      'submitted','ai-analysis','under-review','validated',
      'university-matching','university-accepted','team-formed',
      'proposal-submitted','industry-collaboration','prototype',
      'pilot-testing','deployed','impact-measured','completed',
    ],
    default: 'submitted',
  },

  timeline: [TimelineEntrySchema],

  // AI
  aiAnalysis: AIAnalysisSchema,

  // Community engagement
  endorsements:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  endorseCount:  { type: Number, default: 0 },

  // Visibility
  isPublic:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  // University / Industry links
  assignedUniversity: { type: String },
  assignedIndustry:   { type: String },
}, { timestamps: true })

// ── Auto-generate challengeId before first save ───────────────────────────
ChallengeSchema.pre('save', async function (next) {
  if (this.isNew && !this.challengeId) {
    const count = await mongoose.model('Challenge').countDocuments()
    const year  = new Date().getFullYear()
    this.challengeId = `JH-${year}-${String(count + 1).padStart(6, '0')}`
  }
  // Push initial timeline entry
  if (this.isNew) {
    this.timeline.push({ status: 'submitted', note: 'Challenge submitted by citizen.' })
  }
  next()
})

// ── Keep endorseCount in sync ─────────────────────────────────────────────
ChallengeSchema.methods.addEndorsement = async function (userId) {
  const id = userId.toString()
  const already = this.endorsements.map(e => e.toString()).includes(id)
  if (!already) {
    this.endorsements.push(userId)
    this.endorseCount = this.endorsements.length
    await this.save()
    return true
  }
  return false
}

// ── Text search index ─────────────────────────────────────────────────────
ChallengeSchema.index({ title: 'text', description: 'text' })
ChallengeSchema.index({ submittedBy: 1 })
ChallengeSchema.index({ status: 1 })
ChallengeSchema.index({ district: 1 })
ChallengeSchema.index({ isPublic: 1, isDeleted: 1 })

module.exports = mongoose.model('Challenge', ChallengeSchema)
