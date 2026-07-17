/**
 * Notification Seeding Module - Phase 3B
 * Responsibility: Generates and bulk inserts notifications triggered by actual operational and check-in events.
 */

import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import logger from './helpers/logger.js';
import Notification from '../../models/Notification.js';

/**
 * Seeds Notification records based on the configuration preset.
 * Maps notifications directly to events created in diet, session, and measurement seeders.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedNotifications(config, context, options = {}) {
  const clientIds = context.clientIds || [];

  logger.info(`Starting Notification seeding: totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping Notification seeding.');
    context.notificationIds = [];
    return context;
  }

  const notificationsToInsert = [];
  const notificationIds = [];

  const dietPlans = context.dietPlansToInsert || [];
  const sessions = context.sessionsToInsert || [];
  const measurements = context.measurementsToInsert || [];
  const clientRecords = context.clientsToInsert || [];

  // Helper to determine if notification should be marked read based on date (older than 3 days = likely read)
  const calculateReadStatus = (eventDate) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);
    const dateObj = new Date(eventDate);
    return dateObj < cutoff ? Math.random() > 0.15 : Math.random() > 0.7; // 85% read for old, 30% read for new
  };

  // 1. Notification Chain: Diet Plans Uploaded
  for (const plan of dietPlans) {
    const client = clientRecords.find((c) => c._id.equals(plan.client));
    if (!client) continue;

    const notificationId = new mongoose.Types.ObjectId();
    notificationIds.push(notificationId);

    const isRead = calculateReadStatus(plan.createdAt);

    notificationsToInsert.push({
      _id: notificationId,
      recipientType: 'client',
      recipientId: plan.client,
      text: `Your coach has uploaded a new diet target: ${plan.weightLoss.split('.')[0]}.`,
      read: isRead,
      type: 'diet_uploaded',
      relatedMeetingId: null,
      senderId: plan.coach,
      senderRole: 'coach',
      senderName: client.coachName || 'Coach',
      title: 'Diet Plan Updated',
      message: 'Please review the adjusted calorie and macro distributions in your beginner and intermediate nutrition menus.',
      priority: 'normal',
      entityType: 'DietPlan',
      entityId: plan._id,
      createdAt: plan.createdAt,
      updatedAt: plan.createdAt
    });
  }

  // 2. Notification Chain: Sessions
  for (const session of sessions) {
    const client = clientRecords.find((c) => c._id.equals(session.clientId));
    if (!client) continue;

    const isRead = calculateReadStatus(session.createdAt);

    if (session.status === 'APPROVED') {
      const notificationId = new mongoose.Types.ObjectId();
      notificationIds.push(notificationId);

      // Sent to Client confirming session
      notificationsToInsert.push({
        _id: notificationId,
        recipientType: 'client',
        recipientId: session.clientId,
        text: `Your coaching session "${session.title}" has been scheduled.`,
        read: isRead,
        type: 'session_approved',
        relatedMeetingId: session._id,
        senderId: session.coachId,
        senderRole: 'coach',
        senderName: client.coachName || 'Coach',
        title: 'Session Scheduled',
        message: `Your booking for ${session.title} on ${session.date} at ${session.time} is confirmed.`,
        priority: 'high',
        entityType: 'Session',
        entityId: session._id,
        createdAt: session.createdAt,
        updatedAt: session.createdAt
      });
    } else if (session.status === 'PENDING') {
      const notificationId = new mongoose.Types.ObjectId();
      notificationIds.push(notificationId);

      // Sent to Coach requesting session
      notificationsToInsert.push({
        _id: notificationId,
        recipientType: 'coach',
        recipientId: session.coachId,
        text: `Client ${client.name} has requested a session.`,
        read: isRead,
        type: 'session_request',
        relatedMeetingId: session._id,
        senderId: session.clientId,
        senderRole: 'client',
        senderName: client.name,
        title: 'New Session Request',
        message: `Request details: ${session.title} on ${session.date} at ${session.time}. Please approve or reject.`,
        priority: 'high',
        entityType: 'Session',
        entityId: session._id,
        createdAt: session.createdAt,
        updatedAt: session.createdAt
      });
    } else if (session.status === 'REJECTED') {
      const notificationId = new mongoose.Types.ObjectId();
      notificationIds.push(notificationId);

      // Sent to Client indicating cancellation
      notificationsToInsert.push({
        _id: notificationId,
        recipientType: 'client',
        recipientId: session.clientId,
        text: `Session "${session.title}" has been cancelled.`,
        read: isRead,
        type: 'session_request', // fits standard enums
        relatedMeetingId: session._id,
        senderId: session.coachId,
        senderRole: 'coach',
        senderName: client.coachName || 'Coach',
        title: 'Coaching Session Cancelled',
        message: `The scheduled meeting on ${session.date} has been cancelled: ${session.title}`,
        priority: 'normal',
        entityType: 'Session',
        entityId: session._id,
        createdAt: session.createdAt,
        updatedAt: session.createdAt
      });
    }
  }

  // 3. Notification Chain: Weekly Check-ins / Milestones
  for (const record of measurements) {
    if (record.isProfileBaseline) continue; // skip initial profile set

    const client = clientRecords.find((c) => c._id.equals(record.client));
    if (!client) continue;

    const notificationId = new mongoose.Types.ObjectId();
    notificationIds.push(notificationId);

    const checkinDate = new Date(record.date);
    const isRead = calculateReadStatus(checkinDate);

    // Notify Coach that client logged measurements
    notificationsToInsert.push({
      _id: notificationId,
      recipientType: 'coach',
      recipientId: client.coach,
      text: `${client.name} has logged weekly body size measurements.`,
      read: isRead,
      type: 'weekly_reminder',
      relatedMeetingId: null,
      senderId: client._id,
      senderRole: 'client',
      senderName: client.name,
      title: 'Weekly Measurements Logged',
      message: `Progress check-in submitted for date ${record.date}. Waist size is now ${record.waist} cm.`,
      priority: 'normal',
      entityType: 'MeasurementHistory',
      entityId: record._id,
      createdAt: checkinDate,
      updatedAt: checkinDate
    });
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${notificationsToInsert.length} Notification(s) with bulk insert.`);
  } else {
    try {
      const result = await Notification.insertMany(notificationsToInsert);
      logger.success(`Created ${result.length} Notification(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert Notifications', err);
      throw err;
    }
  }

  context.notificationIds = notificationIds;
  context.notificationsToInsert = notificationsToInsert;

  return context;
}

export default seedNotifications;
