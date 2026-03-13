const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, updatePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.get('/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
