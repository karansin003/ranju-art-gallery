const express = require('express');
const artworkController = require('../controllers/artworkController');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../config/upload');

const router = express.Router();

const artworkUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 8 },
]);

// Public
router.get('/', artworkController.list);
router.get('/featured', artworkController.getFeatured);
router.get('/:id', artworkController.getOne);

// Admin only
router.post('/', requireAdmin, artworkUpload, artworkController.create);
router.put('/:id', requireAdmin, artworkUpload, artworkController.update);
router.patch('/:id/availability', requireAdmin, artworkController.updateAvailability);
router.delete('/:id/images/:imageId', requireAdmin, artworkController.removeGalleryImage);
router.delete('/:id', requireAdmin, artworkController.remove);

module.exports = router;
