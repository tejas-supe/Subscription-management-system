const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { calculateNextPeriodEnd, generateRecurringInvoice, processDueSubscriptions } = require('../services/billingEngine');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List subscriptions
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, customerId, planId, billingInterval } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (customerId) query.customerId = customerId;
    if (planId) query.planId = planId;
    if (billingInterval && billingInterval !== 'All') query.billingInterval = billingInterval;

    // Customer role restriction
    if (req.user.role === 'CUSTOMER' && req.user.customerId) {
      query.customerId = req.user.customerId;
    }

    const subscriptions = await Subscription.find(query)
      .populate('customerId', 'name company email customerNumber')
      .populate('productId', 'name code category')
      .populate('planId', 'name code priceInPaise billingInterval')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: subscriptions.length, subscriptions });
  } catch (err) {
    next(err);
  }
});

// Get single subscription
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('customerId')
      .populate('productId')
      .populate('planId');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Customer access check
    if (req.user.role === 'CUSTOMER' && req.user.customerId && subscription.customerId._id.toString() !== req.user.customerId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Fetch linked invoices
    const invoices = await Invoice.find({ subscriptionId: subscription._id }).sort({ createdAt: -1 });

    res.json({ success: true, subscription, invoices });
  } catch (err) {
    next(err);
  }
});

