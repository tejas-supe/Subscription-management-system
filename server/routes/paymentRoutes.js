const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List payments
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, customerId, method } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (customerId) query.customerId = customerId;
    if (method && method !== 'All') query.method = method;

    // Customer restriction
    if (req.user.role === 'CUSTOMER' && req.user.customerId) {
      query.customerId = req.user.customerId;
    }

    const payments = await Payment.find(query)
      .populate('customerId', 'name company email customerNumber')
      .populate('invoiceId', 'invoiceNumber totalAmountInPaise status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
});

// Record manual payment
router.post('/', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { invoiceId, amountInPaise, method, referenceNumber, notes, paymentDate } = req.body;

    if (!invoiceId || !amountInPaise || !method || !referenceNumber) {
      return res.status(400).json({ success: false, message: 'Invoice, amount, method, and reference number are required' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
    }

    const pAmount = Number(amountInPaise);
    if (pAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    if (pAmount > invoice.outstandingAmountInPaise) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ₹${(pAmount/100).toLocaleString('en-IN')} exceeds outstanding invoice balance of ₹${(invoice.outstandingAmountInPaise/100).toLocaleString('en-IN')}`
      });
    }

    // Generate unique payment number
    const count = await Payment.countDocuments();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const paymentNumber = `PAY-${datePrefix}-${String(count + 101).padStart(4, '0')}`;

    const payment = await Payment.create({
      paymentNumber,
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      amountInPaise: pAmount,
      method,
      referenceNumber: referenceNumber.trim(),
      status: 'Success',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes: notes || 'Manual payment recorded by staff',
      isSimulated: false,
      reconciled: true,
      reconciledAt: new Date()
    });

    // Update invoice balances
    invoice.paidAmountInPaise += pAmount;
    invoice.outstandingAmountInPaise -= pAmount;

    if (invoice.outstandingAmountInPaise === 0) {
      invoice.status = 'Paid';
      invoice.paidAt = new Date();
    } else {
      invoice.status = 'Partially Paid';
    }

    await invoice.save();

    // If invoice is linked to subscription that was 'Past Due', and is now paid, restore to 'Active'
    if (invoice.subscriptionId && invoice.status === 'Paid') {
      const sub = await Subscription.findById(invoice.subscriptionId);
      if (sub && sub.status === 'Past Due') {
        sub.status = 'Active';
        sub.timeline.push({
          action: 'RESTORED_TO_ACTIVE',
          timestamp: new Date(),
          description: `Outstanding invoice ${invoice.invoiceNumber} paid in full. Subscription returned to active status.`,
          performedBy: req.user.name
        });
        await sub.save();
      }
    }

    await recordAudit(req, {
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment._id,
      details: {
        paymentNumber,
        invoiceNumber: invoice.invoiceNumber,
        amountInPaise: pAmount,
        method,
        invoiceStatus: invoice.status
      }
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${(pAmount/100).toLocaleString('en-IN')} recorded successfully against ${invoice.invoiceNumber}`,
      payment,
      invoice
    });
  } catch (err) {
    next(err);
  }
});

// Simulated Payment Gateway (Clearly Labeled Sandbox Simulator)
router.post('/simulate-gateway', authenticateToken, async (req, res, next) => {
  try {
    const { invoiceId, method = 'UPI', simulateSuccess = true, notes } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const pAmount = invoice.outstandingAmountInPaise;
    if (pAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice has no outstanding balance' });
    }

    const count = await Payment.countDocuments();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const paymentNumber = `SIM-${datePrefix}-${String(count + 101).padStart(4, '0')}`;
    const referenceNumber = `SIM_REF_${Date.now()}`;

    if (!simulateSuccess) {
      // Record failed payment attempt
      const failedPayment = await Payment.create({
        paymentNumber,
        invoiceId: invoice._id,
        customerId: invoice.customerId,
        amountInPaise: pAmount,
        method,
        referenceNumber,
        status: 'Failed',
        paymentDate: new Date(),
        notes: notes || 'Simulated card decline / UPI timeout in sandbox environment',
        isSimulated: true,
        reconciled: false
      });

      await recordAudit(req, {
        action: 'SIMULATED_PAYMENT_FAILURE',
        entity: 'Payment',
        entityId: failedPayment._id,
        details: { invoiceNumber: invoice.invoiceNumber, reason: 'Sandbox failure trigger' }
      });

      return res.json({
        success: false,
        isSimulated: true,
        message: 'Sandbox Simulated Payment Failed (simulating customer card decline or UPI timeout)',
        payment: failedPayment
      });
    }

    // Success simulation
    const payment = await Payment.create({
      paymentNumber,
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      amountInPaise: pAmount,
      method,
      referenceNumber,
      status: 'Success',
      paymentDate: new Date(),
      notes: notes || 'Processed via Brightloop Simulated Gateway Sandbox',
      isSimulated: true,
      reconciled: true,
      reconciledAt: new Date()
    });

    invoice.paidAmountInPaise += pAmount;
    invoice.outstandingAmountInPaise = 0;
    invoice.status = 'Paid';
    invoice.paidAt = new Date();
    await invoice.save();

    if (invoice.subscriptionId) {
      const sub = await Subscription.findById(invoice.subscriptionId);
      if (sub && sub.status === 'Past Due') {
        sub.status = 'Active';
        sub.timeline.push({
          action: 'RESTORED_TO_ACTIVE',
          timestamp: new Date(),
          description: `Sandbox payment cleared invoice ${invoice.invoiceNumber}. Subscription restored to active status.`,
          performedBy: 'Simulated Gateway'
        });
        await sub.save();
      }
    }

    await recordAudit(req, {
      action: 'SIMULATED_PAYMENT_SUCCESS',
      entity: 'Payment',
      entityId: payment._id,
      details: {
        paymentNumber,
        invoiceNumber: invoice.invoiceNumber,
        amountInPaise: pAmount,
        method
      }
    });

    res.json({
      success: true,
      isSimulated: true,
      message: `[Sandbox Simulator] Payment of ₹${(pAmount/100).toLocaleString('en-IN')} completed via ${method}`,
      payment,
      invoice
    });
  } catch (err) {
    next(err);
  }
});

// Demo Refund workflow
router.post('/:id/refund', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { reason = 'Customer requested refund' } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (payment.status === 'Refunded') {
      return res.status(400).json({ success: false, message: 'Payment is already refunded' });
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Linked invoice not found' });

    payment.status = 'Refunded';
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    // Reverse payment amount on invoice
    invoice.paidAmountInPaise = Math.max(0, invoice.paidAmountInPaise - payment.amountInPaise);
    invoice.outstandingAmountInPaise += payment.amountInPaise;
    invoice.status = invoice.paidAmountInPaise === 0 ? 'Unpaid' : 'Partially Paid';
    await invoice.save();

    await recordAudit(req, {
      action: 'REFUND_PAYMENT',
      entity: 'Payment',
      entityId: payment._id,
      details: {
        paymentNumber: payment.paymentNumber,
        invoiceNumber: invoice.invoiceNumber,
        amountInPaise: payment.amountInPaise,
        reason
      }
    });

    res.json({
      success: true,
      message: `Refund of ₹${(payment.amountInPaise/100).toLocaleString('en-IN')} processed successfully for ${payment.paymentNumber}`,
      payment,
      invoice
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
