const express = require('express');
const contactController = require('../controllers/contactController');
const { requireAdmin } = require('../middleware/auth');
const { publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', publicWriteLimiter, contactController.create);
router.get('/', requireAdmin, contactController.list);
router.put('/:id/status', requireAdmin, contactController.updateStatus);

module.exports = router;
