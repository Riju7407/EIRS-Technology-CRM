const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getEmployeeStats);
router.route('/').get(protect, getEmployees).post(protect, createEmployee);
router.route('/:id').put(protect, updateEmployee).delete(protect, authorize('admin'), deleteEmployee);

module.exports = router;
