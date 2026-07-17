import Coach from '../models/Coach.js';
import Client from '../models/Client.js';
import Session from '../models/Session.js';
import Referral from '../models/Referral.js';
import Notification from '../models/Notification.js';
import Result from '../models/Result.js';
import Admin from '../models/Admin.js';
import BodyParameterHistory from '../models/BodyParameterHistory.js';
import MeasurementHistory from '../models/MeasurementHistory.js';
import DietPlan from '../models/DietPlan.js';
import Prospect from '../models/Prospect.js';
import { deleteFromCloudinary } from '../services/cloudinaryService.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res, next) => {
  const { coachLevel, coachStatus } = req.query;

  try {
    const adminId = req.user._id;

    const coachesCount = await Coach.countDocuments({ seniorCoach: adminId });
    const clientsCount = await Client.countDocuments({ coach: adminId });
    const sessionsCount = await Session.countDocuments({ participants: { $in: [adminId] }, status: { $in: ['APPROVED', 'PENDING'] } });
    
    // Build coach query
    const coachQuery = { seniorCoach: adminId };
    if (coachLevel && coachLevel !== 'All') {
      coachQuery.level = coachLevel;
    }
    if (coachStatus && coachStatus !== 'All') {
      coachQuery.activeStatus = coachStatus;
    }

    const coaches = await Coach.find(coachQuery).populate('seniorCoach', 'name');
    const clients = await Client.find({ coach: adminId }).populate('coach', 'name');
    const sessions = await Session.find({ participants: { $in: [adminId] } }).populate('clientId').populate('coachId').populate('parentCoachId');
    
    // Referrals filtering by clients of adminId
    const clientIds = clients.map(c => c._id);
    const referrals = await Referral.find({ client: { $in: clientIds } }).populate('client', 'name');
    const referralsCount = await Referral.countDocuments({ client: { $in: clientIds } });

    // Get notifications
    const notifications = await Notification.find({ recipientType: 'admin' })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get admin-uploaded results
    const results = await Result.find({ coach: adminId });

    const dietPlan = await DietPlan.findOne({ coach: adminId, client: null });

    const coachesWithStats = await Promise.all(coaches.map(async (c) => {
      const coachClientsCount = await Client.countDocuments({ coach: c._id });
      const coachSessionsCount = await Session.countDocuments({ coachId: c._id });
      
      const coachProspectsCount = await Prospect.countDocuments({ addedByCoach: c._id });
      
      const coachResultsCount = await Result.countDocuments({ coach: c._id });

      return {
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        level: c.level,
        city: c.city,
        gender: c.gender,
        experience: c.experience,
        status: c.activeStatus ? c.activeStatus.toLowerCase() : 'active',
        activeStatus: c.activeStatus,
        seniorCoachName: c.seniorCoach ? c.seniorCoach.name : 'N/A',
        clientsCount: coachClientsCount,
        sessionsCount: coachSessionsCount,
        prospectsCount: coachProspectsCount,
        resultsCount: coachResultsCount
      };
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalCoaches: coachesCount,
          totalClients: clientsCount,
          totalSessions: sessionsCount,
          totalReferrals: referralsCount
        },
        dietPlan: dietPlan || { beginner: '', intermediate: '', advanced: '', weightLoss: '' },
        coaches: coachesWithStats,
        clients: clients.map(c => ({
          id: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          city: c.city,
          clientPlan: c.clientPlan,
          coachName: (c.coach && c.coach.name) ? c.coach.name : (c.coachName || 'N/A'),
          profileComplete: c.profileComplete,
          subscriptionStartDate: c.subscriptionStartDate,
          subscriptionExpiryDate: c.subscriptionExpiryDate
        })),
        sessions: sessions.map(s => ({
          id: s._id,
          clientName: s.clientId ? s.clientId.name : 'Unknown',
          coachName: s.coachId ? s.coachId.name : 'Unknown',
          date: s.date,
          time: s.time,
          status: s.status,
          type: !s.clientId ? 'coach' : 'client',
          participantName: s.clientId 
            ? s.clientId.name 
            : (s.coachId ? s.coachId.name : 'Unknown')
        })),
        referrals: referrals.map(r => ({
          id: r._id,
          name: r.name,
          phone: r.phone,
          email: r.email,
          city: r.city,
          age: r.age,
          gender: r.gender,
          weightRange: r.weightRange,
          interest: r.interest,
          clientName: r.client ? r.client.name : 'Unknown'
        })),
        results: results.map(r => ({
          id: r._id,
          clientName: r.clientName,
          description: r.description,
          image: r.image?.secure_url || r.image
        })),
        notifications: notifications.map(n => ({ id: n._id, text: n.text, read: n.read, type: n.type, relatedMeetingId: n.relatedMeetingId }))
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

// @desc    Update admin profile details
// @route   PUT /api/admin/profile
// @access  Private (Admin)
export const updateAdminProfile = async (req, res, next) => {
  const { name, phone, email, age, gender, city, experience, coachName } = req.body;
  const adminId = req.user._id;

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      res.status(404);
      throw new Error('Admin not found');
    }

    admin.name = name !== undefined ? name : admin.name;
    admin.phone = phone !== undefined ? phone : admin.phone;
    admin.email = email !== undefined ? email : admin.email;
    admin.age = age !== undefined ? age : admin.age;
    admin.gender = gender !== undefined ? gender : admin.gender;
    admin.city = city !== undefined ? city : admin.city;
    admin.experience = experience !== undefined ? experience : admin.experience;
    admin.coachName = coachName !== undefined ? coachName : admin.coachName;

    await admin.save();

    res.json({
      success: true,
      message: 'Admin profile updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        phone: admin.phone,
        email: admin.email,
        age: admin.age,
        gender: admin.gender,
        city: admin.city,
        experience: admin.experience,
        coachName: admin.coachName,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coach permanently
// @route   DELETE /api/admin/coaches/:id
// @access  Private (Admin)
export const deleteCoach = async (req, res, next) => {
  const coachId = req.params.id;

  try {
    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404);
      throw new Error('Coach not found');
    }

    // Delete associated coach
    await Coach.findByIdAndDelete(coachId);

    // Update Clients of this coach to clear reference
    await Client.updateMany({ coach: coachId }, { coach: null, coachName: '' });

    // Update Sub-coaches of this coach to clear reference
    await Coach.updateMany({ seniorCoach: coachId }, { seniorCoach: null });

    // Delete Sessions associated with coach
    await Session.deleteMany({ participants: { $in: [coachId] } });

    // Delete orphan records (Results, DietPlans, Prospects)
    // Note: To fully clean Cloudinary images we should technically fetch Results first, but for now we delete from DB.
    await Result.deleteMany({ coach: coachId });
    await DietPlan.deleteMany({ coach: coachId });
    await Prospect.deleteMany({ addedByCoach: coachId });

    res.json({
      success: true,
      message: 'Coach and all related records deleted permanently'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client permanently
// @route   DELETE /api/admin/clients/:id
// @access  Private (Admin)
export const deleteClient = async (req, res, next) => {
  const clientId = req.params.id;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    // Delete profile photo and medical PDF from Cloudinary if they exist
    if (client.profilePhoto && client.profilePhoto.public_id) {
      await deleteFromCloudinary(client.profilePhoto.public_id, 'image');
    }
    if (client.medicalPdf && client.medicalPdf.public_id) {
      await deleteFromCloudinary(client.medicalPdf.public_id, 'raw');
    }

    // Delete from Client model
    await Client.findByIdAndDelete(clientId);

    // Delete parameter and measurement histories
    await BodyParameterHistory.deleteMany({ client: clientId });
    await MeasurementHistory.deleteMany({ client: clientId });

    // Delete sessions
    await Session.deleteMany({ participants: { $in: [clientId] } });

    // Delete referrals
    await Referral.deleteMany({ client: clientId });

    res.json({
      success: true,
      message: 'Client and all related records deleted permanently'
    });
  } catch (error) {
    next(error);
  }
};
