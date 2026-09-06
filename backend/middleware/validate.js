const { validationResult } = require('express-validator')
const { badRequest }       = require('../utils/response')

/**
 * Reads express-validator errors from request and short-circuits with 400
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return badRequest(res, 'Validation failed', errors.array())
  }
  next()
}

module.exports = validate
