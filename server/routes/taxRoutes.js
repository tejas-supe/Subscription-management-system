const express = require('express');
const router = express.Router();
const TaxRule = require('../models/TaxRule');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List tax rules
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const taxRules = await TaxRule.find().sort({ rate: 1 }).lean();
    res.json({ success: true, count: taxRules.length, taxRules });
  } catch (err) {
    next(err);
  }
});

// Create tax rule
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, rate, description, jurisdiction, isDefault } = req.body;
    if (!name || rate === undefined) {
      return res.status(400).json({ success: false, message: 'Tax name and rate are required' });
    }

    if (isDefault) {
      await TaxRule.updateMany({}, { isDefault: false });
    }

    const taxRule = await TaxRule.create({
      name,
      rate: Number(rate),
      description: description || '',
      jurisdiction: jurisdiction || 'India GST',
      isDefault: !!isDefault,
      status: 'Active'
    });

    await recordAudit(req, {
      action: 'CREATE_TAX_RULE',
      entity: 'TaxRule',
      entityId: taxRule._id,
      details: { name, rate }
    });

    res.status(201).json({ success: true, taxRule });
  } catch (err) {
    next(err);
  }
});

// Update tax rule
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { isDefault } = req.body;
    if (isDefault) {
      await TaxRule.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    }

    const taxRule = await TaxRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!taxRule) return res.status(404).json({ success: false, message: 'Tax rule not found' });

    res.json({ success: true, taxRule });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
