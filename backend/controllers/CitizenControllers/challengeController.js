const Challenge    = require('../../models/CitizenModels/Challenge')
const User         = require('../../models/User')
const Notification = require('../../models/CitizenModels/Notification')
const { runAIAnalysis } = require('../../utils/aiAnalysis')
const { success, created, notFound, badRequest, error } = require('../../utils/response')

// ── GET /api/challenges/my  ───────────────────────────────────────────────────
exports.getMyChallenges = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query
  const filter = { submittedBy: req.user._id, isDeleted: false }
  if (status && status !== 'all') filter.status = status
  if (search) filter.$text = { $search: search }

  const skip  = (Number(page) - 1) * Number(limit)
  const [challenges, total] = await Promise.all([
    Challenge.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Challenge.countDocuments(filter),
  ])

  return success(res, { challenges, total, page: Number(page), pages: Math.ceil(total / limit) })
}

// ── GET /api/challenges/public  ──────────────────────────────────────────────
exports.getPublicChallenges = async (req, res) => {
  const { category, district, sort = 'endorseCount', page = 1, limit = 20, search } = req.query
  const filter = { isPublic: true, isDeleted: false }
  if (category) filter.category = category
  if (district) filter.district = district
  if (search)   filter.$text    = { $search: search }

  const sortMap = {
    endorseCount: { endorseCount: -1 },
    urgency:      { urgency: -1 },
    newest:       { createdAt: -1 },
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const [challenges, total] = await Promise.all([
    Challenge.find(filter)
      .sort(sortMap[sort] || { endorseCount: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('submittedBy', 'name district')
      .lean(),
    Challenge.countDocuments(filter),
  ])

  // Attach whether current user has endorsed each
  const userId = req.user?._id?.toString()
  const result = challenges.map(c => ({
    ...c,
    userEndorsed: userId ? c.endorsements.map(e => e.toString()).includes(userId) : false,
  }))

  return success(res, { challenges: result, total, page: Number(page), pages: Math.ceil(total / limit) })
}

// ── GET /api/challenges/:id  ─────────────────────────────────────────────────
exports.getChallengeById = async (req, res) => {
  const challenge = await Challenge.findOne({
    $or: [{ _id: req.params.id }, { challengeId: req.params.id }],
    isDeleted: false,
  }).populate('submittedBy', 'name email district')

  if (!challenge) return notFound(res, 'Challenge not found.')

  const userId     = req.user?._id?.toString()
  const plain      = challenge.toObject()
  plain.userEndorsed = userId
    ? challenge.endorsements.map(e => e.toString()).includes(userId)
    : false

  return success(res, { challenge: plain })
}

// ── POST /api/challenges  ────────────────────────────────────────────────────
exports.createChallenge = async (req, res) => {
  const {
    title, description, category, subCategory, urgency,
    district, city, address, latitude, longitude,
    affectedPeople, existingAttempts, expectedSolution,
  } = req.body

  // Collect uploaded file paths
  const files     = req.files || {}
  const images    = (files.photos    || []).map(f => `/uploads/${f.filename}`)
  const videos    = (files.videos    || []).map(f => `/uploads/${f.filename}`)
  const documents = (files.documents || []).map(f => `/uploads/${f.filename}`)

  const challenge = await Challenge.create({
    submittedBy: req.user._id,
    title, description, category, subCategory, urgency,
    district, city, address,
    latitude:  latitude  ? Number(latitude)  : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    affectedPeople: affectedPeople ? Number(affectedPeople) : 0,
    existingAttempts, expectedSolution,
    images, videos, documents,
  })

  // Increment user counter
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalSubmitted: 1 } })

  // Trigger async AI analysis (don't block response)
  setImmediate(() => _runAndSaveAI(challenge._id, req.user._id))

  return created(res, { challenge }, 'Challenge submitted successfully.')
}

// ── Internal: run AI analysis & push notification  ───────────────────────────
async function _runAndSaveAI(challengeId, userId) {
  try {
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) return

    const ai = await runAIAnalysis(challenge)
    challenge.aiAnalysis = ai
    challenge.status     = 'ai-analysis'
    challenge.timeline.push({ status: 'ai-analysis', note: `AI scored ${ai.priorityScore}/100 – ${ai.severity}.` })
    await challenge.save()

    await Notification.create({
      user:    userId,
      type:    'ai',
      title:   '🤖 AI Analysis Complete',
      message: `${challenge.challengeId} scored ${ai.priorityScore}/100 – ${ai.severity} Priority`,
      icon:    '🤖',
      link:    `/my-challenges`,
      meta:    { challengeId: challenge.challengeId },
    })
  } catch (e) {
    console.error('AI analysis failed for', challengeId, e.message)
  }
}

