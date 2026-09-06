const router   = require('express').Router()
const { body } = require('express-validator')
const ctrl     = require('../controllers/challengeController')
const validate = require('../middleware/validate')
const { protect, authorize, optionalAuth } = require('../middleware/auth')
const upload   = require('../middleware/upload')

// Public / optional-auth
router.get('/public',  optionalAuth, ctrl.getPublicChallenges)
router.get('/stats',   ctrl.getDashboardStats)

// Protected
router.use(protect)

router.get('/my',  ctrl.getMyChallenges)
router.get('/:id', ctrl.getChallengeById)

router.post('/',
  upload.fields([
    { name: 'photos',    maxCount: 5 },
    { name: 'videos',    maxCount: 2 },
    { name: 'documents', maxCount: 3 },
  ]),
  [
    body('title').trim().isLength({ min: 10 }).withMessage('Title must be at least 10 characters'),
    body('description').trim().isLength({ min: 30 }).withMessage('Description must be at least 30 characters'),
    body('category').notEmpty().withMessage('Category is required'),
    body('district').notEmpty().withMessage('District is required'),
    body('urgency').isIn(['low','medium','high','critical']).withMessage('Invalid urgency'),
  ],
  validate,
  ctrl.createChallenge
)

router.post('/:id/endorse', ctrl.endorse)

// Admin / University role for status updates
router.patch('/:id/status',
  authorize('admin','university'),
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  ctrl.updateStatus
)

router.delete('/:id', ctrl.deleteChallenge)

module.exports = router
