const express = require('express');
const {
  upsertWebsiteUser,
  upsertWebsiteOrder,
  upsertWebsiteBooking,
  upsertWebsiteContact,
  getWebsiteUsers,
  getWebsiteOrders,
  getWebsiteBookings,
  getWebsiteContacts,
  getWebsiteSyncStats,
} = require('../controllers/websiteSyncController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getWebsiteSyncStats);
router.get('/users', protect, authorize('admin'), getWebsiteUsers);
router.get('/orders', protect, authorize('admin'), getWebsiteOrders);
router.get('/bookings', protect, authorize('admin'), getWebsiteBookings);
router.get('/contacts', protect, authorize('admin'), getWebsiteContacts);

router.post('/users', protect, upsertWebsiteUser);
router.post('/orders', protect, upsertWebsiteOrder);
router.post('/bookings', protect, upsertWebsiteBooking);
router.post('/contacts', protect, upsertWebsiteContact);

module.exports = router;
