const mongoose = require('mongoose');

const websiteUserSchema = new mongoose.Schema(
  {
    externalUserId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phoneNumber: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    isAdmin: { type: Boolean, default: false },
    source: { type: String, default: 'website', index: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

websiteUserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WebsiteUser', websiteUserSchema);
