const express = require('express');
const router = express.Router();
const {
  getInteractions,
  getInteractionById,
  createInteraction,
  updateInteraction,
  deleteInteraction,
  getClientInteractions,
  getInteractionStats,
} = require('../controllers/interactionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getInteractionStats);
router.get('/client/:clientId', protect, getClientInteractions);

router.route('/').get(protect, getInteractions).post(protect, createInteraction);

router
  .route('/:id')
  .get(protect, getInteractionById)
  .put(protect, updateInteraction)
  .delete(protect, authorize('admin'), deleteInteraction);

module.exports = router;
