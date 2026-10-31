const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      customerId: user.customerId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await recordAudit({ user, headers: req.headers, socket: req.socket }, {
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role }
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        avatar: user.avatar
      }
    });
  } catch (err) {
    next(err);
  }
});

// Demo Persona Switcher: Instant switch between ADMIN, STAFF, and CUSTOMER
router.post('/switch-persona', async (req, res, next) => {
  try {
    const { targetRole } = req.body; // 'ADMIN', 'STAFF', 'CUSTOMER'

    let targetUser = await User.findOne({ role: targetRole });
    if (!targetUser) {
      // Fallback: pick any user
      targetUser = await User.findOne();
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'No persona found for role ' + targetRole });
    }

    const token = generateToken(targetUser);

    res.json({
      success: true,
      token,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        customerId: targetUser.customerId,
        avatar: targetUser.avatar
      }
    });
  } catch (err) {
    next(err);
  }
});

// Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
