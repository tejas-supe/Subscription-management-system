const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

// 1. Subscription Health Monitor
const getSubscriptionHealth = async () => {
  const subscriptions = await Subscription.find()
    .populate('customerId', 'name company email')
    .populate('productId', 'name')
    .populate('planId', 'name billingInterval priceInPaise')
    .lean();

  const overdueInvoices = await Invoice.find({ status: 'Overdue' }).select('subscriptionId customerId outstandingAmountInPaise').lean();
  const overdueSubIds = new Set(overdueInvoices.map(i => i.subscriptionId?.toString()).filter(Boolean));

  const failedPayments = await Payment.find({ status: 'Failed' })
    .populate('invoiceId', 'subscriptionId customerId invoiceNumber')
    .lean();
  const failedPaymentSubIds = new Set(failedPayments.map(p => p.invoiceId?.subscriptionId?.toString()).filter(Boolean));

  const healthList = subscriptions.map(sub => {
    let healthScore = 100;
    const issues = [];

    // Check failed payments
    if (failedPaymentSubIds.has(sub._id.toString())) {
      healthScore -= 40;
      issues.push('Recent failed payment recorded');
    }

    // Check overdue invoice
    if (overdueSubIds.has(sub._id.toString()) || sub.status === 'Past Due') {
      healthScore -= 35;
      issues.push('Overdue unpaid invoice outstanding');
    }

    // Check paused
    if (sub.status === 'Paused') {
      healthScore -= 20;
      issues.push('Subscription paused by customer or admin');
    }

    // Check trial expiring within 3 days
    if (sub.status === 'Trial' && sub.trialEndDate) {
      const daysLeft = Math.ceil((new Date(sub.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && daysLeft >= 0) {
        healthScore -= 10;
        issues.push(`Free trial expiring in ${daysLeft} days`);
      } else if (daysLeft < 0) {
        healthScore -= 30;
        issues.push('Free trial has expired');
      }
    }

    // Determine status badge
    let healthTier = 'Healthy';
    if (healthScore < 50 || sub.status === 'Past Due' || sub.status === 'Cancelled') {
      healthTier = 'Critical';
    } else if (healthScore < 80 || sub.status === 'Paused') {
      healthTier = 'At Risk';
    }

    return {
      _id: sub._id,
      subscriptionNumber: sub.subscriptionNumber,
      customer: sub.customerId,
      product: sub.productId,
      plan: sub.planId,
      status: sub.status,
      nextBillingDate: sub.nextBillingDate,
      healthScore: Math.max(0, healthScore),
      healthTier,
      issues
    };
  });

  const summary = {
    total: subscriptions.length,
    healthy: healthList.filter(h => h.healthTier === 'Healthy').length,
    atRisk: healthList.filter(h => h.healthTier === 'At Risk').length,
    critical: healthList.filter(h => h.healthTier === 'Critical').length
  };

  return { summary, subscriptions: healthList };
};

// 2. Smart Renewal Center (Next 7, 15, 30 days)
const getSmartRenewals = async () => {
  const now = new Date();
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const day15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const activeSubs = await Subscription.find({
    status: { $in: ['Active', 'Trial'] },
    nextBillingDate: { $gte: now, $lte: day30 }
  })
  .populate('customerId', 'name company email phone')
  .populate('productId', 'name')
  .populate('planId', 'name billingInterval priceInPaise')
  .sort({ nextBillingDate: 1 })
  .lean();

  const window7Days = [];
  const window15Days = [];
  const window30Days = [];

  let totalRenewalsValue7d = 0;
  let totalRenewalsValue15d = 0;
  let totalRenewalsValue30d = 0;

  activeSubs.forEach(sub => {
    const nextDate = new Date(sub.nextBillingDate);
    const amount = (sub.unitPriceInPaise * (sub.quantity || 1));

    if (nextDate <= day7) {
      window7Days.push(sub);
      totalRenewalsValue7d += amount;
    }
    if (nextDate <= day15) {
      window15Days.push(sub);
      totalRenewalsValue15d += amount;
    }
    if (nextDate <= day30) {
      window30Days.push(sub);
      totalRenewalsValue30d += amount;
    }
  });

  return {
    window7Days,
    window15Days,
    window30Days,
    metrics: {
      count7d: window7Days.length,
      value7dPaise: totalRenewalsValue7d,
      count15d: window15Days.length,
      value15dPaise: totalRenewalsValue15d,
      count30d: window30Days.length,
      value30dPaise: totalRenewalsValue30d
    }
  };
};

// 3. Revenue Leakage & Intelligence Alerts
const getRevenueIntelligence = async () => {
  const overdueInvoices = await Invoice.find({ status: 'Overdue' })
    .populate('customerId', 'name company email')
    .lean();

  const totalOverduePaise = overdueInvoices.reduce((acc, inv) => acc + inv.outstandingAmountInPaise, 0);

  const failedPayments = await Payment.find({ status: 'Failed' })
    .populate('customerId', 'name company email')
    .populate('invoiceId', 'invoiceNumber')
    .lean();

  const totalFailedPaymentsPaise = failedPayments.reduce((acc, p) => acc + p.amountInPaise, 0);

  const pausedSubs = await Subscription.find({ status: 'Paused' })
    .populate('customerId', 'name company')
    .lean();

  const totalPausedMRRPaise = pausedSubs.reduce((acc, s) => {
    // Normalise to monthly
    let monthly = s.unitPriceInPaise * (s.quantity || 1);
    if (s.billingInterval === 'yearly') monthly = Math.round(monthly / 12);
    if (s.billingInterval === 'quarterly') monthly = Math.round(monthly / 3);
    return acc + monthly;
  }, 0);

  // Generate actionable intelligence insights
  const insights = [];

  if (totalOverduePaise > 0) {
    insights.push({
      id: 'leakage-overdue',
      type: 'warning',
      category: 'Revenue Leakage',
      title: `${overdueInvoices.length} Overdue Invoices Requiring Immediate Action`,
      description: `₹${(totalOverduePaise / 100).toLocaleString('en-IN')} is locked in unpaid invoices past their payment terms. Recommend triggering payment dunning notices.`,
      impactPaise: totalOverduePaise,
      count: overdueInvoices.length
    });
  }

  if (failedPayments.length > 0) {
    insights.push({
      id: 'leakage-failed-payments',
      type: 'danger',
      category: 'Payment Friction',
      title: `${failedPayments.length} Failed Payment Attempts Recorded`,
      description: `₹${(totalFailedPaymentsPaise / 100).toLocaleString('en-IN')} could not be collected due to gateway card decline or UPI timeout. Requires retry verification.`,
      impactPaise: totalFailedPaymentsPaise,
      count: failedPayments.length
    });
  }

  if (pausedSubs.length > 0) {
    insights.push({
      id: 'churn-paused',
      type: 'info',
      category: 'Churn Risk',
      title: `${pausedSubs.length} Paused Subscriptions with Dormant MRR`,
      description: `Paused accounts represent ₹${(totalPausedMRRPaise / 100).toLocaleString('en-IN')}/mo in dormant MRR. Reach out to re-engage these accounts.`,
      impactPaise: totalPausedMRRPaise * 12, // annualized
      count: pausedSubs.length
    });
  }

  return {
    summary: {
      totalLeakagePaise: totalOverduePaise + totalFailedPaymentsPaise,
      overdueCount: overdueInvoices.length,
      failedPaymentsCount: failedPayments.length,
      pausedSubsCount: pausedSubs.length,
      pausedMRRPaise: totalPausedMRRPaise
    },
    overdueInvoices,
    failedPayments,
    insights
  };
};

// 4. Financial Reconciliation Engine
const getFinancialReconciliation = async () => {
  const invoices = await Invoice.find().populate('customerId', 'name company').lean();
  const payments = await Payment.find().populate('customerId', 'name company').populate('invoiceId', 'invoiceNumber').lean();

  const totalInvoicedPaise = invoices.reduce((acc, i) => acc + i.totalAmountInPaise, 0);
  const totalPaidInvoicesPaise = invoices.reduce((acc, i) => acc + (i.paidAmountInPaise || 0), 0);
  const totalRecordedPaymentsPaise = payments
    .filter(p => p.status === 'Success')
    .reduce((acc, p) => acc + p.amountInPaise, 0);

  // Identify discrepancies
  const fullyPaidCount = invoices.filter(i => i.status === 'Paid').length;
  const partiallyPaidInvoices = invoices.filter(i => i.status === 'Partially Paid');
  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue');

  const discrepancyPaise = Math.abs(totalPaidInvoicesPaise - totalRecordedPaymentsPaise);

  return {
    metrics: {
      totalInvoicedPaise,
      totalPaidInvoicesPaise,
      totalRecordedPaymentsPaise,
      discrepancyPaise,
      isBalanced: discrepancyPaise === 0,
      fullyPaidCount,
      partiallyPaidCount: partiallyPaidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      collectionRatePercent: totalInvoicedPaise > 0 ? Math.round((totalPaidInvoicesPaise / totalInvoicedPaise) * 100) : 100
    },
    partiallyPaidInvoices,
    unreconciledPayments: payments.filter(p => !p.reconciled)
  };
};

module.exports = {
  getSubscriptionHealth,
  getSmartRenewals,
  getRevenueIntelligence,
  getFinancialReconciliation
};
