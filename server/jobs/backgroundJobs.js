/**
 * Background Jobs for CRM Operations
 * Handles scheduled tasks like:
 * - Marking overdue follow-ups
 * - Sending reminders
 * - Cleanup operations
 */

const schedule = require('node-cron');
const FollowUp = require('../models/FollowUp');

/**
 * Mark overdue follow-ups (runs every hour)
 * OPTIMIZATION: Instead of running on every query, run this once per hour
 */
const markOverdueFollowUps = () => {
  // Schedule at minute 0 of every hour
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      const result = await FollowUp.updateMany(
        {
          status: 'scheduled',
          scheduledDate: { $lt: new Date() },
          isDeleted: false
        },
        { 
          status: 'overdue',
          updatedAt: new Date()
        }
      );

      console.log(`[FollowUp Job] Marked ${result.modifiedCount} follow-ups as overdue`);
    } catch (error) {
      console.error('[FollowUp Job] Error marking overdue follow-ups:', error.message);
    }
  });
};

/**
 * Send follow-up reminders (runs every 6 hours)
 * This is where you'd integrate with email/notification service
 */
const sendFollowUpReminders = () => {
  // Schedule at 00:00, 06:00, 12:00, 18:00
  schedule.scheduleJob('0 */6 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrow_end = new Date(tomorrow);
      tomorrow_end.setDate(tomorrow_end.getDate() + 1);

      const reminders = await FollowUp.find({
        status: { $in: ['scheduled', 'in-progress'] },
        scheduledDate: { $gte: tomorrow, $lt: tomorrow_end },
        reminderSent: false,
        isDeleted: false
      })
        .populate('client', 'firstName lastName email')
        .populate('assignedTo', 'email')
        .lean();

      if (reminders.length > 0) {
        // TODO: Send email notifications here
        // Example: sendReminderEmails(reminders)

        const reminderId = reminders.map(r => r._id);
        await FollowUp.updateMany(
          { _id: { $in: reminderId } },
          { reminderSent: true }
        );

        console.log(`[Reminder Job] Sent reminders for ${reminders.length} follow-ups`);
      }
    } catch (error) {
      console.error('[Reminder Job] Error sending reminders:', error.message);
    }
  });
};

/**
 * Cleanup deleted records (runs daily at 2 AM)
 * Permanently delete soft-deleted records after 90 days
 */
const cleanupDeletedRecords = () => {
  schedule.scheduleJob('0 2 * * *', async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await FollowUp.deleteMany({
        isDeleted: true,
        updatedAt: { $lt: ninetyDaysAgo }
      });

      console.log(`[Cleanup Job] Permanently deleted ${result.deletedCount} old records`);
    } catch (error) {
      console.error('[Cleanup Job] Error cleaning up records:', error.message);
    }
  });
};

/**
 * Initialize all background jobs
 */
const initializeBackgroundJobs = () => {
  console.log('[Background Jobs] Initializing scheduled tasks...');
  
  markOverdueFollowUps();
  sendFollowUpReminders();
  cleanupDeletedRecords();

  console.log('[Background Jobs] All jobs scheduled successfully');
};

module.exports = {
  initializeBackgroundJobs,
  markOverdueFollowUps,
  sendFollowUpReminders,
  cleanupDeletedRecords
};
