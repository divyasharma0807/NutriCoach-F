import Admin from '../models/Admin.js';
import Coach from '../models/Coach.js';
import Client from '../models/Client.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user (Client or Coach)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    if (!role || !['client', 'coach'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role specified. Must be client or coach');
    }

    if (role === 'coach') {
      // Check if email or phone already registered? Wait, during registration, phone is empty, they complete profile later
      // Wait, let's verify if there is an existing coach with the same email
      const existingCoach = await Coach.findOne({ email });
      if (existingCoach) {
        res.status(400);
        throw new Error('Email is already registered under a coach');
      }

      // Generate a temporary phone number based on timestamp since phone is unique
      const tempPhone = 'TEMP-' + Date.now();

      const coach = await Coach.create({
        name,
        email,
        phone: tempPhone,
        password,
        role: 'coach',
      });

      generateToken(res, coach._id, 'coach');

      res.status(201).json({
        success: true,
        message: 'Coach registered successfully',
        data: {
          id: coach._id,
          name: coach.name,
          email: coach.email,
          role: 'coach',
          profileComplete: false,
        }
      });
    } else {
      // client
      const existingClient = await Client.findOne({ email });
      if (existingClient) {
        res.status(400);
        throw new Error('Email is already registered under a client');
      }

      const tempPhone = 'TEMP-' + Date.now();

      const client = await Client.create({
        name,
        email,
        phone: tempPhone,
        password,
        role: 'client',
        profileComplete: false,
      });

      generateToken(res, client._id, 'client');

      res.status(201).json({
        success: true,
        message: 'Client registered successfully',
        data: {
          id: client._id,
          name: client.name,
          email: client.email,
          role: 'client',
          profileComplete: false,
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { phone, password, role } = req.body;

  try {
    if (!phone || !password || !role) {
      res.status(400);
      throw new Error('Please provide phone number, password, and role');
    }

    let user;
    if (role === 'admin') {
      user = await Admin.findOne({ phone });
      
      // Auto-seed admin if no admins exist in DB
      if (!user) {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
          user = await Admin.create({
            name: 'System Admin',
            phone,
            password, // Mongoose pre-save hashes it
            role: 'admin',
          });
          console.log(`Auto-seeded first Admin with phone: ${phone}`);
        } else {
          res.status(401);
          throw new Error('Invalid phone or password');
        }
      }
    } else if (role === 'coach') {
      user = await Coach.findOne({ phone });
    } else if (role === 'client') {
      user = await Client.findOne({ phone });
    } else {
      res.status(400);
      throw new Error('Invalid role specified');
    }

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid phone or password');
    }

    const token = generateToken(res, user._id, role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email || '',
        phone: user.phone,
        role: user.role,
        profileComplete: role === 'admin' ? true : user.profileComplete,
        activeGoal: role === 'client' ? (user.activeGoal || '') : '',
      },
      token // also return token for frontend storage flexibility
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email || '',
        phone: user.phone,
        role: user.role,
        profileComplete: user.role === 'admin' ? true : user.profileComplete,
        activeGoal: user.role === 'client' ? (user.activeGoal || '') : '',
        age: user.age || '',
        gender: user.gender || '',
        city: user.city || '',
        experience: user.experience || '',
        coachName: user.coachName || '',
      }
    });
  } catch (error) {
    next(error);
  }
};
