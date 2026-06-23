import DietPlan from '../models/DietPlan.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

// @desc    Create or update diet plan for a client
// @route   POST /api/diet-plans/upload
// @access  Private (Coach)
export const uploadDietPlan = async (req, res, next) => {
  const { clientId, beginner, intermediate, advanced, weightLoss } = req.body;
  const coachId = req.user._id;

  try {
    let dietPlan;
    if (clientId) {
      const client = await Client.findById(clientId);
      if (!client) {
        res.status(404);
        throw new Error('Client not found');
      }
      dietPlan = await DietPlan.findOne({ client: clientId });
    } else {
      // Coach-wide template plan
      dietPlan = await DietPlan.findOne({ coach: coachId, client: null });
    }

    let fileUrl = null;
    if (req.file) {
      // Delete old file from Cloudinary if exists
      if (dietPlan && dietPlan.fileUrl && dietPlan.fileUrl.public_id) {
        await deleteFromCloudinary(dietPlan.fileUrl.public_id, 'raw');
      }
      const uploadResult = await uploadToCloudinary(req.file.path, 'diets');
      fileUrl = {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };
    }

    if (dietPlan) {
      // Update
      dietPlan.beginner = beginner !== undefined ? beginner : dietPlan.beginner;
      dietPlan.intermediate = intermediate !== undefined ? intermediate : dietPlan.intermediate;
      dietPlan.advanced = advanced !== undefined ? advanced : dietPlan.advanced;
      dietPlan.weightLoss = weightLoss !== undefined ? weightLoss : dietPlan.weightLoss;
      dietPlan.approved = true; // immediately approved by coach
      if (fileUrl) dietPlan.fileUrl = fileUrl;
      await dietPlan.save();
    } else {
      // Create
      dietPlan = await DietPlan.create({
        client: clientId || null,
        coach: coachId,
        beginner: beginner || '',
        intermediate: intermediate || '',
        advanced: advanced || '',
        weightLoss: weightLoss || '',
        approved: true,
        fileUrl: fileUrl || { secure_url: null, public_id: null }
      });
    }

    // Send Notification to Client if client-specific
    if (clientId) {
      await Notification.create({
        recipientType: 'client',
        recipientId: clientId,
        text: 'Your diet plan has been uploaded or updated by your coach.',
        type: 'diet_uploaded'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Diet plan uploaded successfully',
      data: dietPlan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get diet plan for logged in client
// @route   GET /api/diet-plans/my-plan
// @access  Private (Client)
export const getMyDietPlan = async (req, res, next) => {
  const clientId = req.user._id;

  try {
    const client = await Client.findById(clientId);
    // Find client-specific plan first, fallback to coach-wide base plan
    let dietPlan = await DietPlan.findOne({ client: clientId, approved: true });
    
    if (!dietPlan && client && client.coach) {
      dietPlan = await DietPlan.findOne({ coach: client.coach, client: null, approved: true });
    }

    if (!dietPlan) {
      return res.json({
        success: true,
        message: 'No diet plan assigned yet.',
        data: null
      });
    }

    res.json({
      success: true,
      data: dietPlan
    });
  } catch (error) {
    next(error);
  }
};
