const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { recordAudit } = require('../middleware/audit');

// Calculate next billing date based on interval
const calculateNextPeriodEnd = (startDate, interval, count = 1) => {
  const date = new Date(startDate);
  switch (interval) {
    case 'monthly':
      date.setMonth(date.getMonth() + count);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + (3 * count));
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + count);
      break;
    case 'custom':
      date.setDate(date.getDate() + (30 * count));
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
};

// Generate next recurring invoice with idempotency protection
const generateRecurringInvoice = async (subscription, req = null) => {
  // Idempotency key based on subscription and current billing period start
  const periodStartStr = new Date(subscription.currentPeriodStart).toISOString().split('T')[0];
  const idempotencyKey = `sub_${subscription._id}_period_${periodStartStr}`;

  // Check if invoice already exists for this cycle
  const existingInvoice = await Invoice.findOne({ idempotencyKey });
  if (existingInvoice) {
    return {
      created: false,
      invoice: existingInvoice,
      reason: 'Invoice for this period already exists (idempotency check passed)'
    };
  }

  // Load customer details
  const customer = await Customer.findById(subscription.customerId);
  if (!customer) {
    throw new Error(`Customer ${subscription.customerId} not found for subscription ${subscription.subscriptionNumber}`);
  }

  // Populate product & plan if needed
  await subscription.populate(['productId', 'planId']);

  const productName = subscription.productId ? subscription.productId.name : 'Subscription Service';
  const planName = subscription.planId ? subscription.planId.name : 'Plan';

  // Math in integer paise
  const quantity = subscription.quantity || 1;
  const unitPrice = subscription.unitPriceInPaise;
  const subtotal = unitPrice * quantity;
  const discountPercent = subscription.discountPercent || 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxRate = subscription.taxRate || 18; // GST
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const totalAmount = taxableAmount + taxAmount;

  // Generate unique invoice number: INV-YYYYMM-XXXX
  const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
  const countInvoices = await Invoice.countDocuments();
  const invoiceNumber = `INV-${datePrefix}-${String(countInvoices + 101).padStart(4, '0')}`;

  // Due date: Net 15 days from today
  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  const lineItems = [{
    description: `${productName} — ${planName} (${subscription.billingInterval})`,
    quantity,
    unitPriceInPaise: unitPrice,
    discountPercent,
    discountAmountInPaise: discountAmount,
    taxRate,
    taxAmountInPaise: taxAmount,
    subtotalInPaise: subtotal,
    totalAmountInPaise: totalAmount
  }];

  const newInvoice = await Invoice.create({
    invoiceNumber,
    customerId: subscription.customerId,
    subscriptionId: subscription._id,
    lineItems,
    subtotalInPaise: subtotal,
    discountTotalInPaise: discountAmount,
    taxTotalInPaise: taxAmount,
    totalAmountInPaise: totalAmount,
    paidAmountInPaise: 0,
    outstandingAmountInPaise: totalAmount,
    status: 'Unpaid',
    issueDate,
    dueDate,
    billingPeriodStart: subscription.currentPeriodStart,
    billingPeriodEnd: subscription.currentPeriodEnd,
    idempotencyKey,
    notes: `Recurring subscription billing for ${subscription.subscriptionNumber}`,
    paymentTerms: 'Net 15 days'
  });

  // Advance the subscription's next period
  const newPeriodStart = subscription.currentPeriodEnd;
  const newPeriodEnd = calculateNextPeriodEnd(newPeriodStart, subscription.billingInterval, subscription.intervalCount);

  subscription.currentPeriodStart = newPeriodStart;
  subscription.currentPeriodEnd = newPeriodEnd;
  subscription.nextBillingDate = newPeriodEnd;
  subscription.timeline.push({
    action: 'RECURRING_INVOICE_GENERATED',
    timestamp: new Date(),
    description: `Generated invoice ${invoiceNumber} for ₹${(totalAmount / 100).toLocaleString('en-IN')}`,
    performedBy: req?.user?.name || 'Automated Billing Engine',
    metadata: { invoiceNumber, invoiceId: newInvoice._id, totalAmountInPaise: totalAmount }
  });

  await subscription.save();

  if (req) {
    await recordAudit(req, {
      action: 'GENERATE_RECURRING_INVOICE',
      entity: 'Invoice',
      entityId: newInvoice._id,
      details: {
        invoiceNumber,
        subscriptionNumber: subscription.subscriptionNumber,
        totalInPaise: totalAmount
      }
    });
  }

  return {
    created: true,
    invoice: newInvoice
  };
};

// Process all due subscriptions
const processDueSubscriptions = async (req = null) => {
  const now = new Date();
  // Find active subscriptions where nextBillingDate <= now
  const dueSubscriptions = await Subscription.find({
    status: { $in: ['Active', 'Trial'] },
    nextBillingDate: { $lte: now }
  });

  const results = {
    totalChecked: dueSubscriptions.length,
    invoicesGenerated: 0,
    skipped: 0,
    errors: []
  };

  for (const sub of dueSubscriptions) {
    try {
      // If subscription was in trial and trial ended, convert status to Active
      if (sub.status === 'Trial') {
        sub.status = 'Active';
        sub.timeline.push({
          action: 'TRIAL_CONVERTED_TO_ACTIVE',
          timestamp: new Date(),
          description: 'Free trial period concluded. Switched to active billing cycle.',
          performedBy: 'Billing Engine'
        });
        await sub.save();
      }

      const outcome = await generateRecurringInvoice(sub, req);
      if (outcome.created) {
        results.invoicesGenerated++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      results.errors.push({
        subscriptionId: sub._id,
        subscriptionNumber: sub.subscriptionNumber,
        error: err.message
      });
    }
  }

  // Update overdue status on unpaid invoices whose dueDate is past
  await checkAndUpdateOverdueInvoices();

  return results;
};

// Mark invoices past due as Overdue
const checkAndUpdateOverdueInvoices = async () => {
  const now = new Date();
  const overdueInvoices = await Invoice.find({
    status: { $in: ['Unpaid', 'Partially Paid'] },
    dueDate: { $lt: now }
  });

  for (const inv of overdueInvoices) {
    inv.status = 'Overdue';
    await inv.save();

    // Also mark related subscription as Past Due if linked
    if (inv.subscriptionId) {
      await Subscription.findByIdAndUpdate(inv.subscriptionId, {
        status: 'Past Due',
        $push: {
          timeline: {
            action: 'SUBSCRIPTION_PAST_DUE',
            timestamp: new Date(),
            description: `Payment overdue for invoice ${inv.invoiceNumber}`,
            performedBy: 'System Billing Engine'
          }
        }
      });
    }
  }

  return overdueInvoices.length;
};

module.exports = {
  calculateNextPeriodEnd,
  generateRecurringInvoice,
  processDueSubscriptions,
  checkAndUpdateOverdueInvoices
};
