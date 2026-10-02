const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, dashboardController.overview);

module.exports = router;
