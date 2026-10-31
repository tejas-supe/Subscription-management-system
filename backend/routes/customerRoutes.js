const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Quotation = require('../models/Quotation');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireRole, verifyCustomerOwnership } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List customers with search and filters
router.get('/', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerNumber: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 }).lean();

    // Enrich with stats: active subscriptions, total revenue, unpaid invoices
    const enriched = await Promise.all(customers.map(async (c) => {
      const activeSubsCount = await Subscription.countDocuments({ customerId: c._id, status: 'Active' });
      const invoices = await Invoice.find({ customerId: c._id }).select('paidAmountInPaise outstandingAmountInPaise status').lean();

      const totalRevenuePaise = invoices.reduce((acc, inv) => acc + (inv.paidAmountInPaise || 0), 0);
      const totalOutstandingPaise = invoices.reduce((acc, inv) => acc + (inv.outstandingAmountInPaise || 0), 0);

      return {
        ...c,
        activeSubscriptionsCount: activeSubsCount,
        totalRevenueInPaise: totalRevenuePaise,
        totalOutstandingInPaise: totalOutstandingPaise
      };
    }));

    res.json({ success: true, count: enriched.length, customers: enriched });
  } catch (err) {
    next(err);
  }
});

// Get customer profile by ID
router.get('/:id', authenticateToken, verifyCustomerOwnership, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const [subscriptions, invoices, payments, quotations] = await Promise.all([
      Subscription.find({ customerId: customer._id }).populate('productId planId').sort({ createdAt: -1 }),
      Invoice.find({ customerId: customer._id }).sort({ createdAt: -1 }),
      Payment.find({ customerId: customer._id }).populate('invoiceId', 'invoiceNumber').sort({ createdAt: -1 }),
      Quotation.find({ customerId: customer._id }).sort({ createdAt: -1 })
    ]);

    const totalRevenuePaise = invoices.reduce((acc, inv) => acc + (inv.paidAmountInPaise || 0), 0);
    const totalOutstandingPaise = invoices.reduce((acc, inv) => acc + (inv.outstandingAmountInPaise || 0), 0);

    res.json({
      success: true,
      customer,
      stats: {
        totalRevenueInPaise: totalRevenuePaise,
        totalOutstandingInPaise: totalOutstandingPaise,
        subscriptionsCount: subscriptions.length,
        invoicesCount: invoices.length,
        paymentsCount: payments.length,
        quotationsCount: quotations.length
      },
      subscriptions,
      invoices,
      payments,
      quotations
    });
  } catch (err) {
    next(err);
  }
});

// Unified Customer Timeline (Differentiator 4)
router.get('/:id/timeline', authenticateToken, verifyCustomerOwnership, async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const [quotations, subscriptions, invoices, payments, auditLogs] = await Promise.all([
      Quotation.find({ customerId }).lean(),
      Subscription.find({ customerId }).populate('planId productId').lean(),
      Invoice.find({ customerId }).lean(),
      Payment.find({ customerId }).lean(),
      AuditLog.find({ entityId: customerId }).lean()
    ]);

    const events = [];

    // Quotations
    quotations.forEach(q => {
      events.push({
        id: `qt_${q._id}`,
        type: 'QUOTATION',
        timestamp: q.createdAt,
        title: `Quotation ${q.quotationNumber} (${q.status})`,
        description: `Grand total: ₹${(q.grandTotalInPaise / 100).toLocaleString('en-IN')}`,
        status: q.status,
        entityId: q._id
      });
    });

    // Subscriptions
    subscriptions.forEach(s => {
      events.push({
        id: `sub_${s._id}`,
        type: 'SUBSCRIPTION',
        timestamp: s.createdAt,
        title: `Subscription ${s.subscriptionNumber} Started`,
        description: `${s.productId?.name || 'Product'} — ${s.planId?.name || 'Plan'} (Status: ${s.status})`,
        status: s.status,
        entityId: s._id
      });
      // Also add individual subscription lifecycle events from its embedded timeline
      if (s.timeline && s.timeline.length > 0) {
        s.timeline.forEach((tl, idx) => {
          events.push({
            id: `sub_${s._id}_tl_${idx}`,
            type: 'SUBSCRIPTION_LIFECYCLE',
            timestamp: tl.timestamp,
            title: `Subscription Event: ${tl.action}`,
            description: tl.description,
            performedBy: tl.performedBy,
            entityId: s._id
          });
        });
      }
    });

    // Invoices
    invoices.forEach(inv => {
      events.push({
        id: `inv_${inv._id}`,
        type: 'INVOICE',
        timestamp: inv.createdAt,
        title: `Invoice ${inv.invoiceNumber} Issued (${inv.status})`,
        description: `Amount: ₹${(inv.totalAmountInPaise / 100).toLocaleString('en-IN')} (Due: ${new Date(inv.dueDate).toLocaleDateString()})`,
        status: inv.status,
        entityId: inv._id
      });
    });

    // Payments
    payments.forEach(p => {
      events.push({
        id: `pay_${p._id}`,
        type: 'PAYMENT',
        timestamp: p.paymentDate || p.createdAt,
        title: `Payment ${p.paymentNumber} Recorded`,
        description: `₹${(p.amountInPaise / 100).toLocaleString('en-IN')} via ${p.method} (Ref: ${p.referenceNumber}) - ${p.status}`,
        status: p.status,
        entityId: p._id
      });
    });

    // Sort chronologically descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
});

// Create customer
router.post('/', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { name, company, email, phone, billingAddress, gstNumber, currency, notes, tags } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const count = await Customer.countDocuments();
    const customerNumber = `CUST-${String(count + 1001).padStart(4, '0')}`;

    const customer = await Customer.create({
      customerNumber,
      name,
      company: company || '',
      email,
      phone: phone || '',
      billingAddress: billingAddress || {},
      gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : '',
      currency: currency || 'INR',
      status: 'Active',
      notes: notes || '',
      tags: tags || []
    });

    await recordAudit(req, {
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id,
      details: { customerNumber, name, email, company }
    });

    res.status(201).json({ success: true, customer });
  } catch (err) {
    next(err);
  }
});

// Update customer
router.put('/:id', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { name, company, email, phone, billingAddress, gstNumber, currency, status, notes, tags } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        company,
        email,
        phone,
        billingAddress,
        gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : '',
        currency,
        status,
        notes,
        tags
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await recordAudit(req, {
      action: 'UPDATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id,
      details: { customerNumber: customer.customerNumber, name }
    });

    res.json({ success: true, customer });
  } catch (err) {
    next(err);
  }
});

// Delete customer with confirmation & referential integrity guard
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Check for active subscriptions
    const activeSubs = await Subscription.countDocuments({
      customerId: customer._id,
      status: { $in: ['Active', 'Trial', 'Past Due'] }
    });

    if (activeSubs > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer: ${activeSubs} active or past due subscription(s) exist. Cancel or archive them first.`
      });
    }

    await Customer.findByIdAndDelete(customer._id);

    await recordAudit(req, {
      action: 'DELETE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id,
      details: { customerNumber: customer.customerNumber, name: customer.name }
    });

    res.json({ success: true, message: `Customer ${customer.name} deleted successfully` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
