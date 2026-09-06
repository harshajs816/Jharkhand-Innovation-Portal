const router  = require('express').Router()
const { body } = require('express-validator')
const ctrl    = require('../controllers/authController')
const validate = require('../middleware/validate')
const { protect } = require('../middleware/auth')

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  ctrl.register
)

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
)

router.post('/refresh', ctrl.refresh)
router.post('/logout',  ctrl.logout)
router.get('/me',       protect, ctrl.getMe)

module.exports = router
