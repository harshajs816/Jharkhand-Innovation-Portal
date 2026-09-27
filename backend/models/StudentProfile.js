const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UniversityProfile',
      default: null
    },

    enrollmentNumber: {
      type: String,
      trim: true
    },

    course: {
      type: String,
      trim: true,
      required: true
    },

    branch: {
      type: String,
      trim: true
    },

    year: {
      type: Number,
      min: 1,
      max: 6
    },

    semester: {
      type: Number,
      min: 1,
      max: 12
    },

    graduationYear: {
      type: Number
    },

    skills: {
      type: [String],
      default: []
    },

    interests: {
      type: [String],
      default: []
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },

    resume: {
      type: String,
      default: null
    },

    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);