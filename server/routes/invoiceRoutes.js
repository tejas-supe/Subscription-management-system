const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List invoices
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, customerId, search } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (customerId) query.customerId = customerId;

    // Customer role restriction
    if (req.user.role === 'CUSTOMER' && req.user.customerId) {
      query.customerId = req.user.customerId;
    }

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const invoices = await Invoice.find(query)
      .populate('customerId', 'name company email customerNumber')
      .populate('subscriptionId', 'subscriptionNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: invoices.length, invoices });
  } catch (err) {
    next(err);
  }
});

// Get single invoice with payment records
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate({
        path: 'subscriptionId',
        populate: { path: 'productId planId' }
      });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Customer security check
    if (req.user.role === 'CUSTOMER' && req.user.customerId && invoice.customerId._id.toString() !== req.user.customerId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: -1 });

    res.json({ success: true, invoice, payments });
  } catch (err) {
    next(err);
  }
});

// Create manual invoice
router.post('/', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { customerId, lineItems, dueDate, notes, paymentTerms } = req.body;

    if (!customerId || !lineItems || !lineItems.length) {
      return res.status(400).json({ success: false, message: 'Customer and at least one line item are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    let subtotalInPaise = 0;
    let discountTotalInPaise = 0;
    let taxTotalInPaise = 0;

    const processedLines = lineItems.map(item => {
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
        description: item.description,
        quantity,
        unitPriceInPaise: unitPrice,
        discountPercent,
        discountAmountInPaise: discountAmount,
        taxRate,
        taxAmountInPaise: taxAmount,
        subtotalInPaise: subtotal,
        totalAmountInPaise: totalAmount
      };
    });

    const totalAmountInPaise = (subtotalInPaise - discountTotalInPaise) + taxTotalInPaise;

    const count = await Invoice.countDocuments();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const invoiceNumber = `INV-${datePrefix}-${String(count + 101).padStart(4, '0')}`;

    const invDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      invoiceNumber,
      customerId,
      lineItems: processedLines,
      subtotalInPaise,
      discountTotalInPaise,
      taxTotalInPaise,
      totalAmountInPaise,
      paidAmountInPaise: 0,
      outstandingAmountInPaise: totalAmountInPaise,
      status: 'Unpaid',
      issueDate: new Date(),
      dueDate: invDueDate,
      notes: notes || 'Invoice generated manually.',
      paymentTerms: paymentTerms || 'Net 15 days'
    });

    await recordAudit(req, {
      action: 'CREATE_MANUAL_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id,
      details: { invoiceNumber, totalAmountInPaise }
    });

    res.status(201).json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
});

// Void invoice
router.post('/:id/void', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.paidAmountInPaise > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot void invoice with recorded payments. Refund or unlink payments first.'
      });
    }

    invoice.status = 'Void';
    await invoice.save();

    await recordAudit(req, {
      action: 'VOID_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id,
      details: { invoiceNumber: invoice.invoiceNumber }
    });

    res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} has been marked Void`, invoice });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
