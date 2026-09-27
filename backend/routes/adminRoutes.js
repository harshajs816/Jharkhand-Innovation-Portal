const router = require('express').Router()
const ctrl   = require('../controllers/adminController')
const { protect } = require('../middleware/auth')

router.get('/analytics',               protect, ctrl.getAnalytics)
router.get('/universities',            protect, ctrl.getUniversities)
router.get('/challenges',              protect, ctrl.getChallengesForReview)
router.patch('/challenges/:id/review', protect, ctrl.reviewChallenge)
router.post('/challenges/merge',       protect, ctrl.mergeChallenges)

module.exports = router
