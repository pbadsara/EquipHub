import jwt from 'jsonwebtoken';

/**
 * Signs a JWT carrying the user's id and role. The role is embedded so the
 * frontend can redirect to the correct dashboard (Admin / Seller / Renter)
 * immediately after login without an extra round trip.
 */
export function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set.');
  }

  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}
