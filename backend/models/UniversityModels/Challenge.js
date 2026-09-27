const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Challenge description is required"],
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Water",
        "Education",
        "Healthcare",
        "Agriculture",
        "Environment",
        "Technology",
        "Infrastructure",
        "Other",
      ],
      default: "Other",
    },

    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // Abhi universityName string ke through challenge assign kar rahe hain.
    assignedUniversity: {
      type: String,
      required: [true, "Assigned university is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["assigned", "accepted", "rejected", "in-progress", "completed"],
      default: "assigned",
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    deadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.UniversityChallenge ||
  mongoose.model('UniversityChallenge', challengeSchema, 'universitychallenges')


