/**
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * 
 * Checks if authenticated user has required role.
 * Must be used after authenticate middleware.
 */

/**
 * Require specific role
 * @param {String} role - Required role ('customer' or 'admin')
 * @returns {Function} Express middleware
 */
const requireRole = (role) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    // Check if user has required role
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. ${role} role required.` 
      });
    }

    next();
  };
};

/**
 * Require admin role
 * Shorthand for requireRole('admin')
 */
const requireAdmin = requireRole('admin');

/**
 * Require customer role
 * Shorthand for requireRole('customer')
 */
const requireCustomer = requireRole('customer');

/**
 * Allow multiple roles
 * @param {Array<String>} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. One of these roles required: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireCustomer,
  requireAnyRole
};
