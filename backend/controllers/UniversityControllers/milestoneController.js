const MilestoneUpdate = require("../../models/UniversityModels/MilestoneUpdate");
const Proposal = require("../../models/UniversityModels/Proposal");
const UniversityProfile = require("../../models/UniversityModels/UniversityProfile");

// ----------------------------------------------------
// Submit milestone / progress update
// POST /api/milestones
// ----------------------------------------------------
const submitMilestoneUpdate = async (req, res) => {
  try {
    const {
      proposalId,
      milestoneTitle,
      description,
      completionPercentage,
      status,
      evidenceLinks,
    } = req.body;

    // Fetch university profile to get universityName
    const universityProfile = await UniversityProfile.findOne({
      userId: req.user._id,
    });
    
    if (!universityProfile) {
      return res.status(404).json({
        success: false,
        message: "University profile not found for this user",
      });
    }
    
    const universityName = universityProfile.universityName;

    // Basic validation
    if (
      !proposalId ||
      !milestoneTitle ||
      !description ||
      completionPercentage === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Proposal ID, milestone title, description and completion percentage are required",
      });
    }

    // Frontend sends number inputs as strings in JSON — coerce first
    const percentage = Number(completionPercentage);

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: "Completion percentage must be a number between 0 and 100",
      });
    }

    // Evidence links array honi chahiye, for example: ["https://..."]
    if (evidenceLinks && !Array.isArray(evidenceLinks)) {
      return res.status(400).json({
        success: false,
        message: "Evidence links must be sent as an array",
      });
    }

    // Proposal only logged-in university ka hona chahiye
    const proposal = await Proposal.findOne({
      _id: proposalId,
      universityName,
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found or it does not belong to your university",
      });
    }

    // Real workflow:
    // Government approval ke baad hi project progress update submit ho.
    if (proposal.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Milestone updates can be submitted only after the proposal is approved",
      });
    }

    const milestoneUpdate = await MilestoneUpdate.create({
      proposal: proposal._id,
      team: proposal.team,
      challenge: proposal.challenge,
      universityName,
      milestoneTitle,
      description,
      completionPercentage: percentage,
      status: status || "on-track",
      evidenceLinks: evidenceLinks || [],
    });

    res.status(201).json({
      success: true,
      message: "Milestone update submitted successfully",
      milestoneUpdate,
    });
  } catch (error) {
    console.error("Submit milestone update error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to submit milestone update",
      error: error.message,
    });
  }
};

// ----------------------------------------------------
// Get all milestone updates of logged-in university
// GET /api/milestones/my
// ----------------------------------------------------
const getMyMilestoneUpdates = async (req, res) => {
  try {
    // Fetch university profile to get universityName
    const universityProfile = await UniversityProfile.findOne({
      userId: req.user._id,
    });
    
    if (!universityProfile) {
      return res.status(404).json({
        success: false,
        message: "University profile not found for this user",
      });
    }
    
    const universityName = universityProfile.universityName;

    const milestoneUpdates = await MilestoneUpdate.find({
      universityName,
    })
      .populate("proposal", "title status estimatedBudget estimatedTimelineMonths")
      .populate("team", "teamName members")
      .populate("challenge", "title district category priority")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: milestoneUpdates.length,
      message: "Milestone updates fetched successfully",
      milestoneUpdates,
    });
  } catch (error) {
    console.error("Get milestone updates error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch milestone updates",
      error: error.message,
    });
  }
};

module.exports = {
  submitMilestoneUpdate,
  getMyMilestoneUpdates,
};
