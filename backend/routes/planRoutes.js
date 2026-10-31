const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const Product = require('../models/Product');
const Subscription = require('../models/Subscription');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List plans
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { productId, status, billingInterval } = req.query;
    const query = {};
    if (productId) query.productId = productId;
    if (status && status !== 'All') query.status = status;
    if (billingInterval && billingInterval !== 'All') query.billingInterval = billingInterval;

    const plans = await Plan.find(query).populate('productId', 'name code category').sort({ priceInPaise: 1 }).lean();

    // Enrich with active subscribers count
    const enriched = await Promise.all(plans.map(async (p) => {
      const activeSubs = await Subscription.countDocuments({ planId: p._id, status: 'Active' });
      return {
        ...p,
        activeSubscribersCount: activeSubs
      };
    }));

    res.json({ success: true, count: enriched.length, plans: enriched });
  } catch (err) {
    next(err);
  }
});

// Compare plans matrix
router.get('/comparison-matrix', authenticateToken, async (req, res, next) => {
  try {
    const { productId } = req.query;
    const query = { status: 'Active' };
    if (productId) query.productId = productId;

    const plans = await Plan.find(query).populate('productId', 'name code').sort({ priceInPaise: 1 }).lean();

    // Extract all unique feature bullet names
    const allFeatureKeys = new Set();
    plans.forEach(p => {
      if (p.comparisonBullets) {
        p.comparisonBullets.forEach(b => allFeatureKeys.add(b.feature));
      }
    });

    res.json({
      success: true,
      plans,
      featureMatrix: Array.from(allFeatureKeys)
    });
  } catch (err) {
    next(err);
  }
});

// Create plan
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const {
      productId,
      name,
      code,
      description,
      billingInterval,
      intervalCount,
      priceInPaise,
      trialPeriodDays,
      setupFeeInPaise,
      isOneTime,
      features,
      comparisonBullets,
      defaultTaxRate
    } = req.body;

    if (!productId || !name || !code || priceInPaise === undefined) {
      return res.status(400).json({ success: false, message: 'Product, name, code, and price are required' });
    }

    const plan = await Plan.create({
      productId,
      name,
      code: code.trim().toUpperCase(),
      description: description || '',
      billingInterval: billingInterval || 'monthly',
      intervalCount: intervalCount || 1,
      priceInPaise: Number(priceInPaise),
      trialPeriodDays: Number(trialPeriodDays) || 0,
      setupFeeInPaise: Number(setupFeeInPaise) || 0,
      isOneTime: !!isOneTime,
      features: features || [],
      comparisonBullets: comparisonBullets || [],
      defaultTaxRate: defaultTaxRate !== undefined ? Number(defaultTaxRate) : 18,
      status: 'Active'
    });

    await recordAudit(req, {
      action: 'CREATE_PLAN',
      entity: 'Plan',
      entityId: plan._id,
      details: { name: plan.name, code: plan.code, priceInPaise: plan.priceInPaise }
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

// Update plan
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    await recordAudit(req, {
      action: 'UPDATE_PLAN',
      entity: 'Plan',
      entityId: plan._id,
      details: { name: plan.name, status: plan.status, priceInPaise: plan.priceInPaise }
    });

    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

// Delete / Deactivate plan
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const activeSubs = await Subscription.countDocuments({ planId: plan._id, status: 'Active' });
    if (activeSubs > 0) {
      plan.status = 'Inactive';
      await plan.save();
      await recordAudit(req, {
        action: 'DEACTIVATE_PLAN',
        entity: 'Plan',
        entityId: plan._id,
        details: { name: plan.name, activeSubscribers: activeSubs }
      });
      return res.json({
        success: true,
        message: `Plan deactivated instead of deleted because ${activeSubs} active subscription(s) use it.`,
        plan
      });
    }

    await Plan.findByIdAndDelete(plan._id);
    await recordAudit(req, {
      action: 'DELETE_PLAN',
      entity: 'Plan',
      entityId: plan._id,
      details: { name: plan.name }
    });
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
