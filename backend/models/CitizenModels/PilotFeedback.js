const mongoose = require('mongoose')

const PilotFeedbackSchema = new mongoose.Schema({
  challenge:          { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  submittedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },

  // Ratings 1-5
  overallRating:       { type: Number, min: 1, max: 5, required: true },
  effectivenessScore:  { type: Number, min: 1, max: 5 },
  usabilityScore:      { type: Number, min: 1, max: 5 },
  sustainabilityScore: { type: Number, min: 1, max: 5 },

  actualImpact:   { type: String, required: true },
  improvements:   { type: String },
  wouldRecommend: { type: String, enum: ['yes','no','maybe'], required: true },
}, { timestamps: true })

PilotFeedbackSchema.index({ challenge: 1, submittedBy: 1 }, { unique: true })

module.exports = mongoose.model('PilotFeedback', PilotFeedbackSchema)
