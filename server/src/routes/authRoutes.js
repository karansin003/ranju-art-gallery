const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().withMessage('A valid email is required.'), body('password').notEmpty()],
  validate,
  authController.login
);

router.post('/setup', authController.setupFirstAdmin);
router.get('/me', requireAdmin, authController.me);

module.exports = router;
