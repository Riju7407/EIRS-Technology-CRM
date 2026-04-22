const WebsiteUser = require('../models/WebsiteUser');
const WebsiteOrder = require('../models/WebsiteOrder');
const WebsiteBooking = require('../models/WebsiteBooking');
const WebsiteContact = require('../models/WebsiteContact');

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePagination = (query = {}) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildSearch = (search, fields) => {
  if (!search) return null;
  const regex = { $regex: String(search).trim(), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const generateExternalId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

exports.upsertWebsiteUser = async (req, res) => {
  try {
    const payload = req.body || {};
    const externalUserId = String(payload.externalUserId || generateExternalId('manual-user'));

    const update = {
      name: payload.name || 'Website User',
      email: payload.email || '',
      phoneNumber: payload.phoneNumber || '',
      address: payload.address || '',
      city: payload.city || '',
      state: payload.state || '',
      pincode: payload.pincode || '',
      isAdmin: Boolean(payload.isAdmin),
      source: payload.source || 'website',
      lastSyncedAt: new Date(),
    };

    const user = await WebsiteUser.findOneAndUpdate(
      { externalUserId },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertWebsiteOrder = async (req, res) => {
  try {
    const payload = req.body || {};
    const externalOrderId = String(payload.externalOrderId || generateExternalId('manual-order'));

    const update = {
      externalUserId: payload.externalUserId || '',
      customerName: payload.customerName || '',
      customerEmail: payload.customerEmail || '',
      customerPhone: payload.customerPhone || '',
      totalPrice: Number(payload.totalPrice || 0),
      totalItems: Number(payload.totalItems || 0),
      status: payload.status || 'Pending',
      paymentStatus: payload.paymentStatus || 'Pending',
      paymentMethod: payload.paymentMethod || '',
      notes: payload.notes || '',
      orderDate: toDate(payload.orderDate) || new Date(),
      items: Array.isArray(payload.items) ? payload.items : [],
      shippingAddress: payload.shippingAddress || {},
      source: payload.source || 'website',
      lastSyncedAt: new Date(),
    };

    const order = await WebsiteOrder.findOneAndUpdate(
      { externalOrderId },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertWebsiteBooking = async (req, res) => {
  try {
    const payload = req.body || {};
    const externalBookingId = String(payload.externalBookingId || generateExternalId('manual-booking'));

    const update = {
      externalUserId: payload.externalUserId || '',
      serviceId: payload.serviceId || '',
      serviceName: payload.serviceName || '',
      servicePrice: Number(payload.servicePrice || 0),
      customerName: payload.customerName || '',
      email: payload.email || '',
      phoneNumber: payload.phoneNumber || '',
      address: payload.address || '',
      preferredDate: toDate(payload.preferredDate),
      notes: payload.notes || '',
      source: payload.source || 'website',
      lastSyncedAt: new Date(),
    };

    const booking = await WebsiteBooking.findOneAndUpdate(
      { externalBookingId },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertWebsiteContact = async (req, res) => {
  try {
    const payload = req.body || {};
    const externalContactId = String(payload.externalContactId || generateExternalId('manual-contact'));

    const update = {
      name: payload.name || 'Website Contact',
      email: payload.email || '',
      phoneNumber: payload.phoneNumber || '',
      subject: payload.subject || '',
      message: payload.message || '',
      source: payload.source || 'website',
      lastSyncedAt: new Date(),
    };

    const contact = await WebsiteContact.findOneAndUpdate(
      { externalContactId },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWebsiteUsers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { source: 'website' };
    const searchFilter = buildSearch(req.query.search, ['name', 'email', 'phoneNumber', 'address']);
    if (searchFilter) Object.assign(filter, searchFilter);

    const [total, users] = await Promise.all([
      WebsiteUser.countDocuments(filter),
      WebsiteUser.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWebsiteOrders = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { source: 'website' };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const searchFilter = buildSearch(req.query.search, [
      'externalOrderId',
      'customerName',
      'customerEmail',
      'customerPhone',
      'paymentMethod',
    ]);
    if (searchFilter) Object.assign(filter, searchFilter);

    const [total, orders] = await Promise.all([
      WebsiteOrder.countDocuments(filter),
      WebsiteOrder.find(filter).sort({ orderDate: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWebsiteBookings = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { source: 'website' };
    const searchFilter = buildSearch(req.query.search, ['serviceName', 'customerName', 'email', 'phoneNumber']);
    if (searchFilter) Object.assign(filter, searchFilter);

    const [total, bookings] = await Promise.all([
      WebsiteBooking.countDocuments(filter),
      WebsiteBooking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWebsiteContacts = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { source: 'website' };
    const searchFilter = buildSearch(req.query.search, ['name', 'email', 'phoneNumber', 'subject', 'message']);
    if (searchFilter) Object.assign(filter, searchFilter);

    const [total, contacts] = await Promise.all([
      WebsiteContact.countDocuments(filter),
      WebsiteContact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      contacts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWebsiteSyncStats = async (_req, res) => {
  try {
    const [users, orders, bookings, contacts, revenueAgg] = await Promise.all([
      WebsiteUser.countDocuments({ source: 'website' }),
      WebsiteOrder.countDocuments({ source: 'website' }),
      WebsiteBooking.countDocuments({ source: 'website' }),
      WebsiteContact.countDocuments({ source: 'website' }),
      WebsiteOrder.aggregate([
        { $match: { source: 'website' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
      ]),
    ]);

    const totalRevenue = Number(revenueAgg?.[0]?.totalRevenue || 0);

    return res.status(200).json({
      success: true,
      stats: { users, orders, bookings, contacts, totalRevenue },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Seed demo data for testing and demonstrations
exports.seedDemoData = async (_req, res) => {
  try {
    // Check if data already exists
    const existingCounts = await Promise.all([
      WebsiteUser.countDocuments({ source: 'website' }),
      WebsiteOrder.countDocuments({ source: 'website' }),
      WebsiteBooking.countDocuments({ source: 'website' }),
      WebsiteContact.countDocuments({ source: 'website' }),
    ]);

    if (existingCounts.some(count => count > 0)) {
      return res.status(400).json({
        success: false,
        message: 'Demo data already exists. Clear collections first if you want to reseed.',
        counts: {
          users: existingCounts[0],
          orders: existingCounts[1],
          bookings: existingCounts[2],
          contacts: existingCounts[3],
        },
      });
    }

    // Sample users
    const sampleUsers = [
      { externalUserId: 'web-user-001', name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phoneNumber: '9876543210', address: '123 Main Street', city: 'Delhi', state: 'Delhi', pincode: '110001' },
      { externalUserId: 'web-user-002', name: 'Priya Singh', email: 'priya.singh@example.com', phoneNumber: '9876543211', address: '456 Park Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      { externalUserId: 'web-user-003', name: 'Amit Patel', email: 'amit.patel@example.com', phoneNumber: '9876543212', address: '789 Business Park', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      { externalUserId: 'web-user-004', name: 'Neha Verma', email: 'neha.verma@example.com', phoneNumber: '9876543213', address: '321 Tech Plaza', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      { externalUserId: 'web-user-005', name: 'Vikram Singh', email: 'vikram.singh@example.com', phoneNumber: '9876543214', address: '654 Commerce Center', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    ];

    // Sample orders
    const sampleOrders = [
      { externalOrderId: 'WEB-ORDER-001', externalUserId: 'web-user-001', customerName: 'Rajesh Kumar', customerEmail: 'rajesh.kumar@example.com', customerPhone: '9876543210', totalPrice: 4999, totalItems: 2, status: 'Delivered', paymentStatus: 'Completed', paymentMethod: 'Card', notes: 'Delivered successfully' },
      { externalOrderId: 'WEB-ORDER-002', externalUserId: 'web-user-002', customerName: 'Priya Singh', customerEmail: 'priya.singh@example.com', customerPhone: '9876543211', totalPrice: 7500, totalItems: 3, status: 'Shipped', paymentStatus: 'Completed', paymentMethod: 'Online', notes: 'In transit' },
      { externalOrderId: 'WEB-ORDER-003', externalUserId: 'web-user-003', customerName: 'Amit Patel', customerEmail: 'amit.patel@example.com', customerPhone: '9876543212', totalPrice: 3299, totalItems: 1, status: 'Confirmed', paymentStatus: 'Completed', paymentMethod: 'UPI', notes: 'Processing order' },
      { externalOrderId: 'WEB-ORDER-004', externalUserId: 'web-user-004', customerName: 'Neha Verma', customerEmail: 'neha.verma@example.com', customerPhone: '9876543213', totalPrice: 5999, totalItems: 2, status: 'Pending', paymentStatus: 'Pending', paymentMethod: 'Cash on Delivery', notes: 'Awaiting confirmation' },
      { externalOrderId: 'WEB-ORDER-005', externalUserId: 'web-user-005', customerName: 'Vikram Singh', customerEmail: 'vikram.singh@example.com', customerPhone: '9876543214', totalPrice: 12000, totalItems: 5, status: 'Delivered', paymentStatus: 'Completed', paymentMethod: 'Card', notes: 'Bulk order completed' },
    ];

    // Sample bookings
    const sampleBookings = [
      { externalBookingId: 'WEB-BOOK-001', externalUserId: 'web-user-001', serviceName: 'Website Development', servicePrice: 25000, customerName: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phoneNumber: '9876543210', address: '123 Main Street, Delhi', preferredDate: new Date(Date.now() + 7*24*60*60*1000), notes: 'Need responsive design' },
      { externalBookingId: 'WEB-BOOK-002', externalUserId: 'web-user-002', serviceName: 'App Development', servicePrice: 40000, customerName: 'Priya Singh', email: 'priya.singh@example.com', phoneNumber: '9876543211', address: '456 Park Avenue, Mumbai', preferredDate: new Date(Date.now() + 14*24*60*60*1000), notes: 'iOS and Android apps' },
      { externalBookingId: 'WEB-BOOK-003', externalUserId: 'web-user-003', serviceName: 'Consultation', servicePrice: 5000, customerName: 'Amit Patel', email: 'amit.patel@example.com', phoneNumber: '9876543212', address: '789 Business Park, Bangalore', preferredDate: new Date(Date.now() + 3*24*60*60*1000), notes: 'Tech strategy discussion' },
      { externalBookingId: 'WEB-BOOK-004', externalUserId: 'web-user-004', serviceName: 'SEO Optimization', servicePrice: 15000, customerName: 'Neha Verma', email: 'neha.verma@example.com', phoneNumber: '9876543213', address: '321 Tech Plaza, Hyderabad', preferredDate: new Date(Date.now() + 5*24*60*60*1000), notes: 'Google ranking improvement' },
    ];

    // Sample contacts
    const sampleContacts = [
      { externalContactId: 'WEB-CONT-001', name: 'Arjun Gupta', email: 'arjun.gupta@example.com', phoneNumber: '9876543215', subject: 'Website Inquiry', message: 'Interested in your services for our startup' },
      { externalContactId: 'WEB-CONT-002', name: 'Deepika Reddy', email: 'deepika.reddy@example.com', phoneNumber: '9876543216', subject: 'Partnership Request', message: 'Want to explore partnership opportunities' },
      { externalContactId: 'WEB-CONT-003', name: 'Sanjay Mehra', email: 'sanjay.mehra@example.com', phoneNumber: '9876543217', subject: 'Support Needed', message: 'Having issues with the current setup' },
      { externalContactId: 'WEB-CONT-004', name: 'Nisha Joshi', email: 'nisha.joshi@example.com', phoneNumber: '9876543218', subject: 'Feedback', message: 'Great experience with your platform!' },
      { externalContactId: 'WEB-CONT-005', name: 'Rohit Sharma', email: 'rohit.sharma@example.com', phoneNumber: '9876543219', subject: 'Pricing Inquiry', message: 'Need custom pricing for large order' },
    ];

    // Insert all sample data
    const [usersInserted, ordersInserted, bookingsInserted, contactsInserted] = await Promise.all([
      WebsiteUser.insertMany(sampleUsers.map(u => ({ ...u, source: 'website' }))),
      WebsiteOrder.insertMany(sampleOrders.map(o => ({ ...o, source: 'website', orderDate: o.orderDate || new Date() }))),
      WebsiteBooking.insertMany(sampleBookings.map(b => ({ ...b, source: 'website' }))),
      WebsiteContact.insertMany(sampleContacts.map(c => ({ ...c, source: 'website' }))),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Demo data seeded successfully',
      data: {
        usersCreated: usersInserted.length,
        ordersCreated: ordersInserted.length,
        bookingsCreated: bookingsInserted.length,
        contactsCreated: contactsInserted.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Clear all demo data
exports.clearDemoData = async (_req, res) => {
  try {
    const [usersDeleted, ordersDeleted, bookingsDeleted, contactsDeleted] = await Promise.all([
      WebsiteUser.deleteMany({ source: 'website' }),
      WebsiteOrder.deleteMany({ source: 'website' }),
      WebsiteBooking.deleteMany({ source: 'website' }),
      WebsiteContact.deleteMany({ source: 'website' }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Demo data cleared successfully',
      data: {
        usersDeleted: usersDeleted.deletedCount,
        ordersDeleted: ordersDeleted.deletedCount,
        bookingsDeleted: bookingsDeleted.deletedCount,
        contactsDeleted: contactsDeleted.deletedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWebsiteUser = async (req, res) => {
  try {
    const payload = req.body || {};
    const update = { lastSyncedAt: new Date() };

    if (hasOwn(payload, 'name')) update.name = payload.name || 'Website User';
    if (hasOwn(payload, 'email')) update.email = payload.email || '';
    if (hasOwn(payload, 'phoneNumber')) update.phoneNumber = payload.phoneNumber || '';
    if (hasOwn(payload, 'address')) update.address = payload.address || '';
    if (hasOwn(payload, 'city')) update.city = payload.city || '';
    if (hasOwn(payload, 'state')) update.state = payload.state || '';
    if (hasOwn(payload, 'pincode')) update.pincode = payload.pincode || '';
    if (hasOwn(payload, 'isAdmin')) update.isAdmin = Boolean(payload.isAdmin);

    const user = await WebsiteUser.findOneAndUpdate(
      { _id: req.params.id, source: 'website' },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Website user not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWebsiteUser = async (req, res) => {
  try {
    const user = await WebsiteUser.findOneAndDelete({ _id: req.params.id, source: 'website' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Website user not found' });
    }
    return res.status(200).json({ success: true, message: 'Website user deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWebsiteOrder = async (req, res) => {
  try {
    const payload = req.body || {};
    const update = { lastSyncedAt: new Date() };

    if (hasOwn(payload, 'externalUserId')) update.externalUserId = payload.externalUserId || '';
    if (hasOwn(payload, 'customerName')) update.customerName = payload.customerName || '';
    if (hasOwn(payload, 'customerEmail')) update.customerEmail = payload.customerEmail || '';
    if (hasOwn(payload, 'customerPhone')) update.customerPhone = payload.customerPhone || '';
    if (hasOwn(payload, 'totalPrice')) update.totalPrice = Number(payload.totalPrice || 0);
    if (hasOwn(payload, 'totalItems')) update.totalItems = Number(payload.totalItems || 0);
    if (hasOwn(payload, 'status')) update.status = payload.status || 'Pending';
    if (hasOwn(payload, 'paymentStatus')) update.paymentStatus = payload.paymentStatus || 'Pending';
    if (hasOwn(payload, 'paymentMethod')) update.paymentMethod = payload.paymentMethod || '';
    if (hasOwn(payload, 'notes')) update.notes = payload.notes || '';
    if (hasOwn(payload, 'orderDate')) update.orderDate = toDate(payload.orderDate) || new Date();
    if (hasOwn(payload, 'items')) update.items = Array.isArray(payload.items) ? payload.items : [];
    if (hasOwn(payload, 'shippingAddress')) update.shippingAddress = payload.shippingAddress || {};

    const order = await WebsiteOrder.findOneAndUpdate(
      { _id: req.params.id, source: 'website' },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Website order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWebsiteOrder = async (req, res) => {
  try {
    const order = await WebsiteOrder.findOneAndDelete({ _id: req.params.id, source: 'website' });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Website order not found' });
    }
    return res.status(200).json({ success: true, message: 'Website order deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWebsiteBooking = async (req, res) => {
  try {
    const payload = req.body || {};
    const update = { lastSyncedAt: new Date() };

    if (hasOwn(payload, 'externalUserId')) update.externalUserId = payload.externalUserId || '';
    if (hasOwn(payload, 'serviceId')) update.serviceId = payload.serviceId || '';
    if (hasOwn(payload, 'serviceName')) update.serviceName = payload.serviceName || '';
    if (hasOwn(payload, 'servicePrice')) update.servicePrice = Number(payload.servicePrice || 0);
    if (hasOwn(payload, 'customerName')) update.customerName = payload.customerName || '';
    if (hasOwn(payload, 'email')) update.email = payload.email || '';
    if (hasOwn(payload, 'phoneNumber')) update.phoneNumber = payload.phoneNumber || '';
    if (hasOwn(payload, 'address')) update.address = payload.address || '';
    if (hasOwn(payload, 'preferredDate')) update.preferredDate = toDate(payload.preferredDate);
    if (hasOwn(payload, 'notes')) update.notes = payload.notes || '';

    const booking = await WebsiteBooking.findOneAndUpdate(
      { _id: req.params.id, source: 'website' },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Website booking not found' });
    }

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWebsiteBooking = async (req, res) => {
  try {
    const booking = await WebsiteBooking.findOneAndDelete({ _id: req.params.id, source: 'website' });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Website booking not found' });
    }
    return res.status(200).json({ success: true, message: 'Website booking deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWebsiteContact = async (req, res) => {
  try {
    const payload = req.body || {};
    const update = { lastSyncedAt: new Date() };

    if (hasOwn(payload, 'name')) update.name = payload.name || 'Website Contact';
    if (hasOwn(payload, 'email')) update.email = payload.email || '';
    if (hasOwn(payload, 'phoneNumber')) update.phoneNumber = payload.phoneNumber || '';
    if (hasOwn(payload, 'subject')) update.subject = payload.subject || '';
    if (hasOwn(payload, 'message')) update.message = payload.message || '';

    const contact = await WebsiteContact.findOneAndUpdate(
      { _id: req.params.id, source: 'website' },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Website contact not found' });
    }

    return res.status(200).json({ success: true, contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWebsiteContact = async (req, res) => {
  try {
    const contact = await WebsiteContact.findOneAndDelete({ _id: req.params.id, source: 'website' });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Website contact not found' });
    }
    return res.status(200).json({ success: true, message: 'Website contact deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
