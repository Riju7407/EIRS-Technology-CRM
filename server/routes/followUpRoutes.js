const express = require('express');
const router = express.Router();
const {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  getFollowUpStats,
  getLabels,
} = require('../controllers/followUpController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getFollowUpStats);
router.get('/labels', protect, getLabels);

router.route('/').get(protect, getFollowUps).post(protect, createFollowUp);

router
  .route('/:id')
  .get(protect, getFollowUpById)
  .put(protect, updateFollowUp)
  .delete(protect, authorize('admin'), deleteFollowUp);

module.exports = router;
