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
