const SuccessStory = require('../models/SuccessStory')
const { success, created, notFound } = require('../utils/response')

// GET /api/success-stories
exports.getAll = async (req, res) => {
  const { category, district, page = 1, limit = 12 } = req.query
  const filter = { isPublished: true }
  if (category) filter.category = { $regex: category, $options: 'i' }
  if (district) filter.district = district

  const skip = (Number(page) - 1) * Number(limit)
  const [stories, total] = await Promise.all([
    SuccessStory.find(filter)
      .sort({ completedDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('challenge', 'challengeId title')
      .lean(),
    SuccessStory.countDocuments(filter),
  ])

  return success(res, { stories, total, page: Number(page), pages: Math.ceil(total / limit) })
}

// GET /api/success-stories/:id
exports.getOne = async (req, res) => {
  const story = await SuccessStory.findById(req.params.id).populate('challenge')
  if (!story) return notFound(res, 'Success story not found.')
  return success(res, { story })
}

// POST /api/success-stories  (admin only)
exports.create = async (req, res) => {
  const story = await SuccessStory.create(req.body)
  return created(res, { story }, 'Success story published.')
}
