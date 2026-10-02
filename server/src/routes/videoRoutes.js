const express = require('express');
const videoController = require('../controllers/videoController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', videoController.list);
router.get('/featured', videoController.getFeatured);
router.post('/', requireAdmin, videoController.create);
router.put('/:id', requireAdmin, videoController.update);
router.delete('/:id', requireAdmin, videoController.remove);

module.exports = router;
