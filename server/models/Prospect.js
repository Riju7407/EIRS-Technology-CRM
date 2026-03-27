const mongoose = require('mongoose');

const ProspectSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: { type: String, required: [true, 'Phone number is required'] },
    company: { type: String, trim: true },
    stage: {
      type: String,
      enum: ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'new',
    },
    source: {
      type: String,
      enum: ['referral', 'website', 'social_media', 'cold_call', 'market', 'other'],
      default: 'other',
    },
    estimatedValue: { type: Number, default: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProspectSchema.index({ firstName: 'text', lastName: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Prospect', ProspectSchema);
