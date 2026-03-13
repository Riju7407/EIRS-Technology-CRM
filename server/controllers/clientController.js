const Client = require('../models/Client');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    const { status, source, search, page = 1, limit = 10, assignedTo } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (source) query.source = source;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: clients.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      clients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'name email role');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body });
    res.status(201).json({ success: true, message: 'Client created successfully', client });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Client with this email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, message: 'Client updated successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client (soft delete)
// @route   DELETE /api/clients/:id
// @access  Private/Admin
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add purchase to client
// @route   POST /api/clients/:id/purchase
// @access  Private
exports.addPurchase = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    client.purchaseHistory.push(req.body);
    await client.save();
    res.status(201).json({ success: true, message: 'Purchase added', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get client stats (dashboard)
// @route   GET /api/clients/stats
// @access  Private
exports.getClientStats = async (req, res) => {
  try {
    const total = await Client.countDocuments({ isDeleted: false });
    const active = await Client.countDocuments({ isDeleted: false, status: 'active' });
    const leads = await Client.countDocuments({ isDeleted: false, status: 'lead' });
    const churned = await Client.countDocuments({ isDeleted: false, status: 'churned' });

    const recentClients = await Client.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email status createdAt');

    res.status(200).json({
      success: true,
      stats: { total, active, leads, churned },
      recentClients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
