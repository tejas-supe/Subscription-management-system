const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List discounts
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: discounts.length, discounts });
  } catch (err) {
    next(err);
  }
});

// Validate discount code
router.post('/validate', authenticateToken, async (req, res, next) => {
  try {
    const { code, amountInPaise, customerId } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required' });
    }

    const discount = await Discount.findOne({
      code: code.trim().toUpperCase(),
      status: 'Active'
    });

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    const now = new Date();
    if (now < new Date(discount.validFrom) || now > new Date(discount.validUntil)) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired or is not yet active' });
    }

    if (discount.maxRedemptions && discount.currentRedemptions >= discount.maxRedemptions) {
      return res.status(400).json({ success: false, message: 'Coupon redemption limit reached' });
    }

    const purchaseAmount = Number(amountInPaise) || 0;
    if (discount.minPurchaseInPaise && purchaseAmount < discount.minPurchaseInPaise) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${(discount.minPurchaseInPaise / 100).toLocaleString('en-IN')} required for this coupon`
      });
    }

    // Calculate discount amount in paise
    let calculatedDiscountPaise = 0;
    if (discount.type === 'percentage') {
      calculatedDiscountPaise = Math.round((purchaseAmount * discount.value) / 100);
      if (discount.maxDiscountInPaise && calculatedDiscountPaise > discount.maxDiscountInPaise) {
        calculatedDiscountPaise = discount.maxDiscountInPaise;
      }
    } else {
      calculatedDiscountPaise = Math.min(purchaseAmount, discount.value);
    }

    res.json({
      success: true,
      valid: true,
      discount: {
        code: discount.code,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        calculatedDiscountPaise
      }
    });
  } catch (err) {
    next(err);
  }
});

// Create discount
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minPurchaseInPaise = 0,
      maxDiscountInPaise = null,
      validFrom = new Date(),
      validUntil,
      maxRedemptions = 100,
      perCustomerLimit = 1
    } = req.body;

    if (!code || !description || !type || value === undefined || !validUntil) {
      return res.status(400).json({ success: false, message: 'Code, description, type, value, and validUntil are required' });
    }

    const discount = await Discount.create({
      code: code.trim().toUpperCase(),
      description,
      type,
      value: Number(value),
      minPurchaseInPaise: Number(minPurchaseInPaise),
      maxDiscountInPaise: maxDiscountInPaise ? Number(maxDiscountInPaise) : null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      maxRedemptions: Number(maxRedemptions),
      perCustomerLimit: Number(perCustomerLimit),
      status: 'Active'
    });

    await recordAudit(req, {
      action: 'CREATE_DISCOUNT',
      entity: 'Discount',
      entityId: discount._id,
      details: { code: discount.code, type: discount.type, value: discount.value }
    });

    res.status(201).json({ success: true, discount });
  } catch (err) {
    next(err);
  }
});

// Toggle or update discount
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found' });

    await recordAudit(req, {
      action: 'UPDATE_DISCOUNT',
      entity: 'Discount',
      entityId: discount._id,
      details: { code: discount.code, status: discount.status }
    });

    res.json({ success: true, discount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
