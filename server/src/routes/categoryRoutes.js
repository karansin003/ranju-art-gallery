const express = require('express');
const categoryController = require('../controllers/categoryController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', categoryController.list);
router.post('/', requireAdmin, categoryController.create);
router.delete('/:id', requireAdmin, categoryController.remove);

module.exports = router;
