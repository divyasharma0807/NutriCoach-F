import Client from '../models/Client.js';
import Coach from '../models/Coach.js';
import Session from '../models/Session.js';
import DietPlan from '../models/DietPlan.js';
import Referral from '../models/Referral.js';
import Notification from '../models/Notification.js';
import Result from '../models/Result.js';
import BodyParameterHistory from '../models/BodyParameterHistory.js';
import MeasurementHistory from '../models/MeasurementHistory.js';
import path from 'path';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

// Get local date string YYYY-MM-DD
const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Complete client profile & associate coach
// @route   PUT /api/clients/profile
// @access  Private (Client)
export const completeProfile = async (req, res, next) => {
  const clientId = req.user._id;

  try {
    const {
      fullName,
      emailAddress,
      phoneNumber,
      city,
      age,
      gender,
      height,
      heightUnit,
      weightUnit,
      activeGoal,
      allergies,
      coachName,
      // Metrics
      bodyWeight,
      bodyMassIndex,
      bodyFatRatio,
      muscleRate,
      bodyWater,
      boneMass,
      basalMetabolicRate,
      metabolicAge,
      visceralFat,
      subcutaneousFat,
      proteinMass,
      muscleMass,
      weightWithoutFat,
      // Measurements
      belly,
      waist,
      thigh,
      chest,
      arm
    } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Client profile not found');
    }

    let finalCoach = client.coach;
    let finalPlan = client.clientPlan;
    let finalSubStart = client.subscriptionStartDate;
    let finalSubExpiry = client.subscriptionExpiryDate;

    // Check if phone number is provided and unique
    if (phoneNumber) {
      // Find if there is an existing client with this phone number
      const existingClient = await Client.findOne({ phone: phoneNumber });
      
      if (existingClient && existingClient._id.toString() !== clientId.toString()) {
        // If the existing client was created by a coach (doesn't have a password set)
        if (!existingClient.password) {
          // Merge coach-created client into this client
          finalCoach = existingClient.coach;
          finalPlan = existingClient.clientPlan;
          finalSubStart = existingClient.subscriptionStartDate;
          finalSubExpiry = existingClient.subscriptionExpiryDate;

          // Delete the temporary coach-created record
          await Client.findByIdAndDelete(existingClient._id);
          console.log(`Merged and deleted coach-created client record for phone: ${phoneNumber}`);
        } else {
          res.status(400);
          throw new Error('Phone number is already associated with another active profile');
        }
      }
      client.phone = phoneNumber;
    }

    // Try to associate coach by name if no coach is assigned yet
    if (!finalCoach && coachName) {
      const matchedCoach = await Coach.findOne({ name: new RegExp('^' + coachName + '$', 'i') });
      if (matchedCoach) {
        finalCoach = matchedCoach._id;
      }
    }

    // Set file upload paths if uploaded
    if (req.files) {
      if (req.files.profilePhoto) {
        const photoFile = req.files.profilePhoto[0];
        if (client.profilePhoto && client.profilePhoto.public_id) {
          await deleteFromCloudinary(client.profilePhoto.public_id, 'image');
        }
        const uploadResult = await uploadToCloudinary(photoFile.path, 'profiles');
        client.profilePhoto = {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        };
      }
      if (req.files.medicalPdf) {
        const pdfFile = req.files.medicalPdf[0];
        if (client.medicalPdf && client.medicalPdf.public_id) {
          await deleteFromCloudinary(client.medicalPdf.public_id, 'raw');
        }
        const uploadResult = await uploadToCloudinary(pdfFile.path, 'medicals');
        client.medicalPdf = {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        };
      }
    }

    // Update Client Fields
    client.name = fullName || client.name;
    client.email = emailAddress || client.email;
    client.city = city || client.city;
    client.age = age ? Number(age) : client.age;
    client.gender = gender || client.gender;
    client.height = height ? Number(height) : client.height;
    client.heightUnit = heightUnit || client.heightUnit;
    client.weightUnit = weightUnit || client.weightUnit;
    client.activeGoal = activeGoal || client.activeGoal;
    client.allergies = allergies || client.allergies;
    client.coachName = coachName || client.coachName;
    client.coach = finalCoach;
    client.clientPlan = finalPlan;
    client.subscriptionStartDate = finalSubStart;
    client.subscriptionExpiryDate = finalSubExpiry;
    client.profileComplete = true;

    await client.save();

    // Create the FIRST Baseline Analytics entry (if not already created)
    const todayStr = getLocalTodayString();
    
    // Check if baseline parameters already exist
    const existingParams = await BodyParameterHistory.findOne({ client: clientId, isProfileBaseline: true });
    if (!existingParams && (bodyWeight || height)) {
      await BodyParameterHistory.create({
        client: clientId,
        date: todayStr,
        isProfileBaseline: true,
        bodyWeight: bodyWeight ? Number(bodyWeight) : undefined,
        bmi: bodyMassIndex ? Number(bodyMassIndex) : undefined,
        bodyFatRatio: bodyFatRatio ? Number(bodyFatRatio) : undefined,
        muscleRate: muscleRate ? Number(muscleRate) : undefined,
        bodyWater: bodyWater ? Number(bodyWater) : undefined,
        boneMass: boneMass ? Number(boneMass) : undefined,
        bmr: basalMetabolicRate ? Number(basalMetabolicRate) : undefined,
        metabolicAge: metabolicAge ? Number(metabolicAge) : undefined,
        visceralFat: visceralFat ? Number(visceralFat) : undefined,
        subcutaneousFat: subcutaneousFat ? Number(subcutaneousFat) : undefined,
        proteinMass: proteinMass ? Number(proteinMass) : undefined,
        muscleMass: muscleMass ? Number(muscleMass) : undefined,
        weightWithoutFat: weightWithoutFat ? Number(weightWithoutFat) : undefined
      });
    }

    // Check if baseline measurements already exist
    const existingMeasurements = await MeasurementHistory.findOne({ client: clientId, isProfileBaseline: true });
    if (!existingMeasurements && (belly || waist || thigh || chest || arm)) {
      await MeasurementHistory.create({
        client: clientId,
        date: todayStr,
        isProfileBaseline: true,
        belly: belly ? Number(belly) : undefined,
        waist: waist ? Number(waist) : undefined,
        thigh: thigh ? Number(thigh) : undefined,
        chest: chest ? Number(chest) : undefined,
        arm: arm ? Number(arm) : undefined
      });
    }

    // Trigger Notification for Admin (New client profile complete)
    await Notification.create({
      recipientType: 'admin',
      text: `Client ${client.name} has completed their profile.`,
      type: 'new_client'
    });

    // Trigger Notification for Coach if associated
    if (finalCoach) {
      await Notification.create({
        recipientType: 'coach',
        recipientId: finalCoach,
        text: `Client ${client.name} has completed their profile and connected with you.`,
        type: 'new_client_connected'
      });
    }

    res.json({
      success: true,
      message: 'Profile completed successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client dashboard data
// @route   GET /api/clients/dashboard
// @access  Private (Client)
export const getDashboardStats = async (req, res, next) => {
  const clientId = req.user._id;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    // Get parameters history
    const parameterHistory = await BodyParameterHistory.find({ client: clientId }).sort({ date: 1 });
    // Get measurements history
    const measurementHistory = await MeasurementHistory.find({ client: clientId }).sort({ date: 1 });

    // Calculate subscription days remaining
    let subscriptionDays = 'N/A';
    if (client.subscriptionExpiryDate) {
      const diffMs = new Date(client.subscriptionExpiryDate).getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      subscriptionDays = diffDays > 0 ? `${diffDays} Days` : 'Expired';
    }

    // Find upcoming sessions (approved and today or future)
    const todayStr = getLocalTodayString();
    const sessions = await Session.find({
      participants: { $in: [clientId] },
      status: 'APPROVED'
    }).sort({ date: 1, time: 1 });
    console.log('[DEBUG] Client Dashboard - ClientId:', clientId);
    console.log('[DEBUG] Client Dashboard - Sessions found:', sessions.length);

    // Get latest approved diet plan
    const dietPlan = await DietPlan.findOne({ client: clientId, approved: true });

    // Get notifications
    const notifications = await Notification.find({
      recipientType: 'client',
      recipientId: clientId
    }).sort({ createdAt: -1 }).limit(10);

    // Get results uploaded by the client's direct coach/admin
    let results = [];
    if (client.coach) {
      results = await Result.find({ coach: client.coach });
    }

    res.json({
      success: true,
      data: {
        profileComplete: client.profileComplete,
        currentWeight: parameterHistory.length > 0 ? parameterHistory[parameterHistory.length - 1].bodyWeight : 'N/A',
        activeGoal: client.activeGoal || 'N/A',
        subscriptionDays,
        upcomingSessionsCount: sessions.length,
        sessions: sessions.map(s => ({ id: s._id, date: s.date, time: s.time, status: s.status, title: s.title })),
        dietPlan: dietPlan || null,
        parameterHistory,
        measurementHistory,
        results: results.map(r => ({
          id: r._id,
          clientName: r.clientName,
          description: r.description,
          image: r.image
        })),
        notifications: notifications.map(n => ({ id: n._id, text: n.text, read: n.read }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add body parameter history record
// @route   POST /api/clients/parameters
// @access  Private (Client)
export const addParameterHistory = async (req, res, next) => {
  const clientId = req.user._id;
  try {
    const { date, ...metrics } = req.body;
    const entryDate = date || getLocalTodayString();

    // Check if entry for date already exists, update it if so, otherwise create new
    let parameter = await BodyParameterHistory.findOne({ client: clientId, date: entryDate });
    
    const formattedMetrics = {
      bodyWeight: metrics['Body Weight'] ? Number(metrics['Body Weight']) : undefined,
      bmi: metrics['Body Mass Index (BMI)'] ? Number(metrics['Body Mass Index (BMI)']) : undefined,
      bodyFatRatio: metrics['Body Fat Ratio'] ? Number(metrics['Body Fat Ratio']) : undefined,
      muscleRate: metrics['Muscle Rate'] ? Number(metrics['Muscle Rate']) : undefined,
      bodyWater: metrics['Body Water'] ? Number(metrics['Body Water']) : undefined,
      boneMass: metrics['Bone Mass'] ? Number(metrics['Bone Mass']) : undefined,
      bmr: metrics['Basal Metabolic Rate'] ? Number(metrics['Basal Metabolic Rate']) : undefined,
      metabolicAge: metrics['Metabolic Age'] ? Number(metrics['Metabolic Age']) : undefined,
      visceralFat: metrics['Visceral Fat'] ? Number(metrics['Visceral Fat']) : undefined,
      subcutaneousFat: metrics['Subcutaneous Fat'] ? Number(metrics['Subcutaneous Fat']) : undefined,
      proteinMass: metrics['Protein Mass'] ? Number(metrics['Protein Mass']) : undefined,
      muscleMass: metrics['Muscle Mass'] ? Number(metrics['Muscle Mass']) : undefined,
      weightWithoutFat: metrics['Weight Without Fat'] ? Number(metrics['Weight Without Fat']) : undefined
    };

    // Filter out undefined values
    const cleanedMetrics = Object.fromEntries(
      Object.entries(formattedMetrics).filter(([_, v]) => v !== undefined)
    );

    if (parameter) {
      Object.assign(parameter, cleanedMetrics);
      await parameter.save();
    } else {
      parameter = await BodyParameterHistory.create({
        client: clientId,
        date: entryDate,
        isProfileBaseline: false,
        ...cleanedMetrics
      });
    }

    res.status(201).json({
      success: true,
      message: 'Body parameter record saved successfully',
      data: parameter
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add body measurement history record
// @route   POST /api/clients/measurements
// @access  Private (Client)
export const addMeasurementHistory = async (req, res, next) => {
  const clientId = req.user._id;
  try {
    const { date, ...metrics } = req.body;
    const entryDate = date || getLocalTodayString();

    let measurement = await MeasurementHistory.findOne({ client: clientId, date: entryDate });

    const formattedMetrics = {
      belly: metrics['Belly'] ? Number(metrics['Belly']) : undefined,
      waist: metrics['Waist'] ? Number(metrics['Waist']) : undefined,
      thigh: metrics['Thigh'] ? Number(metrics['Thigh']) : undefined,
      chest: metrics['Chest'] ? Number(metrics['Chest']) : undefined,
      arm: metrics['Arm'] ? Number(metrics['Arm']) : undefined
    };

    const cleanedMetrics = Object.fromEntries(
      Object.entries(formattedMetrics).filter(([_, v]) => v !== undefined)
    );

    if (measurement) {
      Object.assign(measurement, cleanedMetrics);
      await measurement.save();
    } else {
      measurement = await MeasurementHistory.create({
        client: clientId,
        date: entryDate,
        isProfileBaseline: false,
        ...cleanedMetrics
      });
    }

    res.status(201).json({
      success: true,
      message: 'Body measurement record saved successfully',
      data: measurement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a referral
// @route   POST /api/clients/referrals
// @access  Private (Client)
export const createReferral = async (req, res, next) => {
  const clientId = req.user._id;
  const { name, email, phone, city, age, gender } = req.body;

  try {
    const client = await Client.findById(clientId);

    const referral = await Referral.create({
      client: clientId,
      name,
      email,
      phone,
      city,
      age,
      gender
    });

    // Notify Coach
    if (client.coach) {
      await Notification.create({
        recipientType: 'coach',
        recipientId: client.coach,
        text: `Your client ${client.name} has submitted a new referral: ${name}.`,
        type: 'new_referral'
      });
    }

    // Notify Admin
    await Notification.create({
      recipientType: 'admin',
      text: `New referral submitted by client ${client.name}: ${name} (${phone}).`,
      type: 'new_referral'
    });

    res.status(201).json({
      success: true,
      message: 'Referral submitted successfully',
      data: referral
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client's referrals
// @route   GET /api/clients/referrals
// @access  Private (Client)
export const getReferrals = async (req, res, next) => {
  try {
    const referrals = await Referral.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: referrals
    });
  } catch (error) {
    next(error);
  }
};

