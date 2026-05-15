const express = require('express');
const router = express.Router();
const {
  getDistributions,
  getMyDistributions,
  updateMyDistribution,
  createDistribution,
  updateDistribution,
  deleteDistribution,
  getDistributionStats,
} = require('../controllers/distributionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getDistributionStats);
router.get('/my', protect, getMyDistributions);
router.route('/').get(protect, getDistributions).post(protect, authorize('admin'), createDistribution);
router.put('/my/:id', protect, updateMyDistribution);
router.route('/:id').put(protect, authorize('admin'), updateDistribution).delete(protect, authorize('admin'), deleteDistribution);

module.exports = router;
