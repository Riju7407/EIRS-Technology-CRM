const express = require('express');
const {
  upsertWebsiteUser,
  upsertWebsiteOrder,
  upsertWebsiteBooking,
  upsertWebsiteContact,
  updateWebsiteUser,
  updateWebsiteOrder,
  updateWebsiteBooking,
  updateWebsiteContact,
  deleteWebsiteUser,
  deleteWebsiteOrder,
  deleteWebsiteBooking,
  deleteWebsiteContact,
  getWebsiteUsers,
  getWebsiteOrders,
  getWebsiteBookings,
  getWebsiteContacts,
  getWebsiteSyncStats,
  seedDemoData,
  clearDemoData,
} = require('../controllers/websiteSyncController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public endpoints for seeding/clearing demo data (for testing only)
router.post('/seed-demo', seedDemoData);
router.delete('/clear-demo', clearDemoData);

// Protected endpoints - require admin auth
router.get('/stats', protect, authorize('admin'), getWebsiteSyncStats);
router.get('/users', protect, authorize('admin'), getWebsiteUsers);
router.get('/orders', protect, authorize('admin'), getWebsiteOrders);
router.get('/bookings', protect, authorize('admin'), getWebsiteBookings);
router.get('/contacts', protect, authorize('admin'), getWebsiteContacts);

router.post('/users', protect, authorize('admin'), upsertWebsiteUser);
router.post('/orders', protect, authorize('admin'), upsertWebsiteOrder);
router.post('/bookings', protect, authorize('admin'), upsertWebsiteBooking);
router.post('/contacts', protect, authorize('admin'), upsertWebsiteContact);

router.put('/users/:id', protect, authorize('admin'), updateWebsiteUser);
router.put('/orders/:id', protect, authorize('admin'), updateWebsiteOrder);
router.put('/bookings/:id', protect, authorize('admin'), updateWebsiteBooking);
router.put('/contacts/:id', protect, authorize('admin'), updateWebsiteContact);

router.delete('/users/:id', protect, authorize('admin'), deleteWebsiteUser);
router.delete('/orders/:id', protect, authorize('admin'), deleteWebsiteOrder);
router.delete('/bookings/:id', protect, authorize('admin'), deleteWebsiteBooking);
router.delete('/contacts/:id', protect, authorize('admin'), deleteWebsiteContact);

module.exports = router;
