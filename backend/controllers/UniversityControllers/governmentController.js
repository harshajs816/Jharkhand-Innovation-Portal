const Proposal = require("../../models/UniversityModels/Proposal");

// ----------------------------------------------------
// Get all proposals for Government review
// GET /api/government/proposals
// ----------------------------------------------------
const getAllProposalsForReview = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    // Populates team and challenge info
    const proposals = await Proposal.find(query)
      .populate("team", "teamName members universityName")
      .populate("teamId", "teamName members universityName")
      .populate(
        "challenge",
        "title description district category priority status deadline"
      )
      .populate(
        "challengeId",
        "title description district category priority status deadline"
      )
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proposals.length,
      message: "Proposals fetched successfully for government review",
      proposals,
    });
  } catch (error) {
    console.error("Get government proposals error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch proposals for review",
      error: error.message,
    });
  }
};

// ----------------------------------------------------
// Approve or reject one proposal
// PATCH /api/government/proposals/:id/review
//
// Supports both body styles:
// { "action": "approve", "reviewComment": "Good proposal" }
// OR
// { "status": "approved", "remarks": "Good proposal" }
// ----------------------------------------------------
const reviewProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, status, reviewComment, remarks } = req.body;

    // Normalizing action: 'approve'/'approved' -> 'approved', 'reject'/'rejected' -> 'rejected'
    let decision = (action || status || "").toLowerCase();
    if (decision === "approve") decision = "approved";
    if (decision === "reject") decision = "rejected";

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'approve' ('approved') or 'reject' ('rejected')",
      });
    }

    const finalComment = (reviewComment || remarks || "").trim();

    // Rejection case me comment / remarks mandatory hai
    if (decision === "rejected" && !finalComment) {
      return res.status(400).json({
        success: false,
        message: "A review comment or remark is required when rejecting a proposal",
      });
    }

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // Ek proposal par final decision sirf ek baar
    if (["approved", "rejected"].includes(proposal.status)) {
      return res.status(400).json({
        success: false,
        message: `This proposal has already been ${proposal.status}`,
      });
    }

    // Updating proposal fields
    proposal.status = decision;
    proposal.reviewComment = finalComment;
    proposal.governmentRemarks = finalComment;
    proposal.reviewedBy = req.user._id;
    proposal.reviewedAt = new Date();

    await proposal.save();

    res.status(200).json({
      success: true,
      message: `Proposal ${decision} successfully`,
      proposal,
    });
  } catch (error) {
    console.error("Review proposal error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to review proposal",
      error: error.message,
    });
  }
};

module.exports = {
  getAllProposalsForReview,
  reviewProposal,
};
