/**
 * Optimized Client Model with proper indexing
 */

const mongoose = require('mongoose');

const PurchaseHistorySchema = new mongoose.Schema({
  product: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now, index: true },
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
  date: { type: Date, default: Date.now, index: true },
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
      index: true, // Added index for search
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      index: true, // Added index for search
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      index: true, // Already unique but add for queries
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      index: true, // Added index for search
    },
    alternatePhone: { type: String },
    company: {
      type: String,
      trim: true,
      index: true, // Added index for search
    },
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
      index: true, // Added for filtering
    },
    source: {
      type: String,
      enum: ['referral', 'website', 'social_media', 'cold_call', 'market', 'other'],
      default: 'other',
      index: true, // Added for filtering
    },
    tags: [{ type: String }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true, // Added for filtering
    },
    purchaseHistory: [PurchaseHistorySchema],
    serviceInteractions: [ServiceInteractionSchema],
    totalPurchaseValue: {
      type: Number,
      default: 0,
      index: true, // Added for sorting/filtering
    },
    notes: { type: String },
    profilePicture: { type: String },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // Added for soft delete queries
    },
  },
  { timestamps: true }
);

// Virtual: Full Name
ClientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// OPTIMIZATION: Compound indexes for common query patterns
ClientSchema.index({ status: 1, isDeleted: 1, createdAt: -1 }); // Stats queries
ClientSchema.index({ firstName: 1, lastName: 1, isDeleted: 1 }); // Name search
ClientSchema.index({ email: 1, isDeleted: 1 }); // Email lookup
ClientSchema.index({ phone: 1, isDeleted: 1 }); // Phone lookup
ClientSchema.index({ assignedTo: 1, isDeleted: 1 }); // Assignment queries
ClientSchema.index({ createdAt: -1, isDeleted: 1 }); // Recent clients
ClientSchema.index({ totalPurchaseValue: -1, isDeleted: 1 }); // Top spenders

// Text index for full-text search (requires MongoDB text search)
ClientSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  phone: 'text',
  company: 'text'
});

// Auto-calculate total purchase value before save
ClientSchema.pre('save', function (next) {
  if (this.purchaseHistory && this.purchaseHistory.length > 0) {
    this.totalPurchaseValue = this.purchaseHistory.reduce(
      (sum, purchase) => sum + (purchase.amount || 0),
      0
    );
  } else {
    this.totalPurchaseValue = 0;
  }
  next();
});

// OPTIMIZATION: Remove automatic isDeleted filter from pre-find hooks
// Instead handle it explicitly in queries for better control
// This improves performance as Mongoose doesn't add overhead to every query

module.exports = mongoose.model('Client', ClientSchema);
