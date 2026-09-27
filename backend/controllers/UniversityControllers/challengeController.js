const UniChallenge      = require('../../models/UniversityModels/Challenge');
const CitizenChallenge  = require('../../models/CitizenModels/Challenge');
const UniversityProfile = require('../../models/UniversityModels/UniversityProfile');

// ── Helper ─────────────────────────────────────────────────────────────────────
const getUniversityName = async (userId) => {
  const profile = await UniversityProfile.findOne({ userId });
  if (!profile) throw Object.assign(new Error('University profile not found'), { status: 404 });
  return profile.universityName;
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalise a citizen challenge to match the shape universities expect
// (same fields as UniChallenge so the frontend can render both identically)
// ─────────────────────────────────────────────────────────────────────────────
const normaliseCitizen = (doc) => ({
  _id:                doc._id,
  id:                 doc._id.toString(),
  _source:            'citizen',
  challengeId:        doc.challengeId,
  title:              doc.title,
  description:        doc.description,
  category:           doc.category,
  district:           doc.district,
  city:               doc.city || '',
  priority:           doc.urgency || 'medium',   // citizen uses urgency
  urgency:            doc.urgency || 'medium',
  status:             doc.status,
  assignedUniversity: doc.assignedUniversity,
  rejectionReason:    doc.rejectionReason || '',
  respondedAt:        doc.respondedAt || null,
  deadline:           doc.deadline || null,
  affectedPeople:     doc.affectedPeople || 0,
  aiAnalysis:         doc.aiAnalysis || null,
  timeline:           doc.timeline || [],
  endorseCount:       doc.endorseCount || 0,
  createdAt:          doc.createdAt,
  updatedAt:          doc.updatedAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/university/challenges   (admin/govt creates a challenge)
// ─────────────────────────────────────────────────────────────────────────────
const createChallenge = async (req, res) => {
  try {
    const { title, description, category, district, priority, assignedUniversity, deadline } = req.body;
    if (!title || !description || !district || !assignedUniversity) {
      return res.status(400).json({ success: false, message: 'title, description, district and assignedUniversity are required' });
    }
    const challenge = await UniChallenge.create({ title, description, category, district, priority, assignedUniversity, deadline });
    res.status(201).json({ success: true, message: 'Challenge created and assigned successfully', challenge });
  } catch (error) {
    console.error('Create challenge error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to create challenge', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/university/challenges/assigned
// Queries BOTH collections — returns every challenge assigned to this university
// ─────────────────────────────────────────────────────────────────────────────
const getAssignedChallenges = async (req, res) => {
  try {
    const universityName = await getUniversityName(req.user._id);

    // Query both collections in parallel
    const [uniDocs, citizenDocs] = await Promise.all([
      UniChallenge.find({ assignedUniversity: universityName }).sort({ createdAt: -1 }).lean(),
      CitizenChallenge.find({ assignedUniversity: universityName, isDeleted: false }).sort({ createdAt: -1 }).lean(),
    ]);

    // Normalise citizen docs, tag both with _source
    const uniTagged     = uniDocs.map(d => ({ ...d, _source: 'university' }));
    const citizenTagged = citizenDocs.map(d => normaliseCitizen(d));

    // Merge and sort by createdAt descending
    const all = [...uniTagged, ...citizenTagged]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: all.length,
      message: 'Assigned challenges fetched successfully',
      challenges: all,
    });
  } catch (error) {
    console.error('Get assigned challenges error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/university/challenges/available  (status === 'assigned' in uni collection
// OR university-matching / validated in citizen collection)
// ─────────────────────────────────────────────────────────────────────────────
const getAvailableChallenges = async (req, res) => {
  try {
    const universityName = await getUniversityName(req.user._id);

    const [uniDocs, citizenDocs] = await Promise.all([
      UniChallenge.find({ assignedUniversity: universityName, status: 'assigned' }).sort({ createdAt: -1 }).lean(),
      CitizenChallenge.find({
        assignedUniversity: universityName,
        isDeleted: false,
        status: { $in: ['university-matching', 'validated'] },
      }).sort({ createdAt: -1 }).lean(),
    ]);

    const all = [
      ...uniDocs.map(d => ({ ...d, _source: 'university' })),
      ...citizenDocs.map(normaliseCitizen),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: all.length, challenges: all });
  } catch (error) {
    console.error('Get available challenges error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/university/challenges/accepted
// ─────────────────────────────────────────────────────────────────────────────
const getAcceptedChallenges = async (req, res) => {
  try {
    const universityName = await getUniversityName(req.user._id);

    const [uniDocs, citizenDocs] = await Promise.all([
      UniChallenge.find({ assignedUniversity: universityName, status: { $in: ['accepted','in-progress','completed'] } }).sort({ createdAt: -1 }).lean(),
      CitizenChallenge.find({
        assignedUniversity: universityName,
        isDeleted: false,
        status: { $in: ['university-accepted','team-formed','proposal-submitted','industry-collaboration','prototype','pilot-testing','deployed','completed'] },
      }).sort({ createdAt: -1 }).lean(),
    ]);

    const all = [
      ...uniDocs.map(d => ({ ...d, _source: 'university' })),
      ...citizenDocs.map(normaliseCitizen),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: all.length, challenges: all });
  } catch (error) {
    console.error('Get accepted challenges error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/university/challenges/:id/respond
// Works on both collections — tries uni first, then citizen
// ─────────────────────────────────────────────────────────────────────────────
const respondToChallenge = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const universityName = await getUniversityName(req.user._id);

    if (!action || !['accept','reject'].includes(action.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'" });
    }

    // Try university collection first
    let challenge   = await UniChallenge.findOne({ _id: req.params.id, assignedUniversity: universityName });
    let isCitizen   = false;

    if (!challenge) {
      challenge = await CitizenChallenge.findOne({ _id: req.params.id, assignedUniversity: universityName, isDeleted: false });
      isCitizen = !!challenge;
    }

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found or not assigned to your university' });
    }

    if (isCitizen) {
      // Citizen challenge: check it's in a pending state
      const pendingStatuses = ['university-matching','validated'];
      if (!pendingStatuses.includes(challenge.status)) {
        return res.status(400).json({ success: false, message: `Challenge has already been responded to (status: ${challenge.status})` });
      }
      if (action.toLowerCase() === 'accept') {
        challenge.status = 'university-accepted';
        if (Array.isArray(challenge.timeline)) challenge.timeline.push({ status: 'university-accepted', note: `Accepted by ${universityName}`, date: new Date() });
      } else {
        challenge.status = 'validated'; // send back to admin pool
        challenge.rejectionReason = rejectionReason || 'No reason provided';
        if (Array.isArray(challenge.timeline)) challenge.timeline.push({ status: 'validated', note: `Rejected by ${universityName}: ${rejectionReason}`, date: new Date() });
      }
    } else {
      // University collection
      if (challenge.status !== 'assigned') {
        return res.status(400).json({ success: false, message: `Challenge has already been ${challenge.status}` });
      }
      if (action.toLowerCase() === 'accept') {
        challenge.status = 'accepted';
        challenge.rejectionReason = '';
      } else {
        challenge.status = 'rejected';
        challenge.rejectionReason = rejectionReason || 'No reason provided';
      }
      challenge.respondedAt = new Date();
    }

    await challenge.save();
    res.status(200).json({ success: true, message: `Challenge ${challenge.status} successfully`, challenge });
  } catch (error) {
    console.error('Respond to challenge error:', error.message);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/university/challenges/:id/status
// ─────────────────────────────────────────────────────────────────────────────
const updateChallengeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['in-progress','completed'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const universityName = await getUniversityName(req.user._id);

    let challenge = await UniChallenge.findOne({ _id: req.params.id, assignedUniversity: universityName });
    if (!challenge) {
      challenge = await CitizenChallenge.findOne({ _id: req.params.id, assignedUniversity: universityName, isDeleted: false });
    }
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    challenge.status = status;
    await challenge.save();
    res.status(200).json({ success: true, message: `Challenge marked as ${status}`, challenge });
  } catch (error) {
    console.error('Update challenge status error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createChallenge,
  getAssignedChallenges,
  getAvailableChallenges,
  getAcceptedChallenges,
  respondToChallenge,
  updateChallengeStatus,
};
