const mongoose = require('mongoose');

const PurchaseHistorySchema = new mongoose.Schema({
  product: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  invoiceNumber: { type: String },
  status: {
    type: String,
    enum: ['completed', 'pending', 'refunded', 'cancelled'],
    default: 'completed',
  },
  notes: { type: String },
});

const ServiceInteractionSchema = new mongoose.Schema({
  service: { type: String, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
});

const ClientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    alternatePhone: { type: String },
    company: { type: String, trim: true },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'India' },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'lead', 'prospect', 'churned'],
      default: 'lead',
    },
    source: {
      type: String,
      enum: ['referral', 'website', 'social_media', 'cold_call', 'market', 'other'],
      default: 'other',
    },
    tags: [{ type: String }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    purchaseHistory: [PurchaseHistorySchema],
    serviceInteractions: [ServiceInteractionSchema],
    totalPurchaseValue: {
      type: Number,
      default: 0,
    },
    notes: { type: String },
    profilePicture: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual: Full Name
ClientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Auto-calculate total purchase value before save
ClientSchema.pre('save', function (next) {
  if (this.purchaseHistory && this.purchaseHistory.length > 0) {
    this.totalPurchaseValue = this.purchaseHistory.reduce(
      (sum, purchase) => sum + (purchase.amount || 0),
      0
    );
  }
  next();
});

ClientSchema.set('toJSON', { virtuals: true });
ClientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', ClientSchema);
