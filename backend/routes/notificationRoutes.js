const router = require('express').Router()
const ctrl   = require('../controllers/notificationController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/',             ctrl.getNotifications)
router.patch('/read-all',   ctrl.markAllRead)
router.patch('/:id/read',   ctrl.markRead)
router.delete('/:id',       ctrl.deleteNotification)

module.exports = router
