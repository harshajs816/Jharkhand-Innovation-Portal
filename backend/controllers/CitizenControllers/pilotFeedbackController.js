const PilotFeedback = require('../../models/CitizenModels/PilotFeedback')
const Challenge     = require('../../models/CitizenModels/Challenge')
const Notification  = require('../../models/CitizenModels/Notification')
const User          = require('../../models/User')
const { success, created, notFound, badRequest } = require('../../utils/response')

// GET /api/pilot-feedback/pending
// Returns challenges in deployed/pilot-testing status that user hasn't reviewed
exports.getPending = async (req, res) => {
  // Find this user's challenges that are in pilot / deployed
  const myChallenges = await Challenge.find({
    submittedBy: req.user._id,
    status:      { $in: ['pilot-testing', 'deployed', 'impact-measured', 'completed'] },
    isDeleted:   false,
  }).lean()

  // For each, check if feedback already submitted
  const ids      = myChallenges.map(c => c._id)
  const existing = await PilotFeedback.find({ challenge: { $in: ids }, submittedBy: req.user._id }).lean()
  const doneSet  = new Set(existing.map(f => f.challenge.toString()))

  const pending = myChallenges.map(c => ({
    id:             c._id,
    challengeId:    c.challengeId,
    challengeTitle: c.title,
    solution:       c.expectedSolution || 'Solution deployed',
    university:     c.assignedUniversity || 'Assigned University',
    deployedDate:   c.updatedAt,
    feedbackDue:    true,
    submitted:      doneSet.has(c._id.toString()),
  }))

  return success(res, { feedbacks: pending })
}

// POST /api/pilot-feedback
exports.submit = async (req, res) => {
  const {
    challengeId,
    overallRating, effectivenessScore, usabilityScore, sustainabilityScore,
    actualImpact, improvements, wouldRecommend,
  } = req.body

  const challenge = await Challenge.findOne({
    $or: [{ _id: challengeId }, { challengeId }],
    submittedBy: req.user._id,
  })
  if (!challenge) return notFound(res, 'Challenge not found or not yours.')

  // Prevent duplicate
  const already = await PilotFeedback.findOne({ challenge: challenge._id, submittedBy: req.user._id })
  if (already) return badRequest(res, 'Feedback already submitted for this challenge.')

  const feedback = await PilotFeedback.create({
    challenge: challenge._id,
    submittedBy: req.user._id,
    overallRating, effectivenessScore, usabilityScore, sustainabilityScore,
    actualImpact, improvements, wouldRecommend,
  })

  // Update challenge to impact-measured
  if (challenge.status === 'deployed') {
    challenge.status = 'impact-measured'
    challenge.timeline.push({ status: 'impact-measured', note: 'Citizen feedback received. Impact being measured.' })
    await challenge.save()
  }

  // Award Civic Catalyst badge if not yet earned
  const user = await User.findById(req.user._id)
  const badge = user.badges.find(b => b.id === 'b1')
  if (badge && !badge.earned) {
    badge.earned   = true
    badge.earnedAt = new Date()
    await user.save()
    await Notification.create({
      user:    user._id,
      type:    'badge',
      title:   '🏆 Civic Catalyst Badge Earned!',
      message: 'You completed the full challenge lifecycle! Badge unlocked.',
      icon:    '🏆',
    })
  }

  return created(res, { feedback }, 'Feedback submitted. Thank you!')
}

// GET /api/pilot-feedback/challenge/:id
exports.getForChallenge = async (req, res) => {
  const feedbacks = await PilotFeedback.find({ challenge: req.params.id })
    .populate('submittedBy', 'name district')
    .lean()
  return success(res, { feedbacks })
}
