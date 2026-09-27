const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Member email is required"],
      trim: true,
      lowercase: true,
    },

    role: {
      type: String,
      // Accepts both the frontend dropdown values and the legacy lowercase values
      enum: [
        "Team Lead",
        "Member",
        "Faculty Mentor",
        "Researcher",
        "faculty",
        "student",
      ],
      required: [true, "Member role is required"],
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
    },

    // Kis challenge par team work karegi
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

    members: {
      type: [teamMemberSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
