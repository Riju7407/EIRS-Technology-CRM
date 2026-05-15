const mongoose = require('mongoose');

const GodownSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    streetAddress: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    city: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

GodownSchema.index({ name: 'text', city: 'text', state: 'text' });

module.exports = mongoose.model('Godown', GodownSchema);