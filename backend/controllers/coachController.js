import Admin from '../models/Admin.js';
import { isSessionInFuture, parseSessionDateTime } from '../utils/sessionHelper.js';
import Coach from '../models/Coach.js';
import Client from '../models/Client.js';
import Session from '../models/Session.js';
import Prospect from '../models/Prospect.js';
import Referral from '../models/Referral.js';
import Result from '../models/Result.js';
import Notification from '../models/Notification.js';
import DietPlan from '../models/DietPlan.js';
import BodyParameterHistory from '../models/BodyParameterHistory.js';
import MeasurementHistory from '../models/MeasurementHistory.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';


// Get local date string YYYY-MM-DD
const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



// @desc    Coach adds a client (initially without password)
// @route   POST /api/coaches/clients
// @access  Private (Coach)
export const addClient = async (req, res, next) => {
  const { name, email, phone, city, clientPlan, age, gender, weight, height, password } = req.body;
  const coachId = req.user._id;

  try {
    if (!name || !email || !phone || !clientPlan || !password) {
      res.status(400);
      throw new Error('Please enter name, email, phone number, plan, and password');
    }

    // Check if client with this phone number already exists
    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      res.status(400);
      throw new Error('A client with this phone number is already registered');
    }

    // Expiry calculation: Expiry = Start Date + 30 Days
    const subscriptionStartDate = new Date();
    const subscriptionExpiryDate = new Date();
    subscriptionExpiryDate.setDate(subscriptionStartDate.getDate() + 30);

    const client = await Client.create({
      name,
      email,
      phone,
      password,
      city,
      clientPlan,
      age: age ? Number(age) : undefined,
      gender: gender || '',
      height: height ? Number(height) : undefined,
      coach: coachId,
      coachName: req.user.name,
      subscriptionStartDate,
      subscriptionExpiryDate,
      profileComplete: false // will be completed when client logs in and finishes onboarding
    });

    // Notify Admin
    await Notification.create({
      recipientType: 'admin',
      text: `Coach ${req.user.name} added a new client: ${name}.`,
      type: 'new_client'
    });

    res.status(201).json({
      success: true,
      message: 'Client added successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Coach dashboard stats
// @route   GET /api/coaches/dashboard
// @access  Private (Coach)
export const getDashboardStats = async (req, res, next) => {
  const coachId = req.user._id;
  const {
    clientPlan,
    clientCity,
    clientSearch,
    prospectGender,
    prospectCity,
    prospectWeight
  } = req.query;

  const startTime = Date.now();

  try {
    // Build client query
    const clientQuery = { coach: coachId };
    if (clientPlan && clientPlan !== 'All') {
      clientQuery.clientPlan = clientPlan;
    }
    if (clientCity && clientCity !== 'All') {
      clientQuery.city = new RegExp('^' + clientCity + '$', 'i');
    }
    if (clientSearch && clientSearch.trim() !== '') {
      clientQuery.$or = [
        { name: new RegExp(clientSearch, 'i') },
        { phone: new RegExp(clientSearch, 'i') },
        { city: new RegExp(clientSearch, 'i') }
      ];
    }

    // Build prospect query
    const prospectQuery = { addedByCoach: coachId };
    if (prospectGender && prospectGender !== 'All') {
      prospectQuery.gender = prospectGender;
    }
    if (prospectCity && prospectCity !== 'All') {
      prospectQuery.city = new RegExp('^' + prospectCity + '$', 'i');
    }
    if (prospectWeight && prospectWeight !== 'All') {
      prospectQuery.weightRange = prospectWeight;
    }

    // Execute independent queries in parallel using lean() where appropriate
    const [
      clientsCount,
      sessionsCount,
      prospectsCount,
      resultsCount,
      clients,
      rawSessions,
      prospects,
      clientIds,
      coaches,
      results,
      admins,
      dietPlan,
      notifications
    ] = await Promise.all([
      Client.countDocuments({ coach: coachId }),
      Session.countDocuments({ 
        $or: [{ coachId: coachId }, { parentCoachId: coachId }], 
        status: 'APPROVED' 
      }),
      Prospect.countDocuments({ addedByCoach: coachId }),
      Result.countDocuments({ coach: coachId }),
      Client.find(clientQuery).select('-password').lean(),
      Session.find({ 
        participants: { $in: [coachId] },
        status: { $in: ['APPROVED', 'PENDING'] }
      })
        .populate('clientId', 'name phone')
        .populate('coachId', 'name phone')
        .populate('parentCoachId', 'name phone')
        .sort({ date: 1, time: 1 })
        .lean(),
      Prospect.find(prospectQuery).lean(),
      Client.find({ coach: coachId }).distinct('_id'),
      Coach.find({ seniorCoach: coachId }).lean(),
      Result.find({ coach: coachId }).lean(),
      Admin.find().lean(),
      DietPlan.findOne({ coach: coachId, client: null }).lean(),
      Notification.find({
        recipientType: 'coach',
        recipientId: coachId
      }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    // Run dependent referrals query
    const referrals = await Referral.find({ client: { $in: clientIds } }).populate('client', 'name').lean();

    const sessions = rawSessions
      .filter(s => isSessionInFuture(s.date, s.time))
      .sort((a, b) => parseSessionDateTime(a.date, a.time) - parseSessionDateTime(b.date, b.time));

    res.json({
      success: true,
      data: {
        stats: {
          clients: clientsCount,
          sessions: sessionsCount,
          prospects: prospectsCount,
          results: resultsCount
        },
        dietPlan: dietPlan || { beginner: '', intermediate: '', advanced: '', weightLoss: '' },
        clients,
        sessions: sessions.map(s => {
          let participantName = 'Unknown';
          let participantPhone = '';

          const otherParticipantId = s.participants && s.participants.length > 0 
            ? s.participants.find(pId => pId && pId.toString() !== coachId.toString())
            : null;

          if (s.clientId && s.clientId._id.toString() !== coachId.toString()) {
            participantName = s.clientId.name;
            participantPhone = s.clientId.phone;
          } else if (s.coachId && s.coachId._id.toString() !== coachId.toString()) {
            participantName = s.coachId.name;
            participantPhone = s.coachId.phone;
          } else if (s.parentCoachId && s.parentCoachId._id.toString() !== coachId.toString()) {
            participantName = s.parentCoachId.name;
            participantPhone = s.parentCoachId.phone;
          } else if (otherParticipantId) {
            const adminParticipant = admins.find(a => a._id.toString() === otherParticipantId.toString());
            if (adminParticipant) {
              participantName = adminParticipant.name;
              participantPhone = adminParticipant.phone || '';
            } else {
              participantName = admins.length > 0 ? admins[0].name : 'Super Coach';
              participantPhone = '';
            }
          } else {
            participantName = admins.length > 0 ? admins[0].name : 'Super Coach';
            participantPhone = '';
          }

          return {
            id: s._id,
            type: !s.clientId ? 'coach' : 'client',
            participantName,
            participantPhone,
            date: s.date,
            time: s.time,
            status: s.status,
            title: s.title,
            organizerId: s.organizerId,
            isOrganizer: s.organizerId ? s.organizerId.toString() === coachId.toString() : false
          };
        }),
        prospects,
        referrals: referrals.map(r => ({
          id: r._id,
          name: r.name,
          city: r.city,
          email: r.email,
          phone: r.phone,
          age: r.age,
          gender: r.gender,
          weightRange: r.weightRange,
          interest: r.interest,
          clientName: r.client ? r.client.name : 'Unknown'
        })),
        coaches: coaches.map(c => ({
          id: c._id,
          name: c.name,
          clientsCount: 0, // In future could aggregate clients under this subcoach
          level: c.level,
          status: c.activeStatus ? c.activeStatus.toLowerCase() : 'active'
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

// @desc    Add a prospect
// @route   POST /api/coaches/prospects
// @access  Private (Coach)
export const addProspect = async (req, res, next) => {
  const { name, email, phone, city, age, gender, weight } = req.body;
  const coachId = req.user._id;

  try {
    if (!name || !email || !phone) {
      res.status(400);
      throw new Error('Please provide name, email, and phone number');
    }

    const existingProspect = await Prospect.findOne({ phone });
    if (existingProspect) {
      res.status(400);
      throw new Error('A prospect with this phone number already exists');
    }

    const prospect = await Prospect.create({
      name,
      email,
      phone,
      city,
      age,
      gender,
      weightRange: weight || '',
      addedByCoach: coachId
    });

    res.status(201).json({
      success: true,
      message: 'Prospect added successfully',
      data: prospect
    });
  } catch (error) {
    next(error);
  }
};

export const addCoach = async (req, res, next) => {
  const { name, phone, email, city, gender, experience, level, password } = req.body;
  const seniorCoachId = req.user._id;

  try {
    if (!name || !phone || !email || !level || !password) {
      res.status(400);
      throw new Error('Please enter name, phone, email, level, and password');
    }

    const existingCoach = await Coach.findOne({ phone });
    if (existingCoach) {
      res.status(400);
      throw new Error('A coach with this phone number is already registered');
    }

    const coach = await Coach.create({
      name,
      email,
      phone,
      password,
      city,
      gender,
      experience,
      level,
      seniorCoach: seniorCoachId,
      activeStatus: 'Active',
      role: 'coach',
      profileComplete: true
    });

    // Notify Admin
    await Notification.create({
      recipientType: 'admin',
      text: `Senior Coach ${req.user.name} added a new Coach: ${name}.`,
      type: 'new_coach'
    });

    res.status(201).json({
      success: true,
      message: 'Coach added successfully',
      data: coach
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload transformation result
// @route   POST /api/coaches/results
// @access  Private (Coach)
export const uploadResult = async (req, res, next) => {
  const { clientName, description } = req.body;
  const coachId = req.user._id;

  try {
    if (!clientName || !description) {
      res.status(400);
      throw new Error('Please provide client name and description');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a transformation image');
    }

    const uploadResult = await uploadToCloudinary(req.file.path, 'transformations');

    const result = await Result.create({
      coach: coachId,
      clientName,
      description,
      image: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });

    // Notify Client
    // Find a client with this exact name under the uploading coach (which can be admin or coach)
    const client = await Client.findOne({ name: clientName, coach: coachId });
    if (client) {
      await Notification.create({
        recipientType: 'client',
        recipientId: client._id,
        text: 'Your coach has uploaded a transformation.',
        type: 'new_result'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Result uploaded successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit transformation result
// @route   PUT /api/results/:id
// @access  Private (Coach/Admin)
export const editResult = async (req, res, next) => {
  const resultId = req.params.id;
  const { clientName, title, description } = req.body;
  const userId = req.user._id;

  try {
    const result = await Result.findById(resultId);
    if (!result) {
      res.status(404);
      throw new Error('Result not found');
    }

    // Verify ownership: only the coach who uploaded or admin can edit
    if (result.coach.toString() !== userId.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to edit this result');
    }

    result.clientName = clientName || title || result.clientName;
    result.description = description !== undefined ? description : result.description;

    if (req.file) {
      // Delete old image from Cloudinary
      if (result.image && result.image.public_id) {
        await deleteFromCloudinary(result.image.public_id, 'image');
      }
      // Upload new image
      const uploadRes = await uploadToCloudinary(req.file.path, 'transformations');
      result.image = {
        secure_url: uploadRes.secure_url,
        public_id: uploadRes.public_id
      };
    }

    await result.save();

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transformation result
// @route   DELETE /api/results/:id
// @access  Private (Coach/Admin)
export const deleteResult = async (req, res, next) => {
  const resultId = req.params.id;
  const userId = req.user._id;

  try {
    const result = await Result.findById(resultId);
    if (!result) {
      res.status(404);
      throw new Error('Result not found');
    }

    // Verify ownership
    if (result.coach.toString() !== userId.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this result');
    }

    // Delete from Cloudinary
    if (result.image && result.image.public_id) {
      await deleteFromCloudinary(result.image.public_id, 'image');
    }

    await Result.findByIdAndDelete(resultId);

    res.json({
      success: true,
      message: 'Result deleted permanently'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client permanently
// @route   DELETE /api/coaches/clients/:id
// @access  Private (Coach/Admin)
export const deleteClient = async (req, res, next) => {
  const clientId = req.params.id;
  const userId = req.user._id;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    // Verify ownership
    if (client.coach && client.coach.toString() !== userId.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this client');
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

    // Delete sessions and referrals
    const Session = (await import('../models/Session.js')).default;
    const Referral = (await import('../models/Referral.js')).default;
    await Session.deleteMany({ participants: { $in: [clientId] } });
    await Referral.deleteMany({ client: clientId });

    res.json({
      success: true,
      message: 'Client and all related records deleted permanently'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific client details (profile, parameters, measurements, results)
// @route   GET /api/coaches/clients/:id
// @access  Private (Coach/Admin)
// @desc    Update client subscription
// @route   PUT /api/coach/clients/:id/subscription
// @access  Private (Coach/Admin)
export const updateClientSubscription = async (req, res, next) => {
  const { subscriptionStartDate, subscriptionExpiryDate } = req.body;
  
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }
    
    // Admins can update any client. Coaches can only update their own clients.
    if (req.user.role === 'coach' && client.coach && client.coach.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this client');
    }

    if (subscriptionStartDate) {
      client.subscriptionStartDate = new Date(subscriptionStartDate);
    }
    if (subscriptionExpiryDate) {
      client.subscriptionExpiryDate = new Date(subscriptionExpiryDate);
    }

    await client.save();
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subcoach active status
// @route   PUT /api/coaches/sub-coaches/:id/status
// @access  Private (Coach/Admin)
export const updateSubcoachStatus = async (req, res, next) => {
  const { status } = req.body;
  
  try {
    const coach = await Coach.findById(req.params.id);
    if (!coach) {
      res.status(404);
      throw new Error('Coach not found');
    }
    
    // Authorization check: Admins can update any. Coaches can only update coaches who have them as seniorCoach.
    if (req.user.role === 'coach' && coach.seniorCoach && coach.seniorCoach.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this coach status');
    }

    if (status) {
      coach.activeStatus = status; // 'Active' or 'Inactive'
    }

    await coach.save();
    
    res.json({
      success: true,
      message: `Coach status updated to ${status} successfully`,
      data: coach
    });
  } catch (error) {
    next(error);
  }
};

export const getClientDetails = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    
    // Check if client exists
    const client = await Client.findById(clientId).select('-password');
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    // Optional: Authorization check - if coach, ensure client belongs to coach hierarchy
    if (req.user.role === 'coach') {
      if (client.coach && client.coach.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this client');
      }
    }

    // Fetch history
    const parameterHistory = await BodyParameterHistory.find({ client: clientId }).sort({ date: 1 });
    const measurementHistory = await MeasurementHistory.find({ client: clientId }).sort({ date: 1 });
    const results = await Result.find({ clientName: new RegExp('^' + client.name + '$', 'i') }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        client,
        parameterHistory,
        measurementHistory,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coach profile details
// @route   PUT /api/coaches/profile
// @access  Private (Coach)
export const updateCoachProfile = async (req, res, next) => {
  const { name, phone, email, age, gender, city, experience, coachName } = req.body;
  const coachId = req.user._id;

  try {
    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404);
      throw new Error('Coach not found');
    }

    coach.name = name !== undefined ? name : coach.name;
    coach.phone = phone !== undefined ? phone : coach.phone;
    coach.email = email !== undefined ? email : coach.email;
    coach.age = age !== undefined ? age : coach.age;
    coach.gender = gender !== undefined ? gender : coach.gender;
    coach.city = city !== undefined ? city : coach.city;
    coach.experience = experience !== undefined ? experience : coach.experience;
    coach.coachName = coachName !== undefined ? coachName : coach.coachName;

    await coach.save();

    res.json({
      success: true,
      message: 'Coach profile updated successfully',
      data: {
        id: coach._id,
        name: coach.name,
        phone: coach.phone,
        email: coach.email,
        age: coach.age,
        gender: coach.gender,
        city: coach.city,
        experience: coach.experience,
        coachName: coach.coachName
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prospect
// @route   DELETE /api/prospects/:id
// @access  Private (Coach/Admin)
export const deleteProspect = async (req, res, next) => {
  const prospectId = req.params.id;
  const userId = req.user._id;

  try {
    const prospect = await Prospect.findById(prospectId);
    if (!prospect) {
      res.status(404);
      throw new Error('Prospect not found');
    }

    // Verify ownership
    if (prospect.addedByCoach && prospect.addedByCoach.toString() !== userId.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this prospect');
    }

    await Prospect.findByIdAndDelete(prospectId);

    res.json({
      success: true,
      message: 'Prospect deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subcoach
// @route   DELETE /api/coaches/sub-coaches/:id
// @access  Private (Coach)
export const deleteSubcoach = async (req, res, next) => {
  const coachId = req.params.id;

  try {
    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404);
      throw new Error('Coach not found');
    }

    if (coach.seniorCoach && coach.seniorCoach.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this sub-coach');
    }

    // Unset seniorCoach for this subcoach's subcoaches (if any)
    await Coach.updateMany({ seniorCoach: coachId }, { $unset: { seniorCoach: 1 } });
    
    // Set clients to have no coach
    const Client = (await import('../models/Client.js')).default;
    await Client.updateMany({ coach: coachId }, { $unset: { coach: 1 } });

    await Coach.findByIdAndDelete(coachId);

    res.json({
      success: true,
      message: 'Subcoach deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
