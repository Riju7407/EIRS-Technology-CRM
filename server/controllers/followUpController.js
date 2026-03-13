const FollowUp = require('../models/FollowUp');
const Client = require('../models/Client');

// @desc    Get all follow-ups
// @route   GET /api/followups
// @access  Private
exports.getFollowUps = async (req, res) => {
  try {
    const { status, label, priority, assignedTo, clientId, page = 1, limit = 10 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (label) query.label = label;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (clientId) query.client = clientId;

    // Auto-flag overdue follow-ups
    await FollowUp.updateMany(
      { status: 'scheduled', scheduledDate: { $lt: new Date() }, isDeleted: false },
      { status: 'overdue' }
    );

    const total = await FollowUp.countDocuments(query);
    const followUps = await FollowUp.find(query)
      .populate('client', 'firstName lastName email phone company')
      .populate('scheduledBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ scheduledDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: followUps.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      followUps,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single follow-up
// @route   GET /api/followups/:id
// @access  Private
exports.getFollowUpById = async (req, res) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, isDeleted: false })
      .populate('client', 'firstName lastName email phone company')
      .populate('scheduledBy', 'name email role')
      .populate('assignedTo', 'name email role');
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.status(200).json({ success: true, followUp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create follow-up
// @route   POST /api/followups
// @access  Private/Admin
exports.createFollowUp = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.body.client, isDeleted: false });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const followUp = await FollowUp.create({
      ...req.body,
      scheduledBy: req.user.id,
    });

    await followUp.populate([
      { path: 'client', select: 'firstName lastName email phone' },
      { path: 'scheduledBy', select: 'name email' },
    ]);

    res.status(201).json({ success: true, message: 'Follow-up scheduled successfully', followUp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update follow-up
// @route   PUT /api/followups/:id
// @access  Private
exports.updateFollowUp = async (req, res) => {
  try {
    if (req.body.status === 'completed') {
      req.body.completedAt = new Date();
    }

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('client', 'firstName lastName email phone')
      .populate('scheduledBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    res.status(200).json({ success: true, message: 'Follow-up updated successfully', followUp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete follow-up (soft delete)
// @route   DELETE /api/followups/:id
// @access  Private/Admin
exports.deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.status(200).json({ success: true, message: 'Follow-up deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get follow-up stats
// @route   GET /api/followups/stats
// @access  Private
exports.getFollowUpStats = async (req, res) => {
  try {
    const scheduled = await FollowUp.countDocuments({ status: 'scheduled', isDeleted: false });
    const overdue = await FollowUp.countDocuments({ status: 'overdue', isDeleted: false });
    const completed = await FollowUp.countDocuments({ status: 'completed', isDeleted: false });
    const pending = await FollowUp.countDocuments({ label: 'Pending Response', isDeleted: false, status: { $nin: ['completed', 'cancelled'] } });
    const paymentDue = await FollowUp.countDocuments({ label: 'Payment Due', isDeleted: false, status: { $nin: ['completed', 'cancelled'] } });

    const byLabel = await FollowUp.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$label', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const upcomingToday = await FollowUp.find({
      status: 'scheduled',
      isDeleted: false,
      scheduledDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    })
      .populate('client', 'firstName lastName phone')
      .sort({ scheduledDate: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: { scheduled, overdue, completed, pending, paymentDue },
      byLabel,
      upcomingToday,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available follow-up labels
// @route   GET /api/followups/labels
// @access  Private
exports.getLabels = async (req, res) => {
  res.status(200).json({ success: true, labels: FollowUp.schema.path('label').enumValues });
};
