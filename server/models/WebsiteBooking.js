const mongoose = require('mongoose');

const websiteBookingSchema = new mongoose.Schema(
  {
    externalBookingId: { type: String, required: true, unique: true, index: true },
    externalUserId: { type: String, default: '', index: true },
    serviceId: { type: String, default: '' },
    serviceName: { type: String, default: '', trim: true, index: true },
    servicePrice: { type: Number, default: 0 },
    customerName: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true, index: true },
    phoneNumber: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    preferredDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    source: { type: String, default: 'website', index: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

websiteBookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WebsiteBooking', websiteBookingSchema);
