const Campaign = require('../models/Campaign');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = async (req, res) => {
  try {
    const { status, channel, search, page = 1, limit = 10 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (channel) query.channel = channel;
    if (search) {
      query.$or = [
        { campaignId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { channel: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: campaigns.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      campaigns,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body });
    res.status(201).json({ success: true, message: 'Campaign created successfully', campaign });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Campaign ID already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.status(200).json({ success: true, message: 'Campaign updated successfully', campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete campaign (soft delete)
// @route   DELETE /api/campaigns/:id
// @access  Private/Admin
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get campaign stats
// @route   GET /api/campaigns/stats
// @access  Private
exports.getCampaignStats = async (req, res) => {
  try {
    const total = await Campaign.countDocuments({ isDeleted: false });
    const active = await Campaign.countDocuments({ isDeleted: false, status: 'active' });
    const completed = await Campaign.countDocuments({ isDeleted: false, status: 'completed' });

    const aggregate = await Campaign.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalReach: { $sum: '$reach' },
          avgRoi: { $avg: '$roi' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        completed,
        totalReach: aggregate[0]?.totalReach || 0,
        avgRoi: aggregate[0]?.avgRoi || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
