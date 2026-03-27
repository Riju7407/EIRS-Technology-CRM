const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
} = require('../controllers/campaignController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getCampaignStats);
router.route('/').get(protect, getCampaigns).post(protect, createCampaign);
router.route('/:id').put(protect, updateCampaign).delete(protect, authorize('admin'), deleteCampaign);

module.exports = router;
