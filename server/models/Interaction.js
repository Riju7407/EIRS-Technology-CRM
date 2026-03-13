const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Logged by is required'],
    },
    type: {
      type: String,
      enum: ['query', 'complaint', 'feedback', 'call', 'email', 'meeting', 'note', 'other'],
      required: [true, 'Interaction type is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    channel: {
      type: String,
      enum: ['phone', 'email', 'in-person', 'video_call', 'whatsapp', 'portal', 'other'],
      default: 'phone',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed', 'escalated'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    resolution: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    followUp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FollowUp',
    },
    tags: [{ type: String }],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interaction', InteractionSchema);
