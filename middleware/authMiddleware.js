import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect middleware to verify the token stored in cookies or Authorization header
export const protect = async (req, res, next) => {
  let token;

  // Check for token in cookies or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token; // Get token from cookies
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Get token from Authorization header
  }

  // Check if token is present
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request object, excluding the password field
    req.user = await User.findById(decoded.id).select('-password');

    next(); // Call next() to proceed if the token is valid
  } catch (error) {
    console.error(error);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
};

// Admin authorization middleware (for users with role 'admin')
// export const admin = (req, res, next) => {
//   if (req.user && req.user.role === 'admin') {
//     next(); // If user is admin, proceed
//   } else {
//     res.status(403); // Forbidden error
//     throw new Error('Not authorized as an admin');
//   }
// };
