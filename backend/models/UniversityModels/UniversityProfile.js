const mongoose = require('mongoose');

// ── Reusable sub-schemas ──────────────────────────────────────────────────────

const namedItemSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' } },
  { _id: false }
);

const labSchema = new mongoose.Schema(
  { name:        { type: String, required: true, trim: true },
    department:  { type: String, trim: true, default: '' },
    equipment:   { type: String, trim: true, default: '' },
    incharge:    { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' } },
  { _id: false }
);

const technologySchema = new mongoose.Schema(
  { name:        { type: String, required: true, trim: true },
    category:    { type: String, trim: true, default: '' }, // e.g. "IoT", "Biotech"
    description: { type: String, trim: true, default: '' },
    patented:    { type: Boolean, default: false } },
  { _id: false }
);

const incubationSchema = new mongoose.Schema(
  { name:        { type: String, required: true, trim: true },
    established: { type: Number },
    focus:       { type: String, trim: true, default: '' }, // e.g. "Agri-Tech, FinTech"
    capacity:    { type: Number, default: 0 },              // No. of startups
    description: { type: String, trim: true, default: '' } },
  { _id: false }
);

// ── Main schema ────────────────────────────────────────────────────────────────

const UniversityProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // ── Identity ───────────────────────────────────────────────────────────
    universityName:     { type: String, required: true, trim: true, maxlength: 200 },
    universityCode:     { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    registrationNumber: { type: String, trim: true },
    establishedYear:    { type: Number, min: 1800, max: new Date().getFullYear() },
    universityType:     {
      type: String,
      enum: ['government', 'private', 'central', 'state', 'deemed', 'other'],
      default: 'state',
    },
    accreditation: { type: String, trim: true },
    website:       { type: String, trim: true },

    // ── Contact ────────────────────────────────────────────────────────────
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },

    // ── Location ──────────────────────────────────────────────────────────
    address:  { type: String, trim: true, maxlength: 300 },
    city:     { type: String, trim: true },
    district: { type: String, trim: true },
    state:    { type: String, trim: true, default: 'Jharkhand' },
    pincode:  { type: String, trim: true },

    // ── Description ───────────────────────────────────────────────────────
    description: { type: String, trim: true, maxlength: 2000 },

    // ── Departments ───────────────────────────────────────────────────────
    // e.g. "Computer Science & Engineering", "Agricultural Sciences"
    departments: [namedItemSchema],

    // ── Faculty Expertise ─────────────────────────────────────────────────
    // Areas of expertise offered by faculty, e.g. "Machine Learning", "Water Management"
    facultyExpertise: [
      {
        area:        { type: String, required: true, trim: true },
        facultyName: { type: String, trim: true, default: '' },
        department:  { type: String, trim: true, default: '' },
      },
    ],

    // ── Research Areas ────────────────────────────────────────────────────
    researchAreas: [namedItemSchema],   // e.g. "Renewable Energy", "Food Security"

    // ── Labs ──────────────────────────────────────────────────────────────
    labs: [labSchema],

    // ── Innovation Centres ────────────────────────────────────────────────
    innovationCentres: [namedItemSchema],

    // ── Incubation Facilities ─────────────────────────────────────────────
    incubationFacilities: [incubationSchema],

    // ── Available Technologies ────────────────────────────────────────────
    availableTechnologies: [technologySchema],

    // ── Courses ───────────────────────────────────────────────────────────
    courses: [
      {
        name:       { type: String, required: true, trim: true },
        code:       { type: String, trim: true },
        department: { type: String, trim: true },
        duration:   { type: Number, min: 1 },
        degree:     { type: String, trim: true },
        mode: {
          type: String,
          enum: ['full-time', 'part-time', 'online', 'hybrid'],
          default: 'full-time',
        },
        intake: { type: Number, min: 0, default: 0 },
        branches: [
          {
            name:   { type: String, required: true, trim: true },
            intake: { type: Number, min: 0, default: 0 },
          },
        ],
      },
    ],

    // ── Meta ──────────────────────────────────────────────────────────────
    logo:       { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UniversityProfile', UniversityProfileSchema);
