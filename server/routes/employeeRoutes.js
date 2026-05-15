const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getMyEmployeeProfile,
  updateMyEmployeeProfile,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, getMyEmployeeProfile);
router.put('/me', protect, updateMyEmployeeProfile);
router.get('/stats', protect, authorize('admin'), getEmployeeStats);
router.route('/').get(protect, authorize('admin'), getEmployees).post(protect, authorize('admin'), createEmployee);
router.route('/:id').put(protect, authorize('admin'), updateEmployee).delete(protect, authorize('admin'), deleteEmployee);

module.exports = router;
