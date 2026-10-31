const AuditLog = require('../models/AuditLog');

const recordAudit = async (req, { action, entity, entityId, details = {} }) => {
  try {
    const user = req && req.user ? req.user : null;
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';

    // Sanitize details: remove any password or token fields
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.authorization;

    await AuditLog.create({
      userId: user ? user._id : null,
      userName: user ? user.name : 'System Worker',
      userRole: user ? user.role : 'SYSTEM',
      action,
      entity,
      entityId: entityId ? entityId.toString() : null,
      details: sanitizedDetails,
      ipAddress
    });
  } catch (err) {
    console.error('Audit log creation failed (non-fatal):', err.message);
  }
};

module.exports = { recordAudit };
