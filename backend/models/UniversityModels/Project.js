const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    // ── Core links ─────────────────────────────────────────────────────────
    proposal:       { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal',  required: true },
    challenge:      { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    team:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team',      required: true },
    universityName: { type: String, required: true, trim: true },

    // ── Identity ──────────────────────────────────────────────────────────
    title:          { type: String, required: true, trim: true },
    description:    { type: String, trim: true, default: '' },

    // ── Status ────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'on-hold', 'completed', 'cancelled'],
      default: 'active',
    },

    // ── Timeline ──────────────────────────────────────────────────────────
    startDate:      { type: Date, default: Date.now },
    expectedEndDate: { type: Date },
    completedAt:    { type: Date },

    // ── Progress ──────────────────────────────────────────────────────────
    overallProgress:  { type: Number, min: 0, max: 100, default: 0 },
    progressNote:     { type: String, trim: true, default: '' },

    // ── Documents ─────────────────────────────────────────────────────────
    documents: [
      {
        fileName:    { type: String, required: true },
        fileUrl:     { type: String, required: true },  // /uploads/<filename> or external URL
        fileType:    { type: String, default: '' },     // pdf / docx / image etc.
        uploadedAt:  { type: Date, default: Date.now },
        uploadedBy:  { type: String, default: '' },     // uploader name
        description: { type: String, default: '' },
      },
    ],

    // ── Government review ─────────────────────────────────────────────────
    governmentNotes:   { type: String, default: '' },
    lastReviewedAt:    { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
