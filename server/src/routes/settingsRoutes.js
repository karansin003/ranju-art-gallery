const express = require('express');
const settingsController = require('../controllers/settingsController');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../config/upload');

const router = express.Router();

const settingsUpload = upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'website_logo', maxCount: 1 },
]);

router.get('/', settingsController.getPublic);
router.put('/', requireAdmin, settingsUpload, settingsController.update);

module.exports = router;
