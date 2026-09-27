const express = require('express');
const router  = express.Router();

const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProgress,
  uploadDocument,
} = require('../../controllers/UniversityControllers/projectController');

const { protect } = require('../../middleware/auth');
const upload      = require('../../middleware/upload');

router.post('/',                           protect, createProject);
router.get('/',                            protect, getMyProjects);
router.get('/:id',                         protect, getProjectById);
router.patch('/:id/progress',              protect, updateProgress);
router.post('/:id/documents',              protect, upload.single('document'), uploadDocument);

module.exports = router;
