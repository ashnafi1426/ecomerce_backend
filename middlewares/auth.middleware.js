/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Verifies JWT token and attaches user info to request object.
 * Protects routes that require authentication.
 */

const { verifyToken } = require('../config/jwt');
const userService = require('../services/userServices/user.service');

/**
 * Authenticate user by verifying JWT token
 * 
 * Expects token in Authorization header: "Bearer <token>"
 * Attaches user object to req.user if valid
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await userService.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not found' 
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Account is not active' 
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token expired' 
      });
    }

    next(error);
  }
};

module.exports = authenticate;
