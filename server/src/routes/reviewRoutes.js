const express = require('express');
const reviewController = require('../controllers/reviewController');
const { requireAdmin } = require('../middleware/auth');
const { publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Public
router.get('/', reviewController.listApproved);
router.post('/', publicWriteLimiter, reviewController.create);

// Admin only
router.get('/status/:status', requireAdmin, reviewController.listByStatus);
router.put('/:id/status', requireAdmin, reviewController.updateStatus);
router.delete('/:id', requireAdmin, reviewController.remove);

module.exports = router;
