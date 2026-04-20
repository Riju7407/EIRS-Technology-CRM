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

exports.upsertWebsiteUser = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.externalUserId) {
      return res.status(400).json({ success: false, message: 'externalUserId is required' });
    }

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
      { externalUserId: String(payload.externalUserId) },
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
    if (!payload.externalOrderId) {
      return res.status(400).json({ success: false, message: 'externalOrderId is required' });
    }

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
      { externalOrderId: String(payload.externalOrderId) },
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
    if (!payload.externalBookingId) {
      return res.status(400).json({ success: false, message: 'externalBookingId is required' });
    }

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
      { externalBookingId: String(payload.externalBookingId) },
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
    if (!payload.externalContactId) {
      return res.status(400).json({ success: false, message: 'externalContactId is required' });
    }

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
      { externalContactId: String(payload.externalContactId) },
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
