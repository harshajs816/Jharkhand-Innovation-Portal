const express = require("express");
const router = express.Router();

const {
  submitMilestoneUpdate,
  getMyMilestoneUpdates,
} = require("../../controllers/UniversityControllers/milestoneController");

const { protect } = require("../../middleware/auth");

// University submits a new progress update
router.post("/", protect, submitMilestoneUpdate);

// University sees its submitted updates
router.get("/my", protect, getMyMilestoneUpdates);

module.exports = router;
