const router   = require('express').Router()
const { body } = require('express-validator')
const ctrl     = require('../controllers/pilotFeedbackController')
const validate = require('../middleware/validate')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/pending',          ctrl.getPending)
router.get('/challenge/:id',    ctrl.getForChallenge)
router.post('/',
  [
    body('overallRating').isInt({ min: 1, max: 5 }).withMessage('Rating 1–5 required'),
    body('actualImpact').trim().isLength({ min: 20 }).withMessage('Describe impact (min 20 chars)'),
    body('wouldRecommend').isIn(['yes','no','maybe']).withMessage('Invalid recommendation value'),
  ],
  validate,
  ctrl.submit
)

module.exports = router
