const CitizenChallenge   = require('../models/CitizenModels/Challenge')
const UniChallenge       = require('../models/UniversityModels/Challenge')
const User               = require('../models/User')
const UniversityProfile  = require('../models/UniversityModels/UniversityProfile')
const Notification       = require('../models/CitizenModels/Notification')
const { success, error, notFound, badRequest } = require('../utils/response')

// ─────────────────────────────────────────────────────────────────────────────
// Helper: run the same aggregate on BOTH challenge collections and merge results
// ─────────────────────────────────────────────────────────────────────────────
const mergeCount = async (citizenQuery, uniQuery) => {
  const [a, b] = await Promise.all([
    CitizenChallenge.countDocuments(citizenQuery),
    UniChallenge.countDocuments(uniQuery || citizenQuery),
  ])
  return a + b
}

const mergeAggregate = async (citizenPipeline, uniPipeline) => {
  const [a, b] = await Promise.all([
    CitizenChallenge.aggregate(citizenPipeline),
    UniChallenge.aggregate(uniPipeline || citizenPipeline),
  ])
  // Merge arrays by _id / name key
  const map = {}
  ;[...a, ...b].forEach(item => {
    const key = item.name || item._id || item.district
    if (!key) return
    if (map[key]) {
      map[key].value       = (map[key].value       || 0) + (item.value       || 0)
      map[key].submissions = (map[key].submissions || 0) + (item.submissions || 0)
      map[key].impacted    = (map[key].impacted    || 0) + (item.impacted    || 0)
      map[key].challenges  = (map[key].challenges  || 0) + (item.challenges  || 0)
      map[key].total       = (map[key].total       || 0) + (item.total       || 0)
      map[key].pending     = (map[key].pending     || 0) + (item.pending     || 0)
      map[key].active      = (map[key].active      || 0) + (item.active      || 0)
      map[key].completed   = (map[key].completed   || 0) + (item.completed   || 0)
    } else {
      map[key] = { ...item }
    }
  })
  return Object.values(map).sort((a, b) => (b.value || b.total || b.submissions || 0) - (a.value || a.total || a.submissions || 0))
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics
// ─────────────────────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const base    = { isDeleted: false }
    const uniBase = {}   // universitychallenges has no isDeleted field

    // ── Headline stats ───────────────────────────────────────────────────────
    const [
      cTotal, cPending, cValidated, cActive, cCompleted, cDeployed,
      uTotal, uPending, uValidated, uActive, uCompleted, uDeployed,
      totalCitizens, uniCount,
    ] = await Promise.all([
      CitizenChallenge.countDocuments(base),
      CitizenChallenge.countDocuments({ ...base, status: { $in: ['submitted','ai-analysis','under-review'] } }),
      CitizenChallenge.countDocuments({ ...base, status: { $in: ['validated','university-matching','university-accepted','team-formed','proposal-submitted','industry-collaboration','prototype','pilot-testing'] } }),
      CitizenChallenge.countDocuments({ ...base, status: { $in: ['university-accepted','team-formed','proposal-submitted','industry-collaboration','prototype','pilot-testing'] } }),
      CitizenChallenge.countDocuments({ ...base, status: { $in: ['completed','impact-measured'] } }),
      CitizenChallenge.countDocuments({ ...base, status: 'deployed' }),

      UniChallenge.countDocuments(uniBase),
      UniChallenge.countDocuments({ ...uniBase, status: 'assigned' }),
      UniChallenge.countDocuments({ ...uniBase, status: { $in: ['accepted','in-progress'] } }),
      UniChallenge.countDocuments({ ...uniBase, status: 'in-progress' }),
      UniChallenge.countDocuments({ ...uniBase, status: 'completed' }),
      UniChallenge.countDocuments({ ...uniBase, status: 'completed' }),

      User.countDocuments({ role: 'citizen' }),
      UniversityProfile.countDocuments(),
    ])

    const total            = cTotal + uTotal
    const pendingValidation = cPending + uPending
    const validated        = cValidated + uValidated
    const activeProjects   = cActive + uActive
    const completedProjects = cCompleted + uCompleted
    const deployedSolutions = cDeployed + uDeployed

    // ── Charts ───────────────────────────────────────────────────────────────
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    const catPipeline = [
      { $group: { _id: '$category', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]
    const distPipeline = [
      { $group: { _id: '$district', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]
    const monthlyPipelineBase = [
      { $match: { createdAt: { $gte: oneYearAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, submissions: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, name: { $concat: [{ $arrayElemAt: [['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], '$_id.month'] }, ' ', { $substr: [{ $toString: '$_id.year' }, 2, 2] }] }, submissions: 1 } },
    ]
    const priorityPipeline = [
      { $group: { _id: '$urgency', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
    ]
    const statusPipeline = [
      { $group: { _id: '$status', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
    ]
    const socialPipeline = [
      { $match: { affectedPeople: { $gt: 0 } } },
      { $group: { _id: '$district', impacted: { $sum: '$affectedPeople' }, challenges: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', impacted: 1, challenges: 1 } },
      { $sort: { impacted: -1 } },
      { $limit: 8 },
    ]
    const uniPartPipeline = [
      { $match: { assignedUniversity: { $exists: true, $nin: [null, ''] } } },
      { $group: { _id: '$assignedUniversity', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: '$count' } },
      { $sort: { value: -1 } },
      { $limit: 8 },
    ]
    const distMapPipeline = [
      { $group: {
          _id: '$district',
          total:     { $sum: 1 },
          pending:   { $sum: { $cond: [{ $in: ['$status', ['submitted','ai-analysis','under-review','assigned']] }, 1, 0] } },
          active:    { $sum: { $cond: [{ $in: ['$status', ['university-accepted','accepted','team-formed','prototype','pilot-testing','in-progress']] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $in: ['$status', ['completed','deployed','impact-measured']] }, 1, 0] } },
          impacted:  { $sum: { $cond: [{ $ifNull: ['$affectedPeople', false] }, '$affectedPeople', 0] } },
      }},
      { $project: { _id: 0, district: '$_id', total: 1, pending: 1, active: 1, completed: 1, impacted: 1 } },
      { $sort: { total: -1 } },
    ]

    const [
      byCategory, byDistrict, monthly, byPriority,
      byStatus, socialImpact, uniParticipation, districtMap,
    ] = await Promise.all([
      mergeAggregate(
        [{ $match: base }, ...catPipeline],
        [...catPipeline]
      ),
      mergeAggregate(
        [{ $match: base }, ...distPipeline],
        [...distPipeline]
      ),
      mergeAggregate(
        [{ $match: base }, ...monthlyPipelineBase],
        [...monthlyPipelineBase]
      ),
      mergeAggregate(
        [{ $match: base }, ...priorityPipeline],
        [...priorityPipeline]
      ),
      mergeAggregate(
        [{ $match: base }, ...statusPipeline],
        [...statusPipeline]
      ),
      mergeAggregate(
        [{ $match: { ...base, affectedPeople: { $gt: 0 } } }, ...socialPipeline.slice(1)],
        [...socialPipeline]
      ),
      mergeAggregate(
        [{ $match: base }, ...uniPartPipeline.slice(1)],
        [...uniPartPipeline]
      ),
      mergeAggregate(
        [{ $match: base }, ...distMapPipeline],
        [...distMapPipeline]
      ),
    ])

    // Total impacted across both collections
    const [cImpact, uImpact] = await Promise.all([
      CitizenChallenge.aggregate([{ $match: { ...base, affectedPeople: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: '$affectedPeople' } } }]),
      UniChallenge.aggregate([{ $match: { affectedPeople: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: '$affectedPeople' } } }]),
    ])
    const totalImpacted = (cImpact[0]?.total || 0) + (uImpact[0]?.total || 0)

    // Industry count from citizen challenges
    const industryAgg = await CitizenChallenge.aggregate([
      { $match: { ...base, assignedIndustry: { $nin: [null, ''] } } },
      { $group: { _id: '$assignedIndustry' } },
    ])
    const industryCount = industryAgg.length

    return success(res, {
      stats: {
        total, pendingValidation, validated,
        activeProjects, completedProjects, deployedSolutions,
        totalCitizens, uniCount, industryCount, totalImpacted,
      },
      charts: {
        byCategory:      byCategory.slice(0, 10),
        byDistrict:      byDistrict.slice(0, 12),
        monthly,
        byPriority,
        byStatus:        byStatus.slice(0, 14),
        socialImpact:    socialImpact.slice(0, 8),
        uniParticipation: uniParticipation.slice(0, 8),
        districtMap,
      },
    })
  } catch (err) {
    console.error('Analytics error:', err.message, err.stack)
    return error(res, 'Failed to load analytics data', 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/universities
// Returns all university profiles for the assignment panel dropdown
// ─────────────────────────────────────────────────────────────────────────────
exports.getUniversities = async (req, res) => {
  try {
    const profiles = await UniversityProfile.find({})
      .select('universityName universityCode universityType accreditation city district state contactEmail website expertise labs researchAreas facultyExpertise')
      .sort({ universityName: 1 })
      .lean()

    // Shape for matching engine
    const universities = profiles.map(p => ({
      id:             p._id.toString(),
      name:           p.universityName,
      shortName:      p.universityCode || p.universityName,
      location:       p.city || p.district,
      district:       p.district,
      state:          p.state,
      type:           p.universityType,
      accreditation:  p.accreditation,
      website:        p.website,
      contactEmail:   p.contactEmail,
      // Flatten expertise — supports both old string array and new rich objects
      expertise: [
        ...(p.expertise || []),
        ...(p.facultyExpertise || []).map(f => f.area || f).filter(Boolean),
      ],
      labs:           (p.labs || []).map(l => (typeof l === 'string' ? l : l.name)).filter(Boolean),
      researchAreas:  (p.researchAreas || []).map(r => (typeof r === 'string' ? r : r.name)).filter(Boolean),
    }))

    return success(res, { universities, count: universities.length })
  } catch (err) {
    console.error('Get universities error:', err.message)
    return error(res, 'Failed to fetch universities', 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/challenges
// Returns challenges from BOTH collections, merged and paginated
// ─────────────────────────────────────────────────────────────────────────────
exports.getChallengesForReview = async (req, res) => {
  try {
    const { status, district, category, urgency, search, page = 1, limit = 20, source } = req.query

    const citizenFilter = { isDeleted: false }
    const uniFilter     = {}

    if (district && district !== 'all') {
      citizenFilter.district = district
      uniFilter.district     = district
    }
    if (category && category !== 'all') {
      citizenFilter.category = category
      uniFilter.category     = category
    }
    if (urgency && urgency !== 'all') {
      citizenFilter.urgency = urgency
      uniFilter.urgency     = urgency
    }
    if (status && status !== 'all') {
      citizenFilter.status = status
      uniFilter.status     = status
    }
    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' }
      citizenFilter.$or = [{ title: rx }, { description: rx }, { challengeId: rx }]
      uniFilter.$or     = [{ title: rx }, { description: rx }]
    }

    const skip = (Number(page) - 1) * Number(limit)

    // Fetch from both collections unless source filter is set
    const fetchCitizen = source !== 'university'
    const fetchUni     = source !== 'citizen'

    const [citizenDocs, citizenTotal, uniDocs, uniTotal] = await Promise.all([
      fetchCitizen
        ? CitizenChallenge.find(citizenFilter)
            .sort({ createdAt: -1 })
            .populate('submittedBy', 'name email district phone')
            .lean()
        : [],
      fetchCitizen ? CitizenChallenge.countDocuments(citizenFilter) : 0,
      fetchUni
        ? UniChallenge.find(uniFilter)
            .sort({ createdAt: -1 })
            .lean()
        : [],
      fetchUni ? UniChallenge.countDocuments(uniFilter) : 0,
    ])

    // Tag each doc with its source collection
    const tagged = [
      ...citizenDocs.map(d => ({ ...d, _source: 'citizen' })),
      ...uniDocs.map(d => ({
        ...d,
        _source:     'university',
        // Normalise fields so frontend renders consistently
        challengeId: d.challengeId || d._id.toString().slice(-8).toUpperCase(),
        urgency:     d.urgency || d.priority || 'medium',
        affectedPeople: d.affectedPeople || 0,
        endorseCount:   0,
        aiAnalysis: d.aiAnalysis || null,
        timeline:   d.timeline || [],
      })),
    ]

    // Sort merged list by createdAt descending, then paginate
    tagged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const totalMerged   = citizenTotal + uniTotal
    const paginated     = tagged.slice(skip, skip + Number(limit))
    const totalPages    = Math.ceil(totalMerged / Number(limit))

    return success(res, {
      challenges: paginated,
      total:      totalMerged,
      page:       Number(page),
      pages:      totalPages,
    })
  } catch (err) {
    console.error('Get challenges for review error:', err.message)
    return error(res, 'Failed to fetch challenges', 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/challenges/:id/review
// Works on BOTH collections — tries citizen first, then university
// ─────────────────────────────────────────────────────────────────────────────
exports.reviewChallenge = async (req, res) => {
  try {
    const { action, note, priority, assignedUniversity, duplicateOfId } = req.body

    const VALID = ['approve','reject','request-info','mark-duplicate','set-priority','assign-university']
    if (!action || !VALID.includes(action)) {
      return badRequest(res, `action must be one of: ${VALID.join(', ')}`)
    }

    // Find in citizen collection first, then university
    let challenge   = await CitizenChallenge.findOne({ _id: req.params.id, isDeleted: false })
    let isUniSource = false
    if (!challenge) {
      challenge   = await UniChallenge.findOne({ _id: req.params.id })
      isUniSource = !!challenge
    }
    if (!challenge) return notFound(res, 'Challenge not found')

    let newStatus    = challenge.status
    let timelineNote = note || ''
    let notifTitle   = ''
    let notifMsg     = ''
    const challengeIdDisplay = challenge.challengeId || challenge._id.toString().slice(-8).toUpperCase()

    switch (action) {
      case 'approve':
        newStatus    = 'validated'
        timelineNote = note || 'Validated by government admin.'
        notifTitle   = '✅ Challenge Validated'
        notifMsg     = `${challengeIdDisplay} has been validated.`
        break

      case 'reject':
        if (!note?.trim()) return badRequest(res, 'Rejection note is required')
        newStatus    = isUniSource ? 'assigned' : 'submitted'
        timelineNote = `Rejected: ${note}`
        notifTitle   = '❌ Challenge Needs Revision'
        notifMsg     = `${challengeIdDisplay} requires changes: ${note}`
        break

      case 'request-info':
        if (!note?.trim()) return badRequest(res, 'Information request note is required')
        newStatus    = 'under-review'
        timelineNote = `Additional info requested: ${note}`
        notifTitle   = '📝 More Information Needed'
        notifMsg     = `Admin needs more details on ${challengeIdDisplay}: ${note}`
        break

      case 'mark-duplicate':
        newStatus    = isUniSource ? 'assigned' : 'submitted'
        timelineNote = note || `Marked as duplicate${duplicateOfId ? ` of ${duplicateOfId}` : ''}`
        notifTitle   = '🔁 Duplicate Detected'
        notifMsg     = `${challengeIdDisplay} has been identified as a duplicate.`
        break

      case 'set-priority':
        if (!priority || !['low','medium','high','critical'].includes(priority)) {
          return badRequest(res, 'priority must be: low | medium | high | critical')
        }
        challenge.urgency  = priority
        challenge.priority = priority    // UniChallenge uses 'priority'
        timelineNote = `Priority set to "${priority}" by admin.`
        notifTitle   = '🎯 Priority Updated'
        notifMsg     = `${challengeIdDisplay} priority → ${priority}.`
        break

      case 'assign-university':
        if (!assignedUniversity?.trim()) return badRequest(res, 'assignedUniversity is required')
        challenge.assignedUniversity = assignedUniversity.trim()
        newStatus    = isUniSource ? 'accepted' : 'university-matching'
        timelineNote = `Assigned to ${assignedUniversity} by admin.`
        notifTitle   = '🎓 University Assigned'
        notifMsg     = `${challengeIdDisplay} assigned to ${assignedUniversity}.`
        break
    }

    challenge.status = newStatus
    // Push to timeline only if the model has the array
    if (Array.isArray(challenge.timeline)) {
      challenge.timeline.push({ status: newStatus, note: timelineNote, date: new Date() })
    }
    if (!isUniSource) challenge.respondedAt = new Date()
    await challenge.save()

    // Notify citizen submitter (only citizen challenges have submittedBy)
    if (!isUniSource && notifTitle && challenge.submittedBy) {
      await Notification.create({
        user:    challenge.submittedBy,
        type:    'status',
        title:   notifTitle,
        message: notifMsg,
        icon:    '📋',
        link:    '/my-challenges',
      }).catch(() => {})   // don't fail the whole request if notification fails
    }

    return success(res, { challenge }, `Challenge ${action} successfully`)
  } catch (err) {
    console.error('Review challenge error:', err.message)
    if (err.name === 'CastError') return badRequest(res, 'Invalid challenge ID')
    return error(res, 'Failed to review challenge', 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/challenges/merge
// ─────────────────────────────────────────────────────────────────────────────
exports.mergeChallenges = async (req, res) => {
  try {
    const { primaryId, duplicateIds } = req.body
    if (!primaryId || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
      return badRequest(res, 'primaryId and duplicateIds[] are required')
    }

    const primary = await CitizenChallenge.findOne({ _id: primaryId, isDeleted: false })
    if (!primary) return notFound(res, 'Primary challenge not found')

    let mergedEndorsements = 0, mergedImpact = 0
    for (const dupId of duplicateIds) {
      const dup = await CitizenChallenge.findOne({ _id: dupId, isDeleted: false })
      if (!dup) continue
      mergedEndorsements += dup.endorseCount   || 0
      mergedImpact       += dup.affectedPeople || 0
      dup.isDeleted = true
      if (Array.isArray(dup.timeline)) {
        dup.timeline.push({ status: dup.status, note: `Merged into ${primary.challengeId}` })
      }
      await dup.save()
    }

    primary.endorseCount   += mergedEndorsements
    primary.affectedPeople += mergedImpact
    if (Array.isArray(primary.timeline)) {
      primary.timeline.push({ status: primary.status, note: `Merged ${duplicateIds.length} duplicate(s). +${mergedEndorsements} endorsements, +${mergedImpact} impact.` })
    }
    await primary.save()

    return success(res, { primary }, `Merged ${duplicateIds.length} duplicate(s) into ${primary.challengeId}`)
  } catch (err) {
    console.error('Merge error:', err.message)
    return error(res, 'Failed to merge challenges', 500)
  }
}
