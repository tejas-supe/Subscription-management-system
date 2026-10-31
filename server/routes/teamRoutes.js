const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List team members
router.get('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

// Create new team member
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, password, role = 'STAFF' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      status: 'Active'
    });

    await recordAudit(req, {
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      details: { name: user.name, email: user.email, role: user.role }
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// Update role / status
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { role, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (role) user.role = role;
    if (status) user.status = status;
    await user.save();

    await recordAudit(req, {
      action: 'UPDATE_USER_ROLE',
      entity: 'User',
      entityId: user._id,
      details: { name: user.name, newRole: role, status }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