// Create subscription
router.post('/', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const {
      customerId,
      planId,
      quantity = 1,
      discountPercent = 0,
      startDate = new Date(),
      isTrial = false,
      trialDays = 14
    } = req.body;

    if (!customerId || !planId) {
      return res.status(400).json({ success: false, message: 'Customer and Plan are required' });
    }

    const [customer, plan] = await Promise.all([
      Customer.findById(customerId),
      Plan.findById(planId).populate('productId')
    ]);

    if (!customer || !plan) {
      return res.status(404).json({ success: false, message: 'Customer or Plan not found' });
    }

    const sDate = new Date(startDate);
    const subCount = await Subscription.countDocuments();
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(subCount + 101).padStart(4, '0')}`;

    let status = 'Active';
    let trialStartDate = null;
    let trialEndDate = null;
    let periodStart = sDate;
    let periodEnd = calculateNextPeriodEnd(sDate, plan.billingInterval, plan.intervalCount);

    if (isTrial || plan.trialPeriodDays > 0) {
      status = 'Trial';
      const actualTrialDays = isTrial ? Number(trialDays) : plan.trialPeriodDays;
      trialStartDate = sDate;
      trialEndDate = new Date(sDate.getTime() + actualTrialDays * 24 * 60 * 60 * 1000);
      periodEnd = trialEndDate;
    }

    const subscription = await Subscription.create({
      subscriptionNumber,
      customerId,
      productId: plan.productId._id,
      planId: plan._id,
      status,
      billingInterval: plan.billingInterval,
      intervalCount: plan.intervalCount,
      quantity: Number(quantity),
      unitPriceInPaise: plan.priceInPaise,
      discountPercent: Number(discountPercent),
      taxRate: plan.defaultTaxRate || 18,
      startDate: sDate,
      trialStartDate,
      trialEndDate,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      nextBillingDate: periodEnd,
      autoRenew: true,
      timeline: [{
        action: 'SUBSCRIPTION_CREATED',
        timestamp: new Date(),
        description: `Subscription started on plan ${plan.name} (${plan.billingInterval})`,
        performedBy: req.user.name
      }]
    });

    // If not a free trial, immediately create the first invoice
    let firstInvoice = null;
    if (status !== 'Trial') {
      const result = await generateRecurringInvoice(subscription, req);
      firstInvoice = result.invoice;
    }

    await recordAudit(req, {
      action: 'CREATE_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: subscription._id,
      details: {
        subscriptionNumber,
        customerName: customer.name,
        planName: plan.name,
        status
      }
    });

    res.status(201).json({ success: true, subscription, firstInvoice });
  } catch (err) {
    next(err);
  }
});

// Pause subscription
router.post('/:id/pause', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (subscription.status !== 'Active' && subscription.status !== 'Trial') {
      return res.status(400).json({ success: false, message: `Cannot pause subscription in status: ${subscription.status}` });
    }

    subscription.status = 'Paused';
    subscription.pausedAt = new Date();
    subscription.timeline.push({
      action: 'PAUSED',
      timestamp: new Date(),
      description: 'Subscription billing temporarily paused',
      performedBy: req.user.name
    });
    await subscription.save();

    await recordAudit(req, {
      action: 'PAUSE_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: subscription._id,
      details: { subscriptionNumber: subscription.subscriptionNumber }
    });

    res.json({ success: true, message: 'Subscription paused', subscription });
  } catch (err) {
    next(err);
  }
});

// Resume subscription
router.post('/:id/resume', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (subscription.status !== 'Paused') {
      return res.status(400).json({ success: false, message: 'Subscription is not paused' });
    }

    subscription.status = 'Active';
    subscription.pausedAt = null;
    // Advance next billing date forward by days paused or refresh period
    const now = new Date();
    if (subscription.nextBillingDate < now) {
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = calculateNextPeriodEnd(now, subscription.billingInterval, subscription.intervalCount);
      subscription.nextBillingDate = subscription.currentPeriodEnd;
    }

    subscription.timeline.push({
      action: 'RESUMED',
      timestamp: new Date(),
      description: 'Subscription resumed to active recurring status',
      performedBy: req.user.name
    });
    await subscription.save();

    await recordAudit(req, {
      action: 'RESUME_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: subscription._id,
      details: { subscriptionNumber: subscription.subscriptionNumber }
    });

    res.json({ success: true, message: 'Subscription resumed', subscription });
  } catch (err) {
    next(err);
  }
});

// Upgrade / Downgrade Plan
router.post('/:id/change-plan', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { newPlanId } = req.body;
    if (!newPlanId) return res.status(400).json({ success: false, message: 'New Plan ID is required' });

    const subscription = await Subscription.findById(req.params.id).populate('planId');
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const targetPlan = await Plan.findById(newPlanId).populate('productId');
    if (!targetPlan) return res.status(404).json({ success: false, message: 'Target Plan not found' });

    const isUpgrade = targetPlan.priceInPaise > subscription.unitPriceInPaise;
    const actionType = isUpgrade ? 'UPGRADED' : 'DOWNGRADED';

    const oldPlanName = subscription.planId.name;
    subscription.planId = targetPlan._id;
    subscription.productId = targetPlan.productId._id;
    subscription.billingInterval = targetPlan.billingInterval;
    subscription.intervalCount = targetPlan.intervalCount;
    subscription.unitPriceInPaise = targetPlan.priceInPaise;
    subscription.taxRate = targetPlan.defaultTaxRate || 18;

    subscription.timeline.push({
      action: actionType,
      timestamp: new Date(),
      description: `Plan changed from ${oldPlanName} to ${targetPlan.name} (₹${(targetPlan.priceInPaise/100).toLocaleString('en-IN')}/${targetPlan.billingInterval})`,
      performedBy: req.user.name,
      metadata: { oldPlan: oldPlanName, newPlan: targetPlan.name }
    });

    await subscription.save();

    await recordAudit(req, {
      action: `${actionType}_SUBSCRIPTION`,
      entity: 'Subscription',
      entityId: subscription._id,
      details: {
        subscriptionNumber: subscription.subscriptionNumber,
        fromPlan: oldPlanName,
        toPlan: targetPlan.name
      }
    });

    res.json({ success: true, message: `Subscription plan ${actionType.toLowerCase()} to ${targetPlan.name}`, subscription });
  } catch (err) {
    next(err);
  }
});

// Cancel subscription
router.post('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const { reason = 'Customer requested cancellation' } = req.body;
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    // Customer security check
    if (req.user.role === 'CUSTOMER' && req.user.customerId && subscription.customerId.toString() !== req.user.customerId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    subscription.status = 'Cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;
    subscription.autoRenew = false;
    subscription.timeline.push({
      action: 'CANCELLED',
      timestamp: new Date(),
      description: `Subscription cancelled. Reason: ${reason}`,
      performedBy: req.user.name
    });
    await subscription.save();

    await recordAudit(req, {
      action: 'CANCEL_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: subscription._id,
      details: { subscriptionNumber: subscription.subscriptionNumber, reason }
    });

    res.json({ success: true, message: 'Subscription cancelled successfully', subscription });
  } catch (err) {
    next(err);
  }
});

// Renew subscription manually
router.post('/:id/renew', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const result = await generateRecurringInvoice(subscription, req);

    res.json({
      success: true,
      message: result.created ? 'Subscription renewed and new invoice generated' : result.reason,
      invoice: result.invoice,
      subscription
    });
  } catch (err) {
    next(err);
  }
});

// Trigger background recurring billing engine batch run
router.post('/run-billing-cycle', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const results = await processDueSubscriptions(req);
    res.json({
      success: true,
      message: `Billing engine executed. Invoices generated: ${results.invoicesGenerated}, Skipped: ${results.skipped}`,
      results
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
