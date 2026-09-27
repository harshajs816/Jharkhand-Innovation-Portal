const express = require('express');
const router  = express.Router();

const {
  createChallenge,
  getAssignedChallenges,
  getAvailableChallenges,
  getAcceptedChallenges,
  respondToChallenge,
  updateChallengeStatus,
} = require('../../controllers/UniversityControllers/challengeController');

const { protect } = require('../../middleware/auth');

router.post('/',                    protect, createChallenge);
router.get('/assigned',             protect, getAssignedChallenges);
router.get('/available',            protect, getAvailableChallenges);
router.get('/accepted',             protect, getAcceptedChallenges);
router.patch('/:id/respond',        protect, respondToChallenge);
router.patch('/:id/status',         protect, updateChallengeStatus);

module.exports = router;
