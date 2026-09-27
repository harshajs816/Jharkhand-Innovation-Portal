const mongoose = require('mongoose');

const IndustryProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    companyCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true
    },

    registrationNumber: {
      type: String,
      trim: true
    },

    industryType: {
      type: String,
      required: true,
      trim: true
    },

    sector: {
      type: String,
      trim: true
    },

    companySize: {
      type: String,
      enum: [
        'startup',
        'small',
        'medium',
        'large',
        'enterprise'
      ],
      default: 'startup'
    },

    establishedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear()
    },

    website: {
      type: String,
      trim: true
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    contactPhone: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300
    },

    city: {
      type: String,
      trim: true
    },

    district: {
      type: String,
      trim: true
    },

    state: {
      type: String,
      trim: true,
      default: 'Jharkhand'
    },

    pincode: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    logo: {
      type: String,
      default: null
    },

    linkedin: {
      type: String,
      trim: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('IndustryProfile', IndustryProfileSchema);