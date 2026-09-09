import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verifies the Bearer token on the request and attaches the authenticated
 * user (without the password hash) to req.user.
 */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorised: no token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: 'Not authorised: user no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorised: invalid or expired token.' });
  }
}

/**
 * Restricts a route to one or more roles. Use after `protect`.
 * Example: router.get('/admin-only', protect, authorize('admin'), handler)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role.' });
    }
    next();
  };
}
