const Interaction = require('../models/Interaction');
const Client = require('../models/Client');

// @desc    Get all interactions
// @route   GET /api/interactions
// @access  Private
exports.getInteractions = async (req, res) => {
  try {
    const { type, status, priority, clientId, page = 1, limit = 10, search } = req.query;
    const query = { isDeleted: false };

    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (clientId) query.client = clientId;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Interaction.countDocuments(query);
    const interactions = await Interaction.find(query)
      .populate('client', 'firstName lastName email phone company')
      .populate('loggedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: interactions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      interactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single interaction
// @route   GET /api/interactions/:id
// @access  Private
exports.getInteractionById = async (req, res) => {
  try {
    const interaction = await Interaction.findOne({ _id: req.params.id, isDeleted: false })
      .populate('client', 'firstName lastName email phone company')
      .populate('loggedBy', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('followUp');

    if (!interaction) {
      return res.status(404).json({ success: false, message: 'Interaction not found' });
    }
    res.status(200).json({ success: true, interaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create interaction log
// @route   POST /api/interactions
// @access  Private
exports.createInteraction = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.body.client, isDeleted: false });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const interaction = await Interaction.create({
      ...req.body,
      loggedBy: req.user.id,
    });

    await interaction.populate([
      { path: 'client', select: 'firstName lastName email phone' },
      { path: 'loggedBy', select: 'name email' },
    ]);

    res.status(201).json({ success: true, message: 'Interaction logged successfully', interaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update interaction
// @route   PUT /api/interactions/:id
// @access  Private
exports.updateInteraction = async (req, res) => {
  try {
    if (req.body.status === 'resolved' || req.body.status === 'closed') {
      req.body.resolvedAt = new Date();
      req.body.resolvedBy = req.user.id;
    }

    const interaction = await Interaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('client', 'firstName lastName email phone')
      .populate('loggedBy', 'name email')
      .populate('resolvedBy', 'name email');

    if (!interaction) {
      return res.status(404).json({ success: false, message: 'Interaction not found' });
    }

    res.status(200).json({ success: true, message: 'Interaction updated successfully', interaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete interaction (soft delete)
// @route   DELETE /api/interactions/:id
// @access  Private/Admin
exports.deleteInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!interaction) {
      return res.status(404).json({ success: false, message: 'Interaction not found' });
    }
    res.status(200).json({ success: true, message: 'Interaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get interactions for a specific client
// @route   GET /api/interactions/client/:clientId
// @access  Private
exports.getClientInteractions = async (req, res) => {
  try {
    const interactions = await Interaction.find({ client: req.params.clientId, isDeleted: false })
      .populate('loggedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: interactions.length, interactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get interaction stats
// @route   GET /api/interactions/stats
// @access  Private
exports.getInteractionStats = async (req, res) => {
  try {
    const total = await Interaction.countDocuments({ isDeleted: false });
    const open = await Interaction.countDocuments({ status: 'open', isDeleted: false });
    const resolved = await Interaction.countDocuments({ status: 'resolved', isDeleted: false });
    const escalated = await Interaction.countDocuments({ status: 'escalated', isDeleted: false });

    const byType = await Interaction.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const bySentiment = await Interaction.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: { total, open, resolved, escalated },
      byType,
      bySentiment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
