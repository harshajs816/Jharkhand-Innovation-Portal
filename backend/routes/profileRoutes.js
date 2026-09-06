const router   = require('express').Router()
const { body } = require('express-validator')
const ctrl     = require('../controllers/profileController')
const validate = require('../middleware/validate')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/',   ctrl.getProfile)
router.patch('/', ctrl.updateProfile)

router.patch('/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  ctrl.changePassword
)

module.exports = router
