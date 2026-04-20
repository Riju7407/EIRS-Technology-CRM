const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: '' },
    productName: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    houseNo: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    zipCode: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const websiteOrderSchema = new mongoose.Schema(
  {
    externalOrderId: { type: String, required: true, unique: true, index: true },
    externalUserId: { type: String, default: '', index: true },
    customerName: { type: String, default: '', trim: true },
    customerEmail: { type: String, default: '', trim: true, lowercase: true, index: true },
    customerPhone: { type: String, default: '', trim: true },
    totalPrice: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    status: { type: String, default: 'Pending', trim: true, index: true },
    paymentStatus: { type: String, default: 'Pending', trim: true },
    paymentMethod: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    orderDate: { type: Date, default: Date.now, index: true },
    items: { type: [orderItemSchema], default: [] },
    shippingAddress: { type: shippingSchema, default: () => ({}) },
    source: { type: String, default: 'website', index: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

websiteOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WebsiteOrder', websiteOrderSchema);
