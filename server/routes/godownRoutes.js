const express = require('express');
const router = express.Router();
const { getGodowns, createGodown, updateGodown, deleteGodown } = require('../controllers/godownController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(protect, authorize('admin'), getGodowns).post(protect, authorize('admin'), createGodown);
router.route('/:id').put(protect, authorize('admin'), updateGodown).delete(protect, authorize('admin'), deleteGodown);

module.exports = router;