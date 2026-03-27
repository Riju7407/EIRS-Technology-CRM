const Employee = require('../models/Employee');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res) => {
  try {
    const { status, region, search, page = 1, limit = 10 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private
exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create({ ...req.body });
    res.status(201).json({ success: true, message: 'Employee created successfully', employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, message: 'Employee updated successfully', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get employee stats
// @route   GET /api/employees/stats
// @access  Private
exports.getEmployeeStats = async (req, res) => {
  try {
    const total = await Employee.countDocuments({ isDeleted: false });
    const active = await Employee.countDocuments({ isDeleted: false, status: 'active' });
    const onLeave = await Employee.countDocuments({ isDeleted: false, status: 'on-leave' });

    const byRegion = await Employee.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ success: true, stats: { total, active, onLeave }, byRegion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
