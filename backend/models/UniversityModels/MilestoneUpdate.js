const mongoose = require("mongoose");

const milestoneUpdateSchema = new mongoose.Schema(
  {
    milestoneTitle: {
      type: String,
      required: [true, "Milestone title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Milestone description is required"],
      trim: true,
    },

    // Overall project progress, 0 to 100
    completionPercentage: {
      type: Number,
      required: [true, "Completion percentage is required"],
      min: [0, "Progress cannot be less than 0"],
      max: [100, "Progress cannot be greater than 100"],
    },

    status: {
      type: String,
      enum: ["on-track", "delayed", "completed"],
      default: "on-track",
    },

    // Evidence can be Google Drive, document, photo, GitHub, video links, etc.
    evidenceLinks: {
      type: [String],
      default: [],
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    // Linked proposal
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: [true, "Proposal ID is required"],
    },

    // These will be fetched from the linked proposal/team
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },

    universityName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const MilestoneUpdate = mongoose.model(
  "MilestoneUpdate",
  milestoneUpdateSchema
);

module.exports = MilestoneUpdate;
