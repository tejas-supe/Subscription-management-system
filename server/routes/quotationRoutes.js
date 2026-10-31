const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Plan = require('../models/Plan');
const { calculateNextPeriodEnd } = require('../services/billingEngine');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List quotations
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (customerId) query.customerId = customerId;

    // If customer role, only see own quotations
    if (req.user.role === 'CUSTOMER' && req.user.customerId) {
      query.customerId = req.user.customerId;
    }

    const quotations = await Quotation.find(query)
      .populate('customerId', 'name company email phone')
      .populate('lineItems.productId', 'name code')
      .populate('lineItems.planId', 'name billingInterval priceInPaise')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: quotations.length, quotations });
  } catch (err) {
    next(err);
  }
});

// Get single quotation
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customerId')
      .populate('lineItems.productId')
      .populate('lineItems.planId');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Customer security check
    if (req.user.role === 'CUSTOMER' && req.user.customerId && quotation.customerId._id.toString() !== req.user.customerId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
    }

    res.json({ success: true, quotation });
  } catch (err) {
    next(err);
  }
});

// Create quotation
router.post('/', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { customerId, lineItems, couponCode, expiryDays = 30, notes, terms } = req.body;

    if (!customerId || !lineItems || !lineItems.length) {
      return res.status(400).json({ success: false, message: 'Customer and at least one line item are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Calculate line items math in integer paise
    let subtotalInPaise = 0;
    let discountTotalInPaise = 0;
    let taxTotalInPaise = 0;

    const processedLineItems = lineItems.map(item => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.unitPriceInPaise);
      const subtotal = quantity * unitPrice;
      const discountPercent = Number(item.discountPercent) || 0;
      const discountAmount = Math.round((subtotal * discountPercent) / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : 18;
      const taxAmount = Math.round((taxableAmount * taxRate) / 100);
      const totalAmount = taxableAmount + taxAmount;

      subtotalInPaise += subtotal;
      discountTotalInPaise += discountAmount;
      taxTotalInPaise += taxAmount;

      return {
        productId: item.productId,
        planId: item.planId,
        description: item.description,
        quantity,
        unitPriceInPaise: unitPrice,
        discountPercent,
        taxRate,
        subtotalInPaise: subtotal,
        discountAmountInPaise: discountAmount,
        taxAmountInPaise: taxAmount,
        totalAmountInPaise: totalAmount
      };
    });

    const grandTotalInPaise = (subtotalInPaise - discountTotalInPaise) + taxTotalInPaise;

    // Generate unique Quotation Number: QT-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await Quotation.countDocuments();
    const quotationNumber = `QT-${year}-${String(count + 101).padStart(4, '0')}`;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(expiryDays));

    const quotation = await Quotation.create({
      quotationNumber,
      customerId,
      lineItems: processedLineItems,
      subtotalInPaise,
      discountTotalInPaise,
      couponCode: couponCode || null,
      taxTotalInPaise,
      grandTotalInPaise,
      status: 'Draft',
      expiryDate,
      notes: notes || 'Thank you for considering Brightloop enterprise solutions.',
      terms: terms || 'Pricing valid for 30 days. GST invoiced as applicable.'
    });

    await recordAudit(req, {
      action: 'CREATE_QUOTATION',
      entity: 'Quotation',
      entityId: quotation._id,
      details: { quotationNumber, customerId, grandTotalInPaise }
    });

    res.status(201).json({ success: true, quotation });
  } catch (err) {
    next(err);
  }
});

