const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, required: true, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    clientName: String,
    clientPhone: String,
    clientAddress: String,
    items: [
      {
        description: String,
        quantity: Number,
        rate: Number,
      },
    ],
    discount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 18 },
    notes: String,
    subtotal: Number,
    taxAmount: Number,
    total: Number,
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' },
    pdfData: mongoose.Schema.Types.Mixed, // Store the PDF generation data
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from creation
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quotation', quotationSchema);
