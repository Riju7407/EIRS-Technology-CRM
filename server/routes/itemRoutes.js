const express = require('express');
const router = express.Router();
const { getItems, createItem, updateItem, deleteItem, getItemStats } = require('../controllers/itemController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getItemStats);
router.route('/').get(protect, authorize('admin'), getItems).post(protect, authorize('admin'), createItem);
router.route('/:id').put(protect, authorize('admin'), updateItem).delete(protect, authorize('admin'), deleteItem);

module.exports = router;