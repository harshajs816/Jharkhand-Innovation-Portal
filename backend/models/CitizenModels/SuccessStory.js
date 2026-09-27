const mongoose = require('mongoose')

const SuccessStorySchema = new mongoose.Schema({
  challenge:   { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  title:       { type: String, required: true },
  impact:      { type: String, required: true },  // e.g. "500+ Farmers benefited"
  description: { type: String, required: true },
  district:    { type: String, required: true },
  category:    { type: String, required: true },
  image:       { type: String },

  university:  { type: String },
  industry:    { type: String },

  completedDate: { type: Date },
  isPublished:   { type: Boolean, default: true },
}, { timestamps: true })

SuccessStorySchema.index({ district: 1 })
SuccessStorySchema.index({ category: 1 })

module.exports = mongoose.model('SuccessStory', SuccessStorySchema)
