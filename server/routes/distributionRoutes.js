const express = require('express');
const router = express.Router();
const {
  getDistributions,
  createDistribution,
  updateDistribution,
  deleteDistribution,
  getDistributionStats,
} = require('../controllers/distributionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getDistributionStats);
router.route('/').get(protect, getDistributions).post(protect, authorize('admin'), createDistribution);
router.route('/:id').put(protect, authorize('admin'), updateDistribution).delete(protect, authorize('admin'), deleteDistribution);

module.exports = router;
