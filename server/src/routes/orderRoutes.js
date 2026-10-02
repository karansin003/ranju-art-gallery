const express = require('express');
const orderController = require('../controllers/orderController');
const { requireAdmin } = require('../middleware/auth');
const { publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Public
router.post('/', publicWriteLimiter, orderController.create);
router.get('/track/:orderNumber', orderController.getByOrderNumber);

// Admin only
router.get('/', requireAdmin, orderController.list);
router.get('/:id', requireAdmin, orderController.getOne);
router.put('/:id/status', requireAdmin, orderController.updateStatus);

module.exports = router;
