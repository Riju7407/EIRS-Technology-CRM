const Employee = require('../models/Employee');
const User = require('../models/User');

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
      .select('-password')
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

// @desc    Get current employee profile
// @route   GET /api/employees/me
// @access  Private
exports.getMyEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.user.email, isDeleted: false }).select('-password');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    res.status(200).json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current employee profile
// @route   PUT /api/employees/me
// @access  Private
exports.updateMyEmployeeProfile = async (req, res) => {
  try {
    const { name, email, phone, department, region, notes, currentPassword, newPassword } = req.body;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;

    const employee = await Employee.findOne({ email: req.user.email, isDeleted: false });
    const user = await User.findById(req.user.id).select('+password');

    if (!employee || !user) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    if (normalizedEmail && normalizedEmail !== employee.email) {
      const emailConflict = await Promise.all([
        User.findOne({ email: normalizedEmail }),
        Employee.findOne({ email: normalizedEmail, isDeleted: { $ne: true } }),
      ]);

      if (emailConflict[0] || (emailConflict[1] && String(emailConflict[1]._id) !== String(employee._id))) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      user.password = newPassword;
    }

    if (name) {
      employee.name = name;
      user.name = name;
    }
    if (normalizedEmail) {
      employee.email = normalizedEmail;
      user.email = normalizedEmail;
    }
    if (phone !== undefined) employee.phone = phone;
    if (department !== undefined) employee.department = department;
    if (region !== undefined) employee.region = region;
    if (notes !== undefined) employee.notes = notes;

    await employee.save();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      employee,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin },
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
    const { password, email, ...employeeData } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required for employee login' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A login account with this email already exists' });
    }

    const employee = await Employee.create({
      ...employeeData,
      email: normalizedEmail,
      password,
    });

    try {
      await User.create({
        name: employee.name,
        email: normalizedEmail,
        password,
        role: 'employee',
        isAdmin: false,
        isActive: employee.status !== 'inactive',
      });
    } catch (userError) {
      await Employee.findByIdAndDelete(employee._id);
      throw userError;
    }

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
    const { password, email, ...employeeData } = req.body;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;
    const existingEmployee = await Employee.findOne({ _id: req.params.id, isDeleted: false });

    if (!existingEmployee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (normalizedEmail && normalizedEmail !== existingEmployee.email) {
      const emailInUse = await User.findOne({ email: normalizedEmail });
      if (emailInUse) {
        return res.status(400).json({ success: false, message: 'A login account with this email already exists' });
      }
    }

    existingEmployee.set({
      ...employeeData,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
    });

    if (password && String(password).trim()) {
      existingEmployee.password = password;
    }

    const employee = await existingEmployee.save();

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const user = await User.findOne({ email: existingEmployee.email });
    if (user) {
      user.name = employee.name;
      user.email = employee.email;
      user.isActive = employee.status !== 'inactive';
      if (password && String(password).trim()) {
        user.password = password;
      }
      await user.save();
    } else if (password && String(password).trim()) {
      await User.create({
        name: employee.name,
        email: employee.email,
        password,
        role: 'employee',
        isAdmin: false,
        isActive: employee.status !== 'inactive',
      });
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

    await User.findOneAndUpdate(
      { email: employee.email },
      { isActive: false },
      { new: true }
    );

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
