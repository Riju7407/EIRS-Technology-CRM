const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addPurchase,
  getClientStats,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');

// Stats route MUST come before /:id routes
router.get('/stats', protect, getClientStats);

router.route('/').get(protect, getClients).post(protect, createClient);

router
  .route('/:id')
  .get(protect, getClientById)
  .put(protect, updateClient)
  .delete(protect, authorize('admin'), deleteClient);

router.post('/:id/purchase', protect, addPurchase);

module.exports = router;
