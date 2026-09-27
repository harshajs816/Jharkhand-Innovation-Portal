const mongoose = require('mongoose');

const CitizenProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    district: {
      type: String,
      trim: true,
      default: 'Ranchi'
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

    state: {
      type: String,
      trim: true,
      default: 'Jharkhand'
    },

    pincode: {
      type: String,
      trim: true
    },

    occupation: {
      type: String,
      trim: true
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CitizenProfile', CitizenProfileSchema);