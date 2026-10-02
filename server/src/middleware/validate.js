const { validationResult } = require('express-validator');

// Run after an express-validator chain; returns a clean 400 with the
// first validation problem instead of letting bad data reach a controller.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, fields: errors.array() });
  }
  next();
}

module.exports = validate;
