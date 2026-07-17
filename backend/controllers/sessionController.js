import Session from '../models/Session.js';
import Client from '../models/Client.js';
import Coach from '../models/Coach.js';
import Notification from '../models/Notification.js';
import { isSessionInFuture, parseSessionDateTime } from '../utils/sessionHelper.js';

// Validate session date/time to prevent past bookings
const validateSessionDateTime = (dateStr, timeStr) => {
  // Expected dateStr: YYYY-MM-DD
  // Expected timeStr: HH:MM AM/PM
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;

  if (!dateRegex.test(dateStr) || !timeRegex.test(timeStr)) {
    return { valid: false, message: 'Invalid date or time format' };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Extract hours and minutes
  const timeParts = timeStr.trim().split(/\s+/);
  if (timeParts.length !== 2) {
    return { valid: false, message: 'Time must include AM/PM modifier' };
  }
  const [hoursMin, modifier] = timeParts;
  let [hours, minutes] = hoursMin.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return { valid: false, message: 'Invalid numbers in time' };
  }

  if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

  // Create date object in local system time
  const sessionDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const now = new Date();

  if (sessionDate.getTime() < now.getTime()) {
    return { valid: false, message: 'Session date and time cannot be in the past' };
  }

  return { valid: true };
};

// @desc    Schedule a session
// @route   POST /api/sessions/schedule
// @access  Private (Client/Coach)
export const scheduleSession = async (req, res, next) => {
  const { date, time, clientPhone, clientId, withParentCoach, targetCoachId } = req.body;
  const user = req.user;

  try {
    // Validate date and time
    const validation = validateSessionDateTime(date, time);
    if (!validation.valid) {
      res.status(400);
      throw new Error(validation.message);
    }

    if (user.role === 'client') {
      // Client schedules a session
      const client = await Client.findById(user._id);
      if (!client.coach) {
        res.status(400);
        throw new Error('You do not have a coach assigned. Cannot schedule session.');
      }

      const session = await Session.create({
        organizerId: user._id,
        organizerRole: 'client',
        coachId: client.coach,
        clientId: user._id,
        parentCoachId: null,
        participants: [user._id, client.coach],
        date,
        time,
        title: '1-on-1 Consultation',
        status: 'PENDING'
      });

      // Determine if coach is a Coach or Admin
      const coachExists = await Coach.exists({ _id: client.coach });
      const recipientTypeStr = coachExists ? 'coach' : 'admin';

      // Notify Coach/Admin
      await Notification.create({
        recipientType: recipientTypeStr,
        recipientId: client.coach,
        text: `Client ${client.name} requested a meeting on ${date} at ${time}.`,
        type: 'session_request',
        relatedMeetingId: session._id
      });

      // Notify Client that the request was sent
      await Notification.create({
        recipientType: 'client',
        recipientId: user._id,
        text: `Your meeting request has been sent to your coach for approval.`,
        type: 'info'
      });

      res.status(201).json({
        success: true,
        message: 'Session requested. Awaiting coach approval.',
        data: session
      });

    } else if (user.role === 'coach' || user.role === 'admin') {
      // Coach schedules a session
      if (withParentCoach) {
        const coach = await Coach.findById(user._id);
        if (!coach.seniorCoach) {
          res.status(400);
          throw new Error('You do not have a parent coach assigned.');
        }

        const session = await Session.create({
          organizerId: user._id,
          organizerRole: user.role,
          coachId: user._id,
          clientId: null,
          parentCoachId: coach.seniorCoach,
          participants: [user._id, coach.seniorCoach],
          date,
          time,
          title: 'Coach Session',
          status: 'PENDING'
        });

        // Determine if senior coach is a Coach or Admin
        const seniorCoachExists = await Coach.exists({ _id: coach.seniorCoach });
        const parentCoachRecipientType = seniorCoachExists ? 'coach' : 'admin';

        // Notify Parent Coach
        await Notification.create({
          recipientType: parentCoachRecipientType,
          recipientId: coach.seniorCoach,
          text: `Your sub-coach ${user.name} has requested a meeting on ${date} at ${time}.`,
          type: 'session_request',
          relatedMeetingId: session._id
        });

        // Notify Child Coach
        await Notification.create({
          recipientType: 'coach',
          recipientId: user._id,
          text: `Meeting request sent to your coach.`,
          type: 'info'
        });

        res.status(201).json({
          success: true,
          message: 'Meeting requested with parent coach successfully.',
          data: session
        });
      } else if (targetCoachId) {
        const targetCoach = await Coach.findById(targetCoachId);
        if (!targetCoach) {
          res.status(404);
          throw new Error('Target coach not found');
        }

        const session = await Session.create({
          organizerId: user._id,
          organizerRole: user.role,
          coachId: targetCoach._id,
          clientId: null,
          parentCoachId: user._id,
          participants: [user._id, targetCoach._id],
          date,
          time,
          title: 'Coach Session Request',
          status: 'PENDING'
        });

        await Notification.create({
          recipientType: 'coach',
          recipientId: targetCoach._id,
          text: `Your senior coach ${user.name} has requested a meeting on ${date} at ${time}.`,
          type: 'session_request',
          relatedMeetingId: session._id
        });

        await Notification.create({
          recipientType: user.role,
          recipientId: user._id,
          text: `Meeting request sent to sub-coach ${targetCoach.name}.`,
          type: 'info'
        });

        res.status(201).json({
          success: true,
          message: 'Meeting requested with sub-coach successfully.',
          data: session
        });
      } else {
        let targetClient;
        if (clientId) {
          targetClient = await Client.findById(clientId);
        } else if (clientPhone) {
          targetClient = await Client.findOne({ phone: clientPhone });
        }

        if (!targetClient) {
          res.status(404);
          throw new Error('Target client not found');
        }

        const session = await Session.create({
          organizerId: user._id,
          organizerRole: user.role,
          coachId: user._id,
          clientId: targetClient._id,
          parentCoachId: null,
          participants: [user._id, targetClient._id],
          date,
          time,
          title: 'Client Session',
          status: 'APPROVED'
        });

        // Notify Client
        await Notification.create({
          recipientType: 'client',
          recipientId: targetClient._id,
          text: `Your coach has scheduled a meeting on ${date} at ${time}.`,
          type: 'session_approved',
          relatedMeetingId: session._id
        });

        // Notify Coach/Admin
        await Notification.create({
          recipientType: user.role,
          recipientId: user._id,
          text: `Meeting scheduled successfully.`,
          type: 'session_approved',
          relatedMeetingId: session._id
        });

        res.status(201).json({
          success: true,
          message: 'Session scheduled successfully.',
          data: session
        });
      }
    } else {
      res.status(403);
      throw new Error('Only clients and coaches can schedule sessions');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a session
// @route   PUT /api/sessions/:id/approve
// @access  Private (Coach)
export const approveSession = async (req, res, next) => {
  const sessionId = req.params.id;

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (session.organizerId && session.organizerId.toString() === req.user._id.toString()) {
      res.status(403);
      throw new Error('You cannot approve a session request you organized');
    }

    const isCoach = session.coachId && session.coachId.toString() === req.user._id.toString();
    const isParentCoach = session.parentCoachId && session.parentCoachId.toString() === req.user._id.toString();

    if (!isCoach && !isParentCoach) {
      res.status(403);
      throw new Error('Not authorized to approve this session');
    }

    session.status = 'APPROVED';
    if (session.title === 'Client Session Request') {
      session.title = 'Client Session';
    } else if (session.title === 'Sub-Coach Session Request' || session.title === 'Coach Session Request') {
      session.title = 'Coach Session';
    }
    await session.save();

    // Delete the pending notification so it can't be processed twice
    await Notification.deleteMany({
      relatedMeetingId: session._id,
      type: 'session_request'
    });

    // Notify Requester
    const requesterType = session.organizerRole === 'coach' ? 'coach' : (session.organizerRole === 'admin' ? 'admin' : 'client');
    await Notification.create({
      recipientType: requesterType,
      recipientId: session.organizerId,
      text: `Your meeting request has been approved by ${req.user.name}.\n\nScheduled for ${session.date} at ${session.time}.`,
      type: 'session_approved',
      relatedMeetingId: session._id
    });

    // Notify Coach
    await Notification.create({
      recipientType: 'coach',
      recipientId: req.user._id,
      text: 'Meeting successfully confirmed.',
      type: 'info',
      relatedMeetingId: session._id
    });

    res.json({
      success: true,
      message: 'Session approved successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a session
// @route   PUT /api/sessions/:id/reject
// @access  Private (Coach)
export const rejectSession = async (req, res, next) => {
  const sessionId = req.params.id;

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (session.organizerId && session.organizerId.toString() === req.user._id.toString()) {
      res.status(403);
      throw new Error('You cannot reject a session request you organized');
    }

    const isCoach = session.coachId && session.coachId.toString() === req.user._id.toString();
    const isParentCoach = session.parentCoachId && session.parentCoachId.toString() === req.user._id.toString();

    if (!isCoach && !isParentCoach) {
      res.status(403);
      throw new Error('Not authorized to reject this session');
    }

    session.status = 'REJECTED';
    await session.save();

    // Delete the pending notification so it can't be processed twice
    await Notification.deleteMany({
      relatedMeetingId: session._id,
      type: 'session_request'
    });

    // Notify Requester
    const requesterType = session.organizerRole === 'coach' ? 'coach' : (session.organizerRole === 'admin' ? 'admin' : 'client');
    await Notification.create({
      recipientType: requesterType,
      recipientId: session.organizerId,
      text: `Your meeting request was rejected.`,
      type: 'session_rejected',
      relatedMeetingId: session._id
    });

    res.json({
      success: true,
      message: 'Session rejected successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions for logged in user (Client or Coach)
// @route   GET /api/sessions
// @access  Private (Client/Coach/Admin)
export const getSessions = async (req, res, next) => {
  const user = req.user;

  try {
    let sessions;
    if (user.role === 'client') {
      sessions = await Session.find({
        clientId: user._id,
        status: { $in: ['APPROVED', 'PENDING'] }
      }).populate('coachId', 'name email phone').sort({ date: 1, time: 1 });
    } else if (user.role === 'coach') {
      sessions = await Session.find({
        participants: { $in: [user._id] },
        status: { $in: ['APPROVED', 'PENDING'] }
      }).populate('clientId', 'name email phone').populate('coachId', 'name email phone').populate('parentCoachId', 'name email phone').sort({ date: 1, time: 1 });
    } else if (user.role === 'admin') {
      sessions = await Session.find({ coachId: user._id, status: 'APPROVED' }).populate('clientId coachId').sort({ date: 1, time: 1 });
    }

    // Filter out past sessions and sort chronologically
    sessions = sessions
      .filter(s => isSessionInFuture(s.date, s.time))
      .sort((a, b) => parseSessionDateTime(a.date, a.time) - parseSessionDateTime(b.date, b.time));

    const mappedSessions = sessions.map(s => {
      const sObj = s.toObject ? s.toObject() : s;
      return {
        ...sObj,
        id: s._id,
        isOrganizer: s.organizerId ? s.organizerId.toString() === user._id.toString() : false
      };
    });

    res.json({
      success: true,
      data: mappedSessions
    });
  } catch (error) {
    next(error);
  }
};
