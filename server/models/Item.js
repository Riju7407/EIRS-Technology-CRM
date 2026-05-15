const mongoose = require('mongoose');

const partyWisePriceSchema = new mongoose.Schema(
  {
    partyName: { type: String, trim: true },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const customFieldSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    value: { type: String, trim: true },
  },
  { _id: false }
);

const ItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['product', 'service'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    pricingBasis: { type: String, trim: true, default: '' },
    pricingMode: {
      type: String,
      enum: ['with_tax', 'without_tax'],
      default: 'without_tax',
    },
    salesPrice: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    gstTaxRate: { type: Number, default: 0 },
    discountOnSalesPrice: { type: Number, default: 0 },
    wholesaleRate: { type: Number, default: 0 },
    measuringUnit: { type: String, trim: true },
    serviceCode: { type: String, trim: true },
    itemCode: { type: String, trim: true },
    hsnCode: { type: String, trim: true },
    openingStock: { type: Number, default: 0 },
    asOfDate: { type: Date },
    description: { type: String, trim: true },
    godown: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown' },
    partyWisePrices: { type: [partyWisePriceSchema], default: [] },
    customFields: { type: [customFieldSchema], default: [] },
    remarks: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ItemSchema.index({ name: 'text', category: 'text', itemCode: 'text', hsnCode: 'text', serviceCode: 'text' });

module.exports = mongoose.model('Item', ItemSchema);