// ── POST /api/challenges/:id/endorse  ────────────────────────────────────────
exports.endorse = async (req, res) => {
  const challenge = await Challenge.findOne({
    $or: [{ _id: req.params.id }, { challengeId: req.params.id }],
    isDeleted: false,
  })
  if (!challenge) return notFound(res, 'Challenge not found.')

  const added = await challenge.addEndorsement(req.user._id)
  if (!added) return badRequest(res, 'You have already endorsed this challenge.')

  // Update submitter's totalUpvotes
  await User.findByIdAndUpdate(challenge.submittedBy, { $inc: { totalUpvotes: 1 } })

  // Check Community Leader badge (100+ endorsements on any challenge)
  const submitter = await User.findById(challenge.submittedBy)
  if (submitter && submitter.totalUpvotes >= 100) {
    const badge = submitter.badges.find(b => b.id === 'b2')
    if (badge && !badge.earned) {
      badge.earned    = true
      badge.earnedAt  = new Date()
      await submitter.save()
      await Notification.create({
        user:    submitter._id,
        type:    'badge',
        title:   '👑 Community Leader Badge Earned!',
        message: 'You have received 100+ community endorsements. Congratulations!',
        icon:    '👑',
      })
    }
  }

  // Notify challenge owner of new endorsement
  if (challenge.submittedBy.toString() !== req.user._id.toString()) {
    await Notification.create({
      user:    challenge.submittedBy,
      type:    'endorsement',
      title:   'New Endorsement Received',
      message: `${req.user.name} endorsed your challenge ${challenge.challengeId}`,
      icon:    '👍',
      link:    `/my-challenges`,
    })
  }

  return success(res, {
    endorseCount: challenge.endorseCount,
    userEndorsed: true,
    challengeId:  challenge.challengeId,
  }, 'Challenge endorsed.')
}

// ── PATCH /api/challenges/:id/status  (admin/university)  ───────────────────
exports.updateStatus = async (req, res) => {
  const { status, note } = req.body
  const challenge = await Challenge.findOne({
    $or: [{ _id: req.params.id }, { challengeId: req.params.id }],
    isDeleted: false,
  })
  if (!challenge) return notFound(res, 'Challenge not found.')

  const prev = challenge.status
  challenge.status = status
  challenge.timeline.push({ status, note: note || `Status updated to ${status}.`, updatedBy: req.user._id })
  await challenge.save()

  // Notify submitter
  await Notification.create({
    user:    challenge.submittedBy,
    type:    'status',
    title:   'Challenge Status Updated',
    message: `${challenge.challengeId} moved from "${prev}" → "${status}"`,
    icon:    '📋',
    link:    `/my-challenges`,
    meta:    { challengeId: challenge.challengeId, prevStatus: prev, newStatus: status },
  })

  // If deployed, award Civic Catalyst badge & increment challengesSolved
  if (status === 'deployed') {
    const submitter = await User.findById(challenge.submittedBy)
    if (submitter) {
      submitter.challengesSolved += 1
      const badge = submitter.badges.find(b => b.id === 'b1')
      if (badge && !badge.earned) {
        badge.earned   = true
        badge.earnedAt = new Date()
        await Notification.create({
          user:    submitter._id,
          type:    'badge',
          title:   '🏆 Civic Catalyst Badge Earned!',
          message: 'Your challenge has reached Deployed status. Badge unlocked!',
          icon:    '🏆',
        })
      }
      await submitter.save()
    }
  }

  return success(res, { challenge })
}

// ── DELETE /api/challenges/:id  ──────────────────────────────────────────────
exports.deleteChallenge = async (req, res) => {
  const challenge = await Challenge.findOne({
    $or: [{ _id: req.params.id }, { challengeId: req.params.id }],
    submittedBy: req.user._id,
  })
  if (!challenge) return notFound(res, 'Challenge not found.')
  challenge.isDeleted = true
  await challenge.save()
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalSubmitted: -1 } })
  return success(res, {}, 'Challenge deleted.')
}

// ── GET /api/challenges/stats  ───────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  const [total, active, completed, byCategory, byDistrict] = await Promise.all([
    Challenge.countDocuments({ isDeleted: false }),
    Challenge.countDocuments({ isDeleted: false, status: { $nin: ['completed'] } }),
    Challenge.countDocuments({ isDeleted: false, status: 'completed' }),
    Challenge.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Challenge.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ])

  return success(res, { total, active, completed, byCategory, byDistrict })
}
