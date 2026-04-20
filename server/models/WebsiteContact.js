const mongoose = require('mongoose');

const websiteContactSchema = new mongoose.Schema(
  {
    externalContactId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true, index: true },
    phoneNumber: { type: String, default: '', trim: true },
    subject: { type: String, default: '', trim: true },
    message: { type: String, default: '' },
    source: { type: String, default: 'website', index: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

websiteContactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WebsiteContact', websiteContactSchema);
