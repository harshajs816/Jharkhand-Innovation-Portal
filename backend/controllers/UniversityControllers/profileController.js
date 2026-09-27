const UniversityProfile = require('../../models/UniversityModels/UniversityProfile');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/university/profile
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const profile = await UniversityProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'University profile not found. Please complete your registration.' });
    }
    res.status(200).json({ success: true, message: 'Profile fetched successfully', profile });
  } catch (error) {
    console.error('Get university profile error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to fetch profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/university/profile
// Updates scalar profile fields (arrays use dedicated endpoints below)
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const scalarFields = [
      'universityName', 'universityCode', 'registrationNumber',
      'establishedYear', 'universityType', 'accreditation',
      'website', 'contactEmail', 'contactPhone',
      'address', 'city', 'district', 'state', 'pincode',
      'description', 'logo',
    ];

    const updates = {};
    scalarFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const profile = await UniversityProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'University profile not found' });

    res.status(200).json({ success: true, message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update university profile error:', error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ success: false, message: `${field} is already in use by another university` });
    }
    res.status(500).json({ success: false, message: 'Unable to update profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic array-replace helper (PUT /:section)
// ─────────────────────────────────────────────────────────────────────────────
const updateArraySection = (sectionKey, requireName = 'name') => async (req, res) => {
  try {
    const items = req.body[sectionKey];
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: `${sectionKey} must be an array` });
    }

    for (let i = 0; i < items.length; i++) {
      const key = requireName === 'area' ? items[i].area : items[i][requireName];
      if (!key || !String(key).trim()) {
        return res.status(400).json({ success: false, message: `Item #${i + 1}: ${requireName} is required` });
      }
    }

    const profile = await UniversityProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { [sectionKey]: items } },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'University profile not found' });

    res.status(200).json({ success: true, message: `${sectionKey} updated successfully`, [sectionKey]: profile[sectionKey] });
  } catch (error) {
    console.error(`Update ${sectionKey} error:`, error.message);
    res.status(500).json({ success: false, message: `Unable to update ${sectionKey}`, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Courses  GET + PUT /api/university/profile/courses
// ─────────────────────────────────────────────────────────────────────────────
const getCourses = async (req, res) => {
  try {
    const profile = await UniversityProfile.findOne({ userId: req.user._id }).select('courses');
    if (!profile) return res.status(404).json({ success: false, message: 'University profile not found' });
    res.status(200).json({ success: true, courses: profile.courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch courses', error: error.message });
  }
};

const updateCourses = async (req, res) => {
  try {
    const { courses } = req.body;
    if (!Array.isArray(courses)) return res.status(400).json({ success: false, message: 'courses must be an array' });

    for (let i = 0; i < courses.length; i++) {
      if (!courses[i].name?.trim()) return res.status(400).json({ success: false, message: `Course #${i + 1}: name is required` });
      if (courses[i].branches) {
        if (!Array.isArray(courses[i].branches)) return res.status(400).json({ success: false, message: `Course #${i + 1}: branches must be an array` });
        for (let b = 0; b < courses[i].branches.length; b++) {
          if (!courses[i].branches[b].name?.trim()) return res.status(400).json({ success: false, message: `Course #${i + 1}, Branch #${b + 1}: name is required` });
        }
      }
    }

    const profile = await UniversityProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { courses } },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'University profile not found' });
    res.status(200).json({ success: true, message: 'Courses updated successfully', courses: profile.courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update courses', error: error.message });
  }
};

// Named exports for each array section
const updateDepartments        = updateArraySection('departments');
const updateFacultyExpertise   = updateArraySection('facultyExpertise',        'area');
const updateResearchAreas      = updateArraySection('researchAreas');
const updateLabs               = updateArraySection('labs');
const updateInnovationCentres  = updateArraySection('innovationCentres');
const updateIncubationFacilities = updateArraySection('incubationFacilities');
const updateAvailableTechnologies = updateArraySection('availableTechnologies');

module.exports = {
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
};