// Send quotation (safe demo email workflow)
router.post('/:id/send', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customerId');
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    quotation.status = 'Sent';
    quotation.sentAt = new Date();
    quotation.sentToEmail = quotation.customerId.email;
    await quotation.save();

    await recordAudit(req, {
      action: 'SEND_QUOTATION',
      entity: 'Quotation',
      entityId: quotation._id,
      details: { quotationNumber: quotation.quotationNumber, sentTo: quotation.customerId.email }
    });

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} dispatched to ${quotation.customerId.email} (Demo Email Dispatch Simulator verified).`,
      quotation
    });
  } catch (err) {
    next(err);
  }
});

// Accept quotation
router.post('/:id/accept', authenticateToken, async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (quotation.status === 'Converted') {
      return res.status(400).json({ success: false, message: 'Quotation has already been converted to an active subscription' });
    }

    quotation.status = 'Accepted';
    await quotation.save();

    await recordAudit(req, {
      action: 'ACCEPT_QUOTATION',
      entity: 'Quotation',
      entityId: quotation._id,
      details: { quotationNumber: quotation.quotationNumber }
    });

    res.json({ success: true, message: `Quotation ${quotation.quotationNumber} marked as Accepted`, quotation });
  } catch (err) {
    next(err);
  }
});

// Reject quotation
router.post('/:id/reject', authenticateToken, async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    quotation.status = 'Rejected';
    await quotation.save();

    await recordAudit(req, {
      action: 'REJECT_QUOTATION',
      entity: 'Quotation',
      entityId: quotation._id,
      details: { quotationNumber: quotation.quotationNumber }
    });

    res.json({ success: true, message: `Quotation ${quotation.quotationNumber} marked as Rejected`, quotation });
  } catch (err) {
    next(err);
  }
});

// Convert accepted quotation into subscription (Section 8 requirement with idempotency / duplicate prevention!)
router.post('/:id/convert', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customerId')
      .populate('lineItems.productId')
      .populate('lineItems.planId');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Critical duplicate prevention: If already converted, return existing subscription
    if (quotation.status === 'Converted' && quotation.convertedSubscriptionId) {
      const existingSub = await Subscription.findById(quotation.convertedSubscriptionId);
      return res.status(200).json({
        success: true,
        alreadyConverted: true,
        message: `Quotation ${quotation.quotationNumber} was already converted. Returned existing subscription to prevent duplicates.`,
        subscription: existingSub,
        quotation
      });
    }

    if (quotation.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Cannot convert a rejected quotation. Mark it as accepted first.' });
    }

    // Primary item for subscription
    const primaryItem = quotation.lineItems[0];
    if (!primaryItem || !primaryItem.planId) {
      return res.status(400).json({ success: false, message: 'Quotation contains no valid plan line item to subscribe' });
    }

    const plan = await Plan.findById(primaryItem.planId);
    const startDate = new Date();
    const billingInterval = plan.billingInterval || 'monthly';
    const intervalCount = plan.intervalCount || 1;
    const currentPeriodEnd = calculateNextPeriodEnd(startDate, billingInterval, intervalCount);

    // Generate Subscription Number: SUB-YYYY-XXXX
    const subCount = await Subscription.countDocuments();
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(subCount + 101).padStart(4, '0')}`;

    // Create Subscription
    const subscription = await Subscription.create({
      subscriptionNumber,
      customerId: quotation.customerId._id,
      productId: primaryItem.productId._id,
      planId: primaryItem.planId._id,
      quotationId: quotation._id,
      status: 'Active',
      billingInterval,
      intervalCount,
      quantity: primaryItem.quantity || 1,
      unitPriceInPaise: primaryItem.unitPriceInPaise,
      discountPercent: primaryItem.discountPercent || 0,
      taxRate: primaryItem.taxRate || 18,
      startDate,
      currentPeriodStart: startDate,
      currentPeriodEnd,
      nextBillingDate: currentPeriodEnd,
      autoRenew: true,
      timeline: [{
        action: 'CREATED_FROM_QUOTATION',
        timestamp: new Date(),
        description: `Subscription converted from accepted Quotation ${quotation.quotationNumber}`,
        performedBy: req.user.name,
        metadata: { quotationNumber: quotation.quotationNumber }
      }]
    });

    // Generate initial Invoice corresponding to quotation conversion
    const invCount = await Invoice.countDocuments();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const invoiceNumber = `INV-${datePrefix}-${String(invCount + 101).padStart(4, '0')}`;

    const invoiceDueDate = new Date();
    invoiceDueDate.setDate(invoiceDueDate.getDate() + 15);

    const invoice = await Invoice.create({
      invoiceNumber,
      customerId: quotation.customerId._id,
      subscriptionId: subscription._id,
      quotationId: quotation._id,
      lineItems: quotation.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceInPaise: item.unitPriceInPaise,
        discountPercent: item.discountPercent,
        discountAmountInPaise: item.discountAmountInPaise,
        taxRate: item.taxRate,
        taxAmountInPaise: item.taxAmountInPaise,
        subtotalInPaise: item.subtotalInPaise,
        totalAmountInPaise: item.totalAmountInPaise
      })),
      subtotalInPaise: quotation.subtotalInPaise,
      discountTotalInPaise: quotation.discountTotalInPaise,
      taxTotalInPaise: quotation.taxTotalInPaise,
      totalAmountInPaise: quotation.grandTotalInPaise,
      paidAmountInPaise: 0,
      outstandingAmountInPaise: quotation.grandTotalInPaise,
      status: 'Unpaid',
      issueDate: startDate,
      dueDate: invoiceDueDate,
      billingPeriodStart: startDate,
      billingPeriodEnd: currentPeriodEnd,
      idempotencyKey: `quotation_${quotation._id}_convert`,
      notes: `Generated upon quotation conversion: ${quotation.quotationNumber}`,
      paymentTerms: 'Net 15 days'
    });

    // Update quotation status and link
    quotation.status = 'Converted';
    quotation.convertedSubscriptionId = subscription._id;
    quotation.convertedAt = new Date();
    await quotation.save();

    await recordAudit(req, {
      action: 'CONVERT_QUOTATION_TO_SUBSCRIPTION',
      entity: 'Quotation',
      entityId: quotation._id,
      details: {
        quotationNumber: quotation.quotationNumber,
        subscriptionNumber: subscription.subscriptionNumber,
        invoiceNumber: invoice.invoiceNumber
      }
    });

    res.status(201).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to Subscription ${subscription.subscriptionNumber} and Invoice ${invoice.invoiceNumber}`,
      subscription,
      invoice,
      quotation
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
