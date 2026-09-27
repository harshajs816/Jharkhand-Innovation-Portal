const express = require('express')

const router = express.Router()

const {
  getAllProposalsForReview,
  reviewProposal,
} = require('../../controllers/UniversityControllers/governmentController')

const {
  protect,
  authorize,
} = require('../../middleware/auth')

// Any authenticated user can view proposals for the government dashboard.
// In production you would restrict this to admin/government roles only.
router.get(
  '/proposals',
  protect,
  getAllProposalsForReview
)

// Only admins can approve or reject a proposal
router.patch(
  '/proposals/:id/review',
  protect,
  authorize('admin', 'university'),
  reviewProposal
)

module.exports = router
