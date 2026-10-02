const express = require('express');
const customRequestController = require('../controllers/customRequestController');
const { requireAdmin } = require('../middleware/auth');
const { publicWriteLimiter } = require('../middleware/rateLimit');
const { upload } = require('../config/upload');

const router = express.Router();

router.post('/', publicWriteLimiter, upload.single('reference_image'), customRequestController.create);
router.get('/', requireAdmin, customRequestController.list);
router.put('/:id/status', requireAdmin, customRequestController.updateStatus);

module.exports = router;
