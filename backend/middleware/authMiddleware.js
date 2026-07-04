import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Coach from '../models/Coach.js';
import Client from '../models/Client.js';

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  // Read token from cookie or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token || token === 'undefined' || token === 'null') {
    res.status(401);
    return next(new Error('Not authorized to access this route, token missing'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user based on role in JWT payload
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    } else if (decoded.role === 'coach') {
      user = await Coach.findById(decoded.id).select('-password');
    } else if (decoded.role === 'client') {
      user = await Client.findById(decoded.id).select('-password');
    }

    if (!user) {
      res.status(401);
      return next(new Error('User not found'));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token failed'));
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`));
    }
    next();
  };
};
