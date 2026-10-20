const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../lib/email');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register — role defaults to 'renter'; self-registering as
// 'admin' is blocked, admin accounts need to be created another way.
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const safeRole = ['seller', 'renter'].includes(role) ? role : 'renter';
    const user = new User({ name, email, passwordHash: password, role: safeRole });
    await user.save();

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login — single endpoint for all three roles.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password — always responds the same way whether or
// not the email matches an account, so this endpoint can't be used to
// probe which emails are registered. When it does match, emails a
// one-time reset link that expires in an hour.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const genericResponse = { message: "If an account exists for that email, we've sent a password reset link." };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.json(genericResponse);
    }

    // Only the hash is stored — a database leak alone can't be used to
    // reset anyone's password, since the raw token only ever exists in
    // the emailed link.
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password — the raw token from the emailed link,
// hashed the same way and matched against the stored hash + expiry.
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    user.passwordHash = password; // re-hashed by the pre-save hook
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password updated — you can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — re-fetch current user on page refresh.
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
