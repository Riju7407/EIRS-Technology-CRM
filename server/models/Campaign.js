const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    campaignId: { type: String, required: [true, 'Campaign ID is required'], unique: true, trim: true },
    name: { type: String, required: [true, 'Campaign name is required'], trim: true },
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'facebook', 'instagram', 'linkedin', 'field-outreach', 'social-media', 'sms', 'other'],
      default: 'other',
    },
    reach: { type: Number, default: 0, min: 0 },
    budget: { type: Number, default: 0, min: 0 },
    roi: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['planned', 'active', 'paused', 'completed'],
      default: 'planned',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CampaignSchema.index({ campaignId: 'text', name: 'text', channel: 'text' });

module.exports = mongoose.model('Campaign', CampaignSchema);
