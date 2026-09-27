const express = require("express");
const router = express.Router();

const {
  submitProposal,
  getMyProposals,
} = require("../../controllers/UniversityControllers/proposalController");

const { protect } = require("../../middleware/auth");

router.post("/", protect, submitProposal);
router.get("/my", protect, getMyProposals);

module.exports = router;
