const mongoose = require('mongoose');

// Read/write the original website collections directly.
const WebsiteUser =
  mongoose.models.WebsiteSourceUser ||
  mongoose.model('WebsiteSourceUser', new mongoose.Schema({}, { strict: false, collection: 'users' }));

const WebsiteOrder =
  mongoose.models.WebsiteSourceOrder ||
  mongoose.model('WebsiteSourceOrder', new mongoose.Schema({}, { strict: false, collection: 'orders' }));

const WebsiteBooking =
  mongoose.models.WebsiteSourceBooking ||
  mongoose.model('WebsiteSourceBooking', new mongoose.Schema({}, { strict: false, collection: 'servicebookings' }));

const WebsiteContact =
  mongoose.models.WebsiteSourceContact ||
  mongoose.model('WebsiteSourceContact', new mongoose.Schema({}, { strict: false, collection: 'contacts' }));

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

const generateExternalId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const websiteUserFilter = () => ({
  $or: [{ isAdmin: false }, { isAdmin: { $exists: false } }],
});

const userProjection = {
  password: 0,
  otp: 0,
  otpExpiry: 0,
  otpPurpose: 0,
  resetPasswordToken: 0,
  resetPasswordExpiry: 0,
};

exports.upsertWebsiteUser = async (req, res) => {
  try {
    const payload = req.body || {};
    const createdUser = await WebsiteUser.create({
      name: payload.name || 'Website User',
      email: String(payload.email || '').toLowerCase().trim(),
      phoneNumber: payload.phoneNumber || '',
      address: payload.address || '',
      city: payload.city || '',
      state: payload.state || '',
      pincode: payload.pincode || '',
      isAdmin: false,
      password: payload.password || 'ChangeMe@123',
    });

    const user = await WebsiteUser.findById(createdUser._id, userProjection);

    return res.status(201).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertWebsiteOrder = async (req, res) => {
  try {
    const payload = req.body || {};
    let userId = payload.userId;
    if (!userId) {
      const fallbackUser = await WebsiteUser.findOne(websiteUserFilter()).sort({ createdAt: 1 });
      if (!fallbackUser) {
        return res.status(400).json({ success: false, message: 'No website users found. Create a website user first.' });
      }
      userId = fallbackUser._id;
    }

    const totalPrice = Number(payload.totalPrice || 0);
    const totalItems = Number(payload.totalItems || 1);
    const itemQuantity = Math.max(totalItems, 1);
    const unitPrice = itemQuantity > 0 ? totalPrice / itemQuantity : totalPrice;

    const order = await WebsiteOrder.create({
      userId,
      items: Array.isArray(payload.items) && payload.items.length > 0
        ? payload.items
        : [
            {
              productId: new mongoose.Types.ObjectId(),
              productName: 'Manual CRM Entry',
              price: Number.isFinite(unitPrice) ? unitPrice : 0,
              quantity: itemQuantity,
            },
          ],
      totalPrice,
      totalItems,
      status: payload.status || 'Pending',
      paymentStatus: payload.paymentStatus || 'Pending',
      paymentMethod: payload.paymentMethod || 'CashOnDelivery',
      notes: payload.notes || '',
      customerEmail: payload.customerEmail || '',
      customerPhone: payload.customerPhone || '',
      orderDate: toDate(payload.orderDate) || new Date(),
      shippingAddress: {
        fullName: payload.customerName || 'Website Customer',
        email: payload.customerEmail || '',
        phone: payload.customerPhone || '',
      },
    });

    return res.status(201).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertWebsiteBooking = async (req, res) => {
  try {
    const payload = req.body || {};
    let userId = payload.userId;
    if (!userId) {
      const fallbackUser = await WebsiteUser.findOne(websiteUserFilter()).sort({ createdAt: 1 });
      if (!fallbackUser) {
        return res.status(400).json({ success: false, message: 'No website users found. Create a website user first.' });
      }
      userId = fallbackUser._id;
    }

    const booking = await WebsiteBooking.create({
      userId,
      serviceId: payload.serviceId || new mongoose.Types.ObjectId(),
      serviceName: payload.serviceName || 'Website Service',
      servicePrice: Number(payload.servicePrice || 0),
      customerName: payload.customerName || 'Website Customer',
      phoneNumber: payload.phoneNumber || '',
      email: payload.email || '',
      address: payload.address || '',
      preferredDate: toDate(payload.preferredDate),
      notes: payload.notes || '',
      status: payload.status || 'Pending',
    });

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertWebsiteContact = async (req, res) => {
  try {
    const payload = req.body || {};
    const contact = await WebsiteContact.create({
      name: payload.name || 'Website Contact',
      email: payload.email || '',
      phoneNumber: payload.phoneNumber || '',
      subject: payload.subject || '',
      message: payload.message || '',
    });

    return res.status(201).json({ success: true, contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWebsiteUsers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = websiteUserFilter();
    const searchFilter = buildSearch(req.query.search, ['name', 'email', 'phoneNumber', 'address']);
    if (searchFilter) {
      filter.$and = [searchFilter];
    }

    const [total, users] = await Promise.all([
      WebsiteUser.countDocuments(filter),
      WebsiteUser.find(filter, userProjection).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const searchFilter = buildSearch(req.query.search, [
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
    const filter = {};
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
    const filter = {};
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
      WebsiteUser.countDocuments(websiteUserFilter()),
      WebsiteOrder.countDocuments({}),
      WebsiteBooking.countDocuments({}),
      WebsiteContact.countDocuments({}),
      WebsiteOrder.aggregate([
        { $match: {} },
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

    await WebsiteUser.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    const user = await WebsiteUser.findById(req.params.id, userProjection);

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
    const user = await WebsiteUser.findOneAndDelete({ _id: req.params.id });
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
      { _id: req.params.id },
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
    const order = await WebsiteOrder.findOneAndDelete({ _id: req.params.id });
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
      { _id: req.params.id },
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
    const booking = await WebsiteBooking.findOneAndDelete({ _id: req.params.id });
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
    const update = {};

    if (hasOwn(payload, 'name')) update.name = payload.name || 'Website Contact';
    if (hasOwn(payload, 'email')) update.email = payload.email || '';
    if (hasOwn(payload, 'phoneNumber')) update.phoneNumber = payload.phoneNumber || '';
    if (hasOwn(payload, 'subject')) update.subject = payload.subject || '';
    if (hasOwn(payload, 'message')) update.message = payload.message || '';

    const contact = await WebsiteContact.findOneAndUpdate(
      { _id: req.params.id },
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
    const contact = await WebsiteContact.findOneAndDelete({ _id: req.params.id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Website contact not found' });
    }
    return res.status(200).json({ success: true, message: 'Website contact deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
