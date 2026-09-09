import User, { ROLES } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// Roles a member of the public is allowed to self-register as.
// Admin is deliberately excluded — see brief Section 2 & 6.2:
// "Admin accounts should not be self-registrable through the public sign-up
// flow — they need to be created through a separate, controlled process."
const PUBLIC_REGISTERABLE_ROLES = [ROLES.SELLER, ROLES.RENTER];

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' });
    }

    const requestedRole = role || ROLES.RENTER;

    if (!PUBLIC_REGISTERABLE_ROLES.includes(requestedRole)) {
      return res.status(403).json({
        message: `Cannot self-register as "${requestedRole}". Allowed roles: ${PUBLIC_REGISTERABLE_ROLES.join(', ')}.`,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const user = await User.create({ name, email, password, role: requestedRole });
    const token = generateToken(user);

    return res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    return res.status(200).json({ token, user: user.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res) {
  // req.user is attached by the `protect` middleware.
  return res.status(200).json({ user: req.user.toSafeObject() });
}
