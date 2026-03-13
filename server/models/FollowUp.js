const mongoose = require('mongoose');

const FOLLOW_UP_LABELS = [
  'Pending Response',
  'Payment Due',
  'Scheduled Call',
  'Market Follow-up',
  'Urgent',
  'New Lead',
  'Proposal Sent',
  'Negotiation',
  'Contract Review',
  'Onboarding',
  'General',
];

const FollowUpSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Scheduled by (admin/agent) is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Follow-up title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    label: {
      type: String,
      enum: FOLLOW_UP_LABELS,
      default: 'General',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'overdue', 'rescheduled'],
      default: 'scheduled',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    outcome: {
      type: String,
    },
    nextFollowUpDate: {
      type: Date,
    },
    channel: {
      type: String,
      enum: ['phone', 'email', 'in-person', 'video_call', 'whatsapp', 'other'],
      default: 'phone',
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

// Auto-mark overdue follow-ups
FollowUpSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

FollowUpSchema.statics.LABELS = FOLLOW_UP_LABELS;

module.exports = mongoose.model('FollowUp', FollowUpSchema);
