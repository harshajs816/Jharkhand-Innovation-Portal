const Project  = require('../../models/UniversityModels/Project');
const Proposal = require('../../models/UniversityModels/Proposal');
const UniversityProfile = require('../../models/UniversityModels/UniversityProfile');
const path = require('path');

const getUniversityName = async (userId) => {
  const p = await UniversityProfile.findOne({ userId });
  if (!p) throw Object.assign(new Error('University profile not found'), { status: 404 });
  return p.universityName;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/university/projects
// Creates a project from an approved proposal (one-time, auto-called after
// proposal approval OR manually triggered by the university)
// ─────────────────────────────────────────────────────────────────────────────
const createProject = async (req, res) => {
  try {
    const { proposalId, title, description, expectedEndDate } = req.body;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const universityName = await getUniversityName(req.user._id);

    const proposal = await Proposal.findOne({ _id: proposalId, universityName });
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found or does not belong to your university' });
    if (proposal.status !== 'approved') return res.status(400).json({ success: false, message: 'Project can only be created from an approved proposal' });

    const existing = await Project.findOne({ proposal: proposalId });
    if (existing) return res.status(409).json({ success: false, message: 'A project already exists for this proposal', project: existing });

    const project = await Project.create({
      proposal:       proposal._id,
      challenge:      proposal.challenge,
      team:           proposal.team,
      universityName,
      title:          title       || proposal.title,
      description:    description || proposal.solutionSummary,
      expectedEndDate: expectedEndDate || null,
    });

    res.status(201).json({ success: true, message: 'Project created successfully', project });
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/university/projects
// Returns all projects for this university (optionally filter by ?status=)
// ─────────────────────────────────────────────────────────────────────────────
const getMyProjects = async (req, res) => {
  try {
    const universityName = await getUniversityName(req.user._id);
    const filter = { universityName };
    if (req.query.status) filter.status = req.query.status;

    const projects = await Project.find(filter)
      .populate('challenge', 'title district category priority status deadline')
      .populate('team',      'teamName members')
      .populate('proposal',  'title estimatedBudget estimatedTimelineMonths status')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (error) {
    console.error('Get projects error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/university/projects/:id
// ─────────────────────────────────────────────────────────────────────────────
const getProjectById = async (req, res) => {
  try {
    const universityName = await getUniversityName(req.user._id);
    const project = await Project.findOne({ _id: req.params.id, universityName })
      .populate('challenge', 'title district category priority status deadline description')
      .populate('team',      'teamName members status')
      .populate('proposal',  'title estimatedBudget estimatedTimelineMonths status solutionSummary detailedPlan');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error('Get project by id error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/university/projects/:id/progress
// body: { overallProgress, progressNote, status? }
// ─────────────────────────────────────────────────────────────────────────────
const updateProgress = async (req, res) => {
  try {
    const { overallProgress, progressNote, status } = req.body;
    const universityName = await getUniversityName(req.user._id);

    const project = await Project.findOne({ _id: req.params.id, universityName });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (overallProgress !== undefined) {
      const pct = Number(overallProgress);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ success: false, message: 'overallProgress must be 0–100' });
      }
      project.overallProgress = pct;
    }
    if (progressNote !== undefined) project.progressNote = progressNote;
    if (status && ['active', 'on-hold', 'completed', 'cancelled'].includes(status)) {
      project.status = status;
      if (status === 'completed' && !project.completedAt) project.completedAt = new Date();
    }
    await project.save();
    res.status(200).json({ success: true, message: 'Project progress updated', project });
  } catch (error) {
    console.error('Update progress error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/university/projects/:id/documents
// Upload a document to a project  (uses multer from middleware)
// ─────────────────────────────────────────────────────────────────────────────
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const universityName = await getUniversityName(req.user._id);
    const project = await Project.findOne({ _id: req.params.id, universityName });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
    const doc = {
      fileName:    req.file.originalname,
      fileUrl:     `/uploads/${req.file.filename}`,
      fileType:    ext,
      uploadedAt:  new Date(),
      uploadedBy:  req.user.name || 'University',
      description: req.body.description || '',
    };
    project.documents.push(doc);
    await project.save();

    res.status(200).json({ success: true, message: 'Document uploaded successfully', document: doc, project });
  } catch (error) {
    console.error('Upload document error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

module.exports = { createProject, getMyProjects, getProjectById, updateProgress, uploadDocument };
