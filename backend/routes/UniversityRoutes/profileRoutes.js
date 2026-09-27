const express = require('express');
const router  = express.Router();
const { protect } = require('../../middleware/auth');

const {
  getProfile,
  updateProfile,
  getCourses,
  updateCourses,
  updateDepartments,
  updateFacultyExpertise,
  updateResearchAreas,
  updateLabs,
  updateInnovationCentres,
  updateIncubationFacilities,
  updateAvailableTechnologies,
} = require('../../controllers/UniversityControllers/profileController');

// Scalar fields
router.get('/',    protect, getProfile);
router.patch('/',  protect, updateProfile);

// Array sections — each is a full replace (PUT)
router.get('/courses',                  protect, getCourses);
router.put('/courses',                  protect, updateCourses);
router.put('/departments',              protect, updateDepartments);
router.put('/faculty-expertise',        protect, updateFacultyExpertise);
router.put('/research-areas',           protect, updateResearchAreas);
router.put('/labs',                     protect, updateLabs);
router.put('/innovation-centres',       protect, updateInnovationCentres);
router.put('/incubation-facilities',    protect, updateIncubationFacilities);
router.put('/available-technologies',   protect, updateAvailableTechnologies);

module.exports = router;
