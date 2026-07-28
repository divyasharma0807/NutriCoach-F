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
import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import { deleteFromCloudinary } from '../services/cloudinaryService.js';
import { isSessionInFuture, parseSessionDateTime } from '../utils/sessionHelper.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res, next) => {
  const { coachLevel, coachStatus } = req.query;

  try {
    const adminId = req.user._id;

    // Build coach query
    const coachQuery = { seniorCoach: adminId };
    if (coachLevel && coachLevel !== 'All') {
      coachQuery.level = coachLevel;
    }
    if (coachStatus && coachStatus !== 'All') {
      coachQuery.activeStatus = coachStatus;
    }

    // Execute independent queries in parallel using lean() where appropriate (Batch 1)
    const [
      coachesCount,
      clientsCount,
      sessionsCount,
      coaches,
      clients,
      rawSessions,
      notifications,
      results,
      dietPlan,
      prospects
    ] = await Promise.all([
      Coach.countDocuments({ seniorCoach: adminId }),
      Client.countDocuments({ coach: adminId }),
      Session.countDocuments({ participants: { $in: [adminId] }, status: { $in: ['APPROVED', 'PENDING'] } }),
      Coach.find(coachQuery).populate('seniorCoach', 'name').lean(),
      Client.find({ coach: adminId }).populate('coach', 'name').lean(),
      Session.find({ participants: { $in: [adminId] } }).populate('clientId').populate('coachId').populate('parentCoachId').lean(),
      Notification.find({ recipientType: 'admin' }).sort({ createdAt: -1 }).limit(10).lean(),
      Result.find({ coach: adminId }).lean(),
      DietPlan.findOne({ coach: adminId, client: null }).lean(),
      Prospect.find({ addedByCoach: adminId }).lean()
    ]);

    // Launch dependent queries and nested coach stats calculations concurrently (Batch 2)
    const clientIds = clients.map(c => c._id);

    const [referrals, coachesWithStats] = await Promise.all([
      Referral.find({ client: { $in: clientIds } }).populate('client', 'name').lean(),
      Promise.all(coaches.map(async (c) => {
        const [coachClientsCount, coachSessionsCount, coachProspectsCount, coachSubCoachesCount] = await Promise.all([
          Client.countDocuments({ coach: c._id }),
          Session.countDocuments({ 
            $or: [{ coachId: c._id }, { parentCoachId: c._id }],
            status: { $in: ['APPROVED', 'PENDING'] }
          }),
          Prospect.countDocuments({ addedByCoach: c._id }),
          Coach.countDocuments({ seniorCoach: c._id })
        ]);
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
          coachesCount: coachSubCoachesCount
        };
      }))
    ]);

    const referralsCount = referrals.length; // Redundant query eliminated

    const sessions = rawSessions
      .filter(s => isSessionInFuture(s.date, s.time))
      .sort((a, b) => parseSessionDateTime(a.date, a.time) - parseSessionDateTime(b.date, b.time));

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
            : (s.coachId ? s.coachId.name : 'Unknown'),
          organizerId: s.organizerId,
          isOrganizer: s.organizerId ? s.organizerId.toString() === adminId.toString() : false
        })),
        prospects,
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

// @desc    Get paginated, filtered admin transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin only)
export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, search, status, paymentMethod, dateRange, startDate, endDate, sortBy } = req.query;
    const limitNum = 15;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const transactionQuery = {};

    // 1. Search filter: Coach Name, Coach Email, Coach Phone
    if (search) {
      const matchingCoaches = await Coach.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const coachIds = matchingCoaches.map(c => c._id);

      transactionQuery.$or = [
        { coachId: { $in: coachIds } },
        { 'coachSnapshot.name': { $regex: search, $options: 'i' } },
        { 'coachSnapshot.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Status filter
    if (status && status !== 'All') {
      transactionQuery.status = status.toUpperCase();
    }

    // 3. Payment Method filter
    if (paymentMethod && paymentMethod !== 'All') {
      transactionQuery.paymentMethod = paymentMethod.toUpperCase();
    }

    // 4. Date Range filter
    if (dateRange && dateRange !== 'All') {
      const now = new Date();
      let start;
      if (dateRange === 'Today') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
      } else if (dateRange === 'Last 7 Days') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'Last 30 Days') {
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'Custom' && startDate && endDate) {
        start = new Date(startDate);
        const end = new Date(endDate);
        transactionQuery.createdAt = { $gte: start, $lte: end };
      }
      if (start && dateRange !== 'Custom') {
        transactionQuery.createdAt = { $gte: start };
      }
    }

    // 5. Sorting
    let sortOption = { createdAt: -1 };
    if (sortBy === 'Newest First') sortOption = { createdAt: -1 };
    else if (sortBy === 'Oldest First') sortOption = { createdAt: 1 };
    else if (sortBy === 'Highest Amount') sortOption = { amount: -1 };
    else if (sortBy === 'Lowest Amount') sortOption = { amount: 1 };

    // 6. DB Queries
    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(transactionQuery),
      Transaction.find(transactionQuery)
        .populate('coachId', 'name email phone')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction statistics summary
// @route   GET /api/admin/transactions/summary
// @access  Private (Admin only)
export const getTransactionSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenueResult,
      monthRevenueResult,
      successCount,
      failedCount,
      activeCoachesCount,
      expiredCoachesCount
    ] = await Promise.all([
      // Total Revenue
      Transaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Month Revenue
      Transaction.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Successful Payments Count
      Transaction.countDocuments({ status: 'SUCCESS' }),
      // Failed Payments Count
      Transaction.countDocuments({ status: 'FAILED' }),
      // Active Coaches Count
      Subscription.countDocuments({ status: 'ACTIVE', expiryDate: { $gt: todayMidnight } }),
      // Expired Coaches Count
      Subscription.countDocuments({
        $or: [
          { status: 'EXPIRED' },
          { status: 'ACTIVE', expiryDate: { $lte: todayMidnight } }
        ]
      })
    ]);

    const totalRevenue = totalRevenueResult[0] ? totalRevenueResult[0].total : 0;
    const thisMonthRevenue = monthRevenueResult[0] ? monthRevenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        thisMonthRevenue,
        totalRevenue,
        successfulPayments: successCount,
        failedPayments: failedCount,
        activeCoaches: activeCoachesCount,
        expiredCoaches: expiredCoachesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed transaction by ID
// @route   GET /api/admin/transactions/:id
// @access  Private (Admin only)
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('coachId', 'name email phone')
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const subscription = await Subscription.findOne({ coachId: transaction.coachId }).lean();

    res.status(200).json({
      success: true,
      data: {
        transaction,
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};
