const Distribution = require('../models/Distribution');
const Prospect = require('../models/Prospect');
const Employee = require('../models/Employee');

const escapeRegex = (text = '') => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateAssignmentId = async () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Distribution.countDocuments({
    assignmentId: { $regex: `^ASG-${datePart}-` },
  });
  return `ASG-${datePart}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all distributions
// @route   GET /api/distribution
// @access  Private
exports.getDistributions = async (req, res) => {
  try {
    const { status, assignedTo, search, page = 1, limit = 10 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      const [matchedProspects, matchedEmployees] = await Promise.all([
        Prospect.find({
          isDeleted: false,
          $or: [
            { firstName: { $regex: regex } },
            { lastName: { $regex: regex } },
            { email: { $regex: regex } },
            { phone: { $regex: regex } },
            { company: { $regex: regex } },
          ],
        }).select('_id'),
        Employee.find({
          isDeleted: false,
          $or: [
            { name: { $regex: regex } },
            { email: { $regex: regex } },
            { role: { $regex: regex } },
          ],
        }).select('_id'),
      ]);

      query.$or = [
        { assignmentId: { $regex: regex } },
        { prospect: { $in: matchedProspects.map((item) => item._id) } },
        { assignedTo: { $in: matchedEmployees.map((item) => item._id) } },
      ];
    }

    const total = await Distribution.countDocuments(query);
    const distributions = await Distribution.find(query)
      .populate('prospect', 'firstName lastName email phone company stage')
      .populate('assignedTo', 'name email role department region')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: distributions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      distributions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create distribution
// @route   POST /api/distribution
// @access  Private/Admin
exports.createDistribution = async (req, res) => {
  try {
    const { prospect, assignedTo, status, priority, dueDate, notes } = req.body;

    if (!prospect || !assignedTo) {
      return res.status(400).json({ success: false, message: 'Prospect and employee are required' });
    }

    const [prospectRecord, employeeRecord] = await Promise.all([
      Prospect.findOne({ _id: prospect, isDeleted: false }),
      Employee.findOne({ _id: assignedTo, isDeleted: false }),
    ]);

    if (!prospectRecord) {
      return res.status(404).json({ success: false, message: 'Prospect not found' });
    }

    if (!employeeRecord) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const assignmentId = req.body.assignmentId || (await generateAssignmentId());

    const distribution = await Distribution.create({
      assignmentId,
      prospect,
      assignedTo,
      assignedBy: req.user.id,
      status: status || 'assigned',
      priority: priority || 'medium',
      dueDate: dueDate || undefined,
      notes,
      assignedAt: new Date(),
    });

    const populatedDistribution = await Distribution.findById(distribution._id)
      .populate('prospect', 'firstName lastName email phone company stage')
      .populate('assignedTo', 'name email role department region')
      .populate('assignedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Prospect assigned successfully',
      distribution: populatedDistribution,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Assignment ID already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update distribution
// @route   PUT /api/distribution/:id
// @access  Private/Admin
exports.updateDistribution = async (req, res) => {
  try {
    const { prospect, assignedTo, status, priority, dueDate, notes } = req.body;
    const updatePayload = {
      status,
      priority,
      dueDate: dueDate || null,
      notes,
    };

    if (prospect) {
      const prospectRecord = await Prospect.findOne({ _id: prospect, isDeleted: false });
      if (!prospectRecord) {
        return res.status(404).json({ success: false, message: 'Prospect not found' });
      }
      updatePayload.prospect = prospect;
    }

    if (assignedTo) {
      const employeeRecord = await Employee.findOne({ _id: assignedTo, isDeleted: false });
      if (!employeeRecord) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      updatePayload.assignedTo = assignedTo;
    }

    if (status === 'converted' || status === 'closed') {
      updatePayload.completedAt = new Date();
    }

    const distribution = await Distribution.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updatePayload,
      { new: true, runValidators: true }
    )
      .populate('prospect', 'firstName lastName email phone company stage')
      .populate('assignedTo', 'name email role department region')
      .populate('assignedBy', 'name email role');

    if (!distribution) {
      return res.status(404).json({ success: false, message: 'Distribution item not found' });
    }

    res.status(200).json({ success: true, message: 'Assignment updated successfully', distribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete distribution (soft delete)
// @route   DELETE /api/distribution/:id
// @access  Private/Admin
exports.deleteDistribution = async (req, res) => {
  try {
    const distribution = await Distribution.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!distribution) {
      return res.status(404).json({ success: false, message: 'Distribution item not found' });
    }

    res.status(200).json({ success: true, message: 'Distribution deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get distribution stats
// @route   GET /api/distribution/stats
// @access  Private
exports.getDistributionStats = async (req, res) => {
  try {
    const total = await Distribution.countDocuments({ isDeleted: false });
    const active = await Distribution.countDocuments({
      isDeleted: false,
      status: { $in: ['assigned', 'in_progress', 'contacted'] },
    });
    const completed = await Distribution.countDocuments({
      isDeleted: false,
      status: { $in: ['converted', 'closed'] },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayAssignments = await Distribution.countDocuments({
      isDeleted: false,
      assignedAt: { $gte: todayStart },
    });

    const topAssignees = await Distribution.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $project: {
          _id: 0,
          assignedTo: { $arrayElemAt: ['$employee.name', 0] },
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        completed,
        todayAssignments,
      },
      topAssignees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
