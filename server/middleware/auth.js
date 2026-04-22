const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - must be logged in
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Authorize by roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user has required role OR is admin
    const userRole = req.user.role || 'user';
    const isAdmin = Boolean(req.user.isAdmin);
    const hasRole = roles.includes(userRole);
    const isAdminRole = roles.includes('admin');

    // Allow if user has matching role OR if checking for admin and user is admin
    if (!hasRole && !(isAdminRole && isAdmin)) {
      return res.status(403).json({
        success: false,
        message: `User is not authorized to access this resource (role: ${userRole}, isAdmin: ${isAdmin})`,
      });
    }
    next();
  };
};
