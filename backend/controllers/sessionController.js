import Session from '../models/Session.js';
import Client from '../models/Client.js';
import Coach from '../models/Coach.js';
import Notification from '../models/Notification.js';

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
  const { date, time, clientPhone, clientId } = req.body;
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
        client: user._id,
        coach: client.coach,
        date,
        time,
        status: 'pending_approval',
        scheduledBy: 'client'
      });

      // Notify Coach
      await Notification.create({
        recipientType: 'coach',
        recipientId: client.coach,
        text: `Client ${client.name} requested a session for ${date} at ${time}.`,
        type: 'session_request'
      });

      res.status(201).json({
        success: true,
        message: 'Session requested. Awaiting coach approval.',
        data: session
      });

    } else if (user.role === 'coach') {
      // Coach schedules a session
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
        client: targetClient._id,
        coach: user._id,
        date,
        time,
        status: 'approved',
        scheduledBy: 'coach'
      });

      // Notify Client
      await Notification.create({
        recipientType: 'client',
        recipientId: targetClient._id,
        text: `Your coach ${user.name} scheduled a new session on ${date} at ${time}.`,
        type: 'session_approved'
      });

      // Notify Admin
      await Notification.create({
        recipientType: 'admin',
        text: `Coach ${user.name} scheduled a session for client ${targetClient.name}.`,
        type: 'new_session'
      });

      res.status(201).json({
        success: true,
        message: 'Session scheduled successfully.',
        data: session
      });
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
    const session = await Session.findById(sessionId).populate('client coach');
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (session.coach._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to approve this session');
    }

    session.status = 'approved';
    await session.save();

    // Notify Client
    await Notification.create({
      recipientType: 'client',
      recipientId: session.client._id,
      text: `Your coach ${session.coach.name} approved your session request for ${session.date} at ${session.time}.`,
      type: 'session_approved'
    });

    // Notify Admin
    await Notification.create({
      recipientType: 'admin',
      text: `Session approved between Coach ${session.coach.name} and Client ${session.client.name}.`,
      type: 'session_approved'
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
    const session = await Session.findById(sessionId).populate('client coach');
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (session.coach._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to reject this session');
    }

    session.status = 'rejected';
    await session.save();

    // Notify Client
    await Notification.create({
      recipientType: 'client',
      recipientId: session.client._id,
      text: `Your coach ${session.coach.name} rejected your session request for ${session.date} at ${session.time}.`,
      type: 'session_rejected'
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
      // Client only sees approved sessions as per "After approval: Session becomes visible to both portals"
      // Wait, let's also allow seeing pending ones if they requested them so they know it is pending,
      // but let's strictly follow the instruction: "After approval: Session becomes visible to both portals"
      // Let's return approved sessions for client.
      sessions = await Session.find({
        client: user._id,
        status: 'approved'
      }).populate('coach', 'name email phone').sort({ date: 1, time: 1 });
    } else if (user.role === 'coach') {
      // Coach sees all sessions (pending and approved) involving them
      sessions = await Session.find({
        coach: user._id
      }).populate('client', 'name email phone').sort({ date: 1, time: 1 });
    } else if (user.role === 'admin') {
      sessions = await Session.find({}).populate('client coach').sort({ date: 1, time: 1 });
    }

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};
