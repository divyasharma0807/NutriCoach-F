import Coach from '../models/Coach.js';
import Client from '../models/Client.js';
import Session from '../models/Session.js';
import Referral from '../models/Referral.js';
import Notification from '../models/Notification.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res, next) => {
  const { coachLevel, coachStatus } = req.query;

  try {
    const coachesCount = await Coach.countDocuments();
    const clientsCount = await Client.countDocuments();
    const sessionsCount = await Session.countDocuments({ status: 'approved' });
    const referralsCount = await Referral.countDocuments();

    // Build coach query
    const coachQuery = {};
    if (coachLevel && coachLevel !== 'All') {
      coachQuery.level = coachLevel;
    }
    if (coachStatus && coachStatus !== 'All') {
      coachQuery.activeStatus = coachStatus;
    }

    const coaches = await Coach.find(coachQuery).populate('seniorCoach', 'name');
    const clients = await Client.find({}).populate('coach', 'name');
    const sessions = await Session.find({}).populate('client coach');
    const referrals = await Referral.find({}).populate('client', 'name');

    // Get notifications
    const notifications = await Notification.find({ recipientType: 'admin' })
      .sort({ createdAt: -1 })
      .limit(10);


    res.json({
      success: true,
      data: {
        stats: {
          totalCoaches: coachesCount,
          totalClients: clientsCount,
          totalSessions: sessionsCount,
          totalReferrals: referralsCount
        },
        coaches: coaches.map(c => ({
          id: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          level: c.level,
          activeStatus: c.activeStatus,
          seniorCoachName: c.seniorCoach ? c.seniorCoach.name : 'N/A'
        })),
        clients: clients.map(c => ({
          id: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          city: c.city,
          clientPlan: c.clientPlan,
          coachName: c.coach ? c.coach.name : 'N/A',
          profileComplete: c.profileComplete
        })),
        sessions: sessions.map(s => ({
          id: s._id,
          clientName: s.client ? s.client.name : 'Unknown',
          coachName: s.coach ? s.coach.name : 'Unknown',
          date: s.date,
          time: s.time,
          status: s.status
        })),
        referrals: referrals.map(r => ({
          id: r._id,
          name: r.name,
          phone: r.phone,
          email: r.email,
          city: r.city,
          clientName: r.client ? r.client.name : 'Unknown'
        })),
        notifications: notifications.map(n => ({ id: n._id, text: n.text, read: n.read }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coach level
// @route   PUT /api/admin/coaches/:id/level
// @access  Private (Admin)
export const updateCoachLevel = async (req, res, next) => {
  const { level } = req.body;
  const coachId = req.params.id;

  try {
    if (!level || !['Senior Coach', 'Coach'].includes(level)) {
      res.status(400);
      throw new Error('Invalid coach level specified');
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404);
      throw new Error('Coach not found');
    }

    coach.level = level;
    await coach.save();

    res.json({
      success: true,
      message: `Coach level updated to ${level}`,
      data: coach
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coach active status
// @route   PUT /api/admin/coaches/:id/status
// @access  Private (Admin)
export const updateCoachStatus = async (req, res, next) => {
  const { status } = req.body; // 'Active' or 'Inactive'
  const coachId = req.params.id;

  try {
    if (!status || !['Active', 'Inactive'].includes(status)) {
      res.status(400);
      throw new Error('Invalid active status specified');
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404);
      throw new Error('Coach not found');
    }

    coach.activeStatus = status;
    await coach.save();

    res.json({
      success: true,
      message: `Coach status updated to ${status}`,
      data: coach
    });
  } catch (error) {
    next(error);
  }
};
