const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const { authenticateToken } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// Middleware to resolve customer from token
const resolveCustomer = async (req, res, next) => {
  try {
    let customerId = req.user.customerId;
    if (!customerId) {
      // If admin/staff testing the portal, grab the first customer
      const firstCust = await Customer.findOne();
      if (!firstCust) return res.status(404).json({ success: false, message: 'No customer account exists in database' });
      customerId = firstCust._id;
    }
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer profile not found' });
    req.customer = customer;
    next();
  } catch (err) {
    next(err);
  }
};

// Customer Portal Dashboard
router.get('/dashboard', authenticateToken, resolveCustomer, async (req, res, next) => {
  try {
    const customer = req.customer;

    // Get active subscription
    const activeSub = await Subscription.findOne({
      customerId: customer._id,
      status: { $in: ['Active', 'Trial', 'Paused', 'Past Due'] }
    })
    .populate('productId')
    .populate('planId')
    .sort({ createdAt: -1 });

    // Recent invoices
    const invoices = await Invoice.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent payments
    const payments = await Payment.find({ customerId: customer._id })
      .populate('invoiceId', 'invoiceNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    // Available plans for upgrade
    const availablePlans = await Plan.find({ status: 'Active' })
      .populate('productId', 'name code')
      .sort({ priceInPaise: 1 });

    res.json({
      success: true,
      customer,
      currentSubscription: activeSub,
      invoices,
      payments,
      availablePlans
    });
  } catch (err) {
    next(err);
  }
});

// Customer requests plan change
router.post('/request-plan-change', authenticateToken, resolveCustomer, async (req, res, next) => {
  try {
    const { targetPlanId, notes } = req.body;
    const customer = req.customer;

    const sub = await Subscription.findOne({
      customerId: customer._id,
      status: { $in: ['Active', 'Trial', 'Paused'] }
    }).populate('planId');

    if (!sub) return res.status(404).json({ success: false, message: 'No active subscription found to modify' });

    const targetPlan = await Plan.findById(targetPlanId).populate('productId');
    if (!targetPlan) return res.status(404).json({ success: false, message: 'Target plan not found' });

    sub.timeline.push({
      action: 'PORTAL_PLAN_CHANGE_REQUESTED',
      timestamp: new Date(),
      description: `Customer requested change to plan: ${targetPlan.name}. Note: ${notes || 'No note'}`,
      performedBy: `Customer (${customer.name})`
    });
    await sub.save();

    await recordAudit(req, {
      action: 'CUSTOMER_PORTAL_PLAN_CHANGE_REQUEST',
      entity: 'Subscription',
      entityId: sub._id,
      details: { customerName: customer.name, targetPlan: targetPlan.name, notes }
    });

    res.json({
      success: true,
      message: `Plan change request for ${targetPlan.name} registered. Your account executive will review and confirm.`
    });
  } catch (err) {
    next(err);
  }
});

// Customer requests cancellation
router.post('/request-cancellation', authenticateToken, resolveCustomer, async (req, res, next) => {
  try {
    const { reason = 'Customer submitted self-service cancellation request' } = req.body;
    const customer = req.customer;

    const sub = await Subscription.findOne({
      customerId: customer._id,
      status: { $in: ['Active', 'Trial', 'Paused'] }
    });

    if (!sub) return res.status(404).json({ success: false, message: 'No active subscription found to cancel' });

    sub.autoRenew = false;
    sub.cancellationReason = `Self-service request: ${reason}`;
    sub.timeline.push({
      action: 'CANCELLATION_REQUESTED',
      timestamp: new Date(),
      description: `Customer requested cancellation at period end. Reason: ${reason}`,
      performedBy: `Customer (${customer.name})`
    });
    await sub.save();

    await recordAudit(req, {
      action: 'CUSTOMER_PORTAL_CANCELLATION_REQUEST',
      entity: 'Subscription',
      entityId: sub._id,
      details: { customerName: customer.name, reason }
    });

    res.json({
      success: true,
      message: 'Subscription set to cancel at the end of the current billing period. Auto-renewal has been disabled.'
    });
  } catch (err) {
    next(err);
  }
});

// Update customer profile
router.put('/profile', authenticateToken, resolveCustomer, async (req, res, next) => {
  try {
    const { phone, billingAddress } = req.body;
    const customer = req.customer;

    if (phone) customer.phone = phone;
    if (billingAddress) {
      customer.billingAddress = {
        ...customer.billingAddress,
        ...billingAddress
      };
    }
    await customer.save();

    await recordAudit(req, {
      action: 'CUSTOMER_PORTAL_PROFILE_UPDATE',
      entity: 'Customer',
      entityId: customer._id,
      details: { customerName: customer.name }
    });

    res.json({ success: true, message: 'Billing details updated successfully', customer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
