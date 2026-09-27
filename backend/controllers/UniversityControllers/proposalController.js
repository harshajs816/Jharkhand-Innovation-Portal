const Proposal = require("../../models/UniversityModels/Proposal");
const Team = require("../../models/UniversityModels/Team");
const Challenge = require("../../models/UniversityModels/Challenge");
const UniversityProfile = require("../../models/UniversityModels/UniversityProfile");

// ----------------------------------------------------
// Submit a proposal for an accepted challenge
// POST /api/proposals
// ----------------------------------------------------
const submitProposal = async (req, res) => {
  try {
    const {
      title,
      solutionSummary,
      detailedPlan,
      estimatedBudget,
      estimatedTimelineMonths,
      teamId,
      challengeId,   // frontend sends this — use it for direct validation
      documentLink,
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

    if (
      !title ||
      !solutionSummary ||
      !detailedPlan ||
      estimatedBudget === undefined ||
      estimatedTimelineMonths === undefined ||
      !teamId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, solution summary, detailed plan, budget, timeline and team ID are required",
      });
    }

    // Team must belong to the logged-in university and be active
    const team = await Team.findOne({
      _id: teamId,
      universityName,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found or it does not belong to your university",
      });
    }

    // Resolve which challenge to use:
    // Prefer the challengeId sent by the frontend; fall back to the one on the team
    const resolvedChallengeId = challengeId || team.challenge;

    // The linked challenge must be accepted and belong to this university
    const challenge = await Challenge.findOne({
      _id: resolvedChallengeId,
      assignedUniversity: universityName,
      status: "accepted",
    });

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: "The linked challenge is not accepted or is unavailable",
      });
    }

    // First version rule: one team can submit one proposal
    const existingProposal = await Proposal.findOne({ team: teamId });

    if (existingProposal) {
      return res.status(409).json({
        success: false,
        message: "This team has already submitted a proposal",
      });
    }

    const proposal = await Proposal.create({
      title,
      solutionSummary,
      detailedPlan,
      estimatedBudget,
      estimatedTimelineMonths,
      team: team._id,
      challenge: challenge._id,
      universityName,
      documentLink: documentLink || "",
    });

    res.status(201).json({
      success: true,
      message: "Proposal submitted successfully",
      proposal,
    });
  } catch (error) {
    console.error("Submit proposal error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to submit proposal",
      error: error.message,
    });
  }
};

// ----------------------------------------------------
// Get proposals submitted by logged-in university
// GET /api/proposals/my
// ----------------------------------------------------
const getMyProposals = async (req, res) => {
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

    const proposals = await Proposal.find({ universityName })
      .populate("team", "teamName members")
      .populate("challenge", "title district category priority status deadline")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proposals.length,
      message: "Proposals fetched successfully",
      proposals,
    });
  } catch (error) {
    console.error("Get proposals error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch proposals",
      error: error.message,
    });
  }
};

module.exports = {
  submitProposal,
  getMyProposals,
};
