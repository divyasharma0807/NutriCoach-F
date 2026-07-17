/**
 * Session Seeding Module - Phase 3B
 * Responsibility: Generates and bulk inserts Coaching Sessions matching client activity profiles.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';
import Session from '../../models/Session.js';
import { ensureClientProfiles } from './helpers/progression.js';

/**
 * Seeds Session records based on the configuration preset.
 * Generates initial consultations, reviews, and upcoming events matching client engagement.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedSessions(config, context, options = {}) {
  const clientIds = context.clientIds || [];

  logger.info(`Starting Session seeding: totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping Session seeding.');
    context.sessionIds = [];
    return context;
  }

  // Ensure profiles are loaded
  const clientProfiles = ensureClientProfiles(context, config);

  const sessionsToInsert = [];
  const sessionIds = [];

  for (const clientId of clientIds) {
    const clientRecord = (context.clientsToInsert || []).find((c) => c._id.equals(clientId));
    if (!clientRecord) continue;

    const data = clientProfiles[clientId.toString()];
    if (!data) continue;

    const { profile, timeline } = data;
    const coachId = clientRecord.coach;
    const engagement = profile.engagementTier || 'Moderate';

    // 1. Initial Consultation (Always generated at the baseline week 0 check-in date)
    const baseline = timeline[0];
    const initialSessionId = new mongoose.Types.ObjectId();
    sessionIds.push(initialSessionId);
    sessionsToInsert.push({
      _id: initialSessionId,
      organizerId: coachId,
      organizerRole: 'coach',
      coachId: coachId,
      clientId: clientId,
      parentCoachId: null,
      participants: [coachId, clientId],
      date: baseline.date,
      time: '10:00',
      title: 'Initial Consultation',
      status: 'APPROVED',
      createdAt: new Date(baseline.date),
      updatedAt: new Date(baseline.date)
    });

    // Determine follow-up details based on activity levels
    if (engagement === 'High') {
      // 3 completed follow-up sessions spread out in the past
      for (let i = 1; i <= Math.min(3, timeline.length - 1); i++) {
        const entry = timeline[i];
        const sessionId = new mongoose.Types.ObjectId();
        sessionIds.push(sessionId);

        // Schedule session 2 days before check-in check
        const sessionDate = new Date(entry.date);
        sessionDate.setDate(sessionDate.getDate() - 2);

        sessionsToInsert.push({
          _id: sessionId,
          organizerId: coachId,
          organizerRole: 'coach',
          coachId: coachId,
          clientId: clientId,
          parentCoachId: null,
          participants: [coachId, clientId],
          date: sessionDate.toISOString().split('T')[0],
          time: '11:00',
          title: i === 3 ? 'Progress Review' : 'Weekly Follow-up',
          status: 'APPROVED',
          createdAt: sessionDate,
          updatedAt: sessionDate
        });
      }

      // 1 Upcoming Future Session (relative to today's date)
      const futureDate = new Date('2026-07-18');
      futureDate.setDate(futureDate.getDate() + 5);

      const futureSessionId = new mongoose.Types.ObjectId();
      sessionIds.push(futureSessionId);
      sessionsToInsert.push({
        _id: futureSessionId,
        organizerId: clientId,
        organizerRole: 'client',
        coachId: coachId,
        clientId: clientId,
        parentCoachId: null,
        participants: [coachId, clientId],
        date: futureDate.toISOString().split('T')[0],
        time: '16:00',
        title: 'Weekly Follow-up (Scheduled)',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });

    } else if (engagement === 'Moderate') {
      // 1 completed follow-up
      if (timeline.length > 2) {
        const midEntry = timeline[Math.floor(timeline.length / 2)];
        const sessionId = new mongoose.Types.ObjectId();
        sessionIds.push(sessionId);

        const sessionDate = new Date(midEntry.date);
        sessionDate.setDate(sessionDate.getDate() - 2);

        sessionsToInsert.push({
          _id: sessionId,
          organizerId: coachId,
          organizerRole: 'coach',
          coachId: coachId,
          clientId: clientId,
          parentCoachId: null,
          participants: [coachId, clientId],
          date: sessionDate.toISOString().split('T')[0],
          time: '14:30',
          title: 'Diet Review',
          status: 'APPROVED',
          createdAt: sessionDate,
          updatedAt: sessionDate
        });
      }

      // 1 Upcoming Future Session (relative to today's date)
      const futureDate = new Date('2026-07-18');
      futureDate.setDate(futureDate.getDate() + 7);

      const futureSessionId = new mongoose.Types.ObjectId();
      sessionIds.push(futureSessionId);
      sessionsToInsert.push({
        _id: futureSessionId,
        organizerId: coachId,
        organizerRole: 'coach',
        coachId: coachId,
        clientId: clientId,
        parentCoachId: null,
        participants: [coachId, clientId],
        date: futureDate.toISOString().split('T')[0],
        time: '10:00',
        title: 'Monthly Review (Scheduled)',
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date()
      });

    } else { // Low activity
      // 1 Rejected/Cancelled session in the past
      if (timeline.length > 1) {
        const entry = timeline[1];
        const cancelSessionId = new mongoose.Types.ObjectId();
        sessionIds.push(cancelSessionId);

        const sessionDate = new Date(entry.date);
        sessionDate.setDate(sessionDate.getDate() - 3);

        sessionsToInsert.push({
          _id: cancelSessionId,
          organizerId: clientId,
          organizerRole: 'client',
          coachId: coachId,
          clientId: clientId,
          parentCoachId: null,
          participants: [coachId, clientId],
          date: sessionDate.toISOString().split('T')[0],
          time: '17:00',
          title: 'Monthly Review (Cancelled)',
          status: 'REJECTED',
          createdAt: sessionDate,
          updatedAt: sessionDate
        });
      }
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${sessionsToInsert.length} Session(s) with bulk insert.`);
  } else {
    try {
      const result = await Session.insertMany(sessionsToInsert);
      logger.success(`Created ${result.length} Session(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert Sessions', err);
      throw err;
    }
  }

  context.sessionIds = sessionIds;
  context.sessionsToInsert = sessionsToInsert;

  return context;
}

export default seedSessions;
