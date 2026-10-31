const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireRole } = require('../middleware/auth');

// List audit logs
router.get('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { entity, action, limit = 100 } = req.query;
    const query = {};

    if (entity && entity !== 'All') query.entity = entity;
    if (action && action !== 'All') query.action = action;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
