const router = require('express').Router()
const ctrl   = require('../../controllers/CitizenControllers/successStoryController')
const { protect, authorize } = require('../../middleware/auth')

router.get('/',    ctrl.getAll)
router.get('/:id', ctrl.getOne)
router.post('/',   protect, authorize('admin'), ctrl.create)

module.exports = router
