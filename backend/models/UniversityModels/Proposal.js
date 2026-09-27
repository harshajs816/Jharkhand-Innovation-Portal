const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Proposal title is required"],
      trim: true,
    },

    solutionSummary: {
      type: String,
      required: [true, "Solution summary is required"],
      trim: true,
    },

    detailedPlan: {
      type: String,
      required: [true, "Detailed plan is required"],
      trim: true,
    },

    estimatedBudget: {
      type: Number,
      required: [true, "Estimated budget is required"],
      min: [0, "Budget cannot be negative"],
    },

    estimatedTimelineMonths: {
      type: Number,
      required: [true, "Estimated timeline is required"],
      min: [1, "Timeline must be at least 1 month"],
    },

    // Kis team ne proposal submit kiya
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team ID is required"],
    },

    // Kis accepted challenge ke liye proposal hai
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: [true, "Challenge ID is required"],
    },

    universityName: {
      type: String,
      required: true,
      trim: true,
    },

    documentLink: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["submitted", "under-review", "approved", "rejected"],
      default: "submitted",
    },

    reviewComment: {
      type: String,
      default: "",
      trim: true,
    },

    governmentRemarks: {
      type: String,
      default: "",
    },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Proposal = mongoose.model("Proposal", proposalSchema);

module.exports = Proposal;
