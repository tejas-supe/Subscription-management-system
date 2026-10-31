const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Quotation = require('../models/Quotation');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Discount = require('../models/Discount');
const TaxRule = require('../models/TaxRule');
const AuditLog = require('../models/AuditLog');

const seedAll = async () => {
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Plan.deleteMany({}),
    Quotation.deleteMany({}),
    Subscription.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    Discount.deleteMany({}),
    TaxRule.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[Seed] Seeding Tax Rules...');
  const taxRules = await TaxRule.insertMany([
    { name: 'GST Exemption (0%)', rate: 0, description: 'Zero rated export / special economic zone', isDefault: false },
    { name: 'Concessional GST (5%)', rate: 5, description: 'Essential technology services', isDefault: false },
    { name: 'Reduced GST (12%)', rate: 12, description: 'Standard hardware & embedded solutions', isDefault: false },
    { name: 'Standard SaaS GST (18%)', rate: 18, description: 'Standard Indian GST rate for Cloud & Software services', isDefault: true },
    { name: 'Premium / Luxury GST (28%)', rate: 28, description: 'High-end telecommunications & specialized services', isDefault: false }
  ]);

  console.log('[Seed] Seeding 15 Enterprise Indian Customers...');
  const customersData = [
    { customerNumber: 'CUST-1001', name: 'Arun Nair', company: 'Vertex Media Technologies Pvt Ltd', email: 'arun.nair@vertexmedia.in', phone: '+91 98450 12345', billingAddress: { line1: '45, Embassy Golf Links', city: 'Bengaluru', state: 'Karnataka', postalCode: '560071', country: 'India' }, gstNumber: '29AABCV1234F1Z5', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1002', name: 'Priya Sharma', company: 'Zenith FinTech Labs Ltd', email: 'priya@zenithfintech.com', phone: '+91 98200 45678', billingAddress: { line1: '12th Floor, BKC One', city: 'Mumbai', state: 'Maharashtra', postalCode: '400051', country: 'India' }, gstNumber: '27AABCZ5678G1Z2', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1003', name: 'Rajesh Kulkarni', company: 'Aether Cloud Infrastructure', email: 'rajesh@aethercloud.in', phone: '+91 99100 87654', billingAddress: { line1: 'DLF Cyber City, Tower C', city: 'Gurugram', state: 'Haryana', postalCode: '122002', country: 'India' }, gstNumber: '06AABCA9012H1Z8', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1004', name: 'Deepa Krishnan', company: 'HyperScale Logistics India', email: 'deepa@hyperscalelogistics.com', phone: '+91 94440 23456', billingAddress: { line1: 'Tidel Park, Rajiv Gandhi Salai', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600113', country: 'India' }, gstNumber: '33AABCH3456J1Z1', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1005', name: 'Vikram Sengupta', company: 'QuantumPulse AI Systems', email: 'vikram@quantumpulse.io', phone: '+91 98310 98765', billingAddress: { line1: 'Sector V, Salt Lake', city: 'Kolkata', state: 'West Bengal', postalCode: '700091', country: 'India' }, gstNumber: '19AABCQ7890K1Z4', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1006', name: 'Ananya Deshmukh', company: 'BlueWave Digital Commerce', email: 'ananya@bluewave.co.in', phone: '+91 97654 32109', billingAddress: { line1: 'Magarpatta Cybercity', city: 'Pune', state: 'Maharashtra', postalCode: '411028', country: 'India' }, gstNumber: '27AABCB1234L1Z9', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1007', name: 'Karthik Rao', company: 'Nirvana Health Technologies', email: 'karthik@nirvanahealth.in', phone: '+91 98480 54321', billingAddress: { line1: 'HITEC City, Madhapur', city: 'Hyderabad', state: 'Telangana', postalCode: '500081', country: 'India' }, gstNumber: '36AABCN5678M1Z3', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1008', name: 'Meera Iyer', company: 'OmniSecure Payment Networks', email: 'meera@omnisecure.com', phone: '+91 98800 67890', billingAddress: { line1: 'Koramangala 4th Block', city: 'Bengaluru', state: 'Karnataka', postalCode: '560034', country: 'India' }, gstNumber: '29AABCO9012N1Z7', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1009', name: 'Siddharth Joshi', company: 'Strata Analytics India', email: 'siddharth@strataanalytics.io', phone: '+91 98220 11223', billingAddress: { line1: 'Senapati Bapat Road', city: 'Pune', state: 'Maharashtra', postalCode: '411016', country: 'India' }, gstNumber: '27AABCS3456P1Z6', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1010', name: 'Neha Chawla', company: 'PulseWorks HR Solutions', email: 'neha@pulseworks.in', phone: '+91 98110 33445', billingAddress: { line1: 'Aerocity Hospitality District', city: 'New Delhi', state: 'Delhi', postalCode: '110037', country: 'India' }, gstNumber: '07AABCP7890Q1Z0', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1011', name: 'Rohan Mehra', company: 'SilverLine Logistics Express', email: 'rohan@silverline.in', phone: '+91 99000 55667', billingAddress: { line1: 'Indiranagar 100ft Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', country: 'India' }, gstNumber: '29AABCS1122R1Z1', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1012', name: 'Sneha Patel', company: 'Orbit Retail Cloud', email: 'sneha@orbitretail.com', phone: '+91 98250 77889', billingAddress: { line1: 'SG Highway', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380054', country: 'India' }, gstNumber: '24AABCO3344S1Z8', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1013', name: 'Amitabh Verma', company: 'Apex Edge Telemetry', email: 'amitabh@apexedge.in', phone: '+91 98100 99001', billingAddress: { line1: 'Noida Sector 62', city: 'Noida', state: 'Uttar Pradesh', postalCode: '201309', country: 'India' }, gstNumber: '09AABCA5566T1Z5', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1014', name: 'Tarun Reddy', company: 'Synthetix Data Engineering', email: 'tarun@synthetix.tech', phone: '+91 98490 22334', billingAddress: { line1: 'Gachibowli Financial District', city: 'Hyderabad', state: 'Telangana', postalCode: '500032', country: 'India' }, gstNumber: '36AABCS7788U1Z2', currency: 'INR', status: 'Active' },
    { customerNumber: 'CUST-1015', name: 'Geeta Balasubramanian', company: 'NovaStack DevSecOps', email: 'geeta@novastack.io', phone: '+91 94450 44556', billingAddress: { line1: 'Guindy Industrial Estate', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600032', country: 'India' }, gstNumber: '33AABCN9900V1Z9', currency: 'INR', status: 'Active' }
  ];

  const customers = await Customer.insertMany(customersData);

  console.log('[Seed] Seeding 3 Role-based Users (Admin, Staff, Customer)...');
  const defaultPasswordHash = await bcrypt.hash('Brightloop@2025', 10);
  const users = await User.insertMany([
    {
      name: 'Aditya Mathur',
      email: 'admin@brightloop.io',
      password: defaultPasswordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      status: 'Active'
    },
    {
      name: 'Sahil Kapoor',
      email: 'staff@brightloop.io',
      password: defaultPasswordHash,
      role: 'STAFF',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      status: 'Active'
    },
    {
      name: 'Arun Nair (Customer Persona)',
      email: 'arun.nair@vertexmedia.in',
      password: defaultPasswordHash,
      role: 'CUSTOMER',
      customerId: customers[0]._id,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      status: 'Active'
    }
  ]);

  console.log('[Seed] Seeding 8 Enterprise Products...');
  const productsData = [
    { name: 'Brightloop Core Billing', code: 'PROD-CORE', category: 'Financial Cloud', description: 'Unified recurring subscription billing and multi-currency revenue engine', status: 'Active', features: ['Automated Invoicing', 'GST Engine', 'Subscription Lifecycle', 'Multi-tenant isolation'] },
    { name: 'Revenue Intelligence Suite', code: 'PROD-REVINT', category: 'Analytics AI', description: 'Predictive churn modeling, MRR/ARR analytics, and revenue leakage detection', status: 'Active', features: ['Leakage Alerts', 'Smart Renewal Engine', 'Cash Flow Forecast', 'Cohort Retention'] },
    { name: 'Customer Self-Service Hub', code: 'PROD-PORTAL', category: 'Customer Experience', description: 'White-label customer billing portal, invoice downloads, and subscription self-management', status: 'Active', features: ['Invoice History', 'Payment Gateway Integration', 'Plan Upgrades', 'Usage Meters'] },
    { name: 'Smart Dunning & Payment Recovery', code: 'PROD-DUNN', category: 'Payment Ops', description: 'Intelligent payment retry logic, automated failure alerts, and customer recovery journeys', status: 'Active', features: ['Smart Retries', 'WhatsApp Alerts', 'Grace Periods', 'Card Expiry Warnings'] },
    { name: 'Enterprise Tax & Compliance Shield', code: 'PROD-TAX', category: 'Compliance', description: 'Automated India GST e-Invoicing, HSN/SAC code mapping, and GST return reconciliation', status: 'Active', features: ['GST e-Invoicing', 'E-Way Bill Sync', 'Tax Audit Trail', 'Reverse Charge Logic'] },
    { name: 'Quotation CPQ Engine', code: 'PROD-CPQ', category: 'Sales Operations', description: 'Enterprise Configure-Price-Quote workflow with instant contract-to-subscription conversion', status: 'Active', features: ['Multi-tier discounts', 'Approval workflows', 'PDF contract generation', '1-Click Conversion'] },
    { name: 'Usage-Based Metering API', code: 'PROD-METER', category: 'Developer Tools', description: 'High-throughput event ingestion engine for usage-based, tiered, and hybrid billing models', status: 'Active', features: ['Event Ingestion', 'Tiered Thresholds', 'Overage Protection', 'Realtime Webhooks'] },
    { name: 'Global Payment Orchestrator', code: 'PROD-ORCH', category: 'Payments', description: 'Intelligent multi-gateway routing, UPI Autopay, e-Mandate, and automatic reconciliation', status: 'Active', features: ['UPI Autopay', 'e-Mandates', 'Auto Reconciliation', 'Multi-Rail Settlement'] }
  ];

  const products = await Product.insertMany(productsData);

  console.log('[Seed] Seeding 12 Pricing Plans (Monthly, Quarterly, Yearly in Paise)...');
  const plansData = [
    // Product 0: Core Billing
    {
      productId: products[0]._id,
      name: 'Core Starter',
      code: 'CORE-STARTER-MO',
      billingInterval: 'monthly',
      priceInPaise: 499900, // ₹4,999.00/mo
      trialPeriodDays: 14,
      setupFeeInPaise: 0,
      description: 'Ideal for fast-growing early-stage SaaS businesses',
      features: ['Up to 500 active subscriptions', 'Standard India GST calculations', 'Email invoice delivery', 'Standard support'],
      comparisonBullets: [
        { feature: 'Subscriptions Included', included: true, detail: '500' },
        { feature: 'GST e-Invoicing', included: false, detail: 'Available on Growth' },
        { feature: 'API Access', included: true, detail: 'Standard Rate Limit' },
        { feature: 'Dedicated Support', included: false, detail: 'Email only' }
      ]
    },
    {
      productId: products[0]._id,
      name: 'Core Growth',
      code: 'CORE-GROWTH-MO',
      billingInterval: 'monthly',
      priceInPaise: 1499900, // ₹14,999.00/mo
      trialPeriodDays: 14,
      setupFeeInPaise: 250000,
      description: 'Comprehensive billing engine for scale-up SaaS platforms',
      features: ['Up to 5,000 active subscriptions', 'Automated recurring billing', 'Webhooks & REST APIs', 'Priority Slack support'],
      comparisonBullets: [
        { feature: 'Subscriptions Included', included: true, detail: '5,000' },
        { feature: 'GST e-Invoicing', included: true, detail: 'Automated via NIC' },
        { feature: 'API Access', included: true, detail: 'High Throughput' },
        { feature: 'Dedicated Support', included: true, detail: 'Dedicated Account Manager' }
      ]
    },
    {
      productId: products[0]._id,
      name: 'Core Enterprise Annual',
      code: 'CORE-ENT-YR',
      billingInterval: 'yearly',
      priceInPaise: 14999900, // ₹1,49,999.00/yr (~₹12,500/mo)
      trialPeriodDays: 30,
      setupFeeInPaise: 0,
      description: 'Full enterprise scalability with 2 months free annual discount',
      features: ['Unlimited active subscriptions', 'Dedicated VPC deployment', 'SLA 99.99%', 'Custom integration engineering'],
      comparisonBullets: [
        { feature: 'Subscriptions Included', included: true, detail: 'Unlimited' },
        { feature: 'GST e-Invoicing', included: true, detail: 'Custom ERP Sync' },
        { feature: 'API Access', included: true, detail: 'Dedicated Endpoints' },
        { feature: 'Dedicated Support', included: true, detail: '24/7 Enterprise SLA' }
      ]
    },
    // Product 1: Revenue Intelligence
    {
      productId: products[1]._id,
      name: 'Intelligence Pro Monthly',
      code: 'REVINT-PRO-MO',
      billingInterval: 'monthly',
      priceInPaise: 999900, // ₹9,999.00/mo
      trialPeriodDays: 7,
      description: 'Advanced MRR/ARR analytics and automated churn mitigation',
      features: ['Real-time MRR/ARR waterfall', 'Revenue leakage alerts', 'Smart Renewal Center', 'Predictive churn scoring']
    },
    {
      productId: products[1]._id,
      name: 'Intelligence Pro Annual',
      code: 'REVINT-PRO-YR',
      billingInterval: 'yearly',
      priceInPaise: 9999900, // ₹99,999.00/yr
      trialPeriodDays: 14,
      description: 'Annual intelligence suite with custom cohort reporting',
      features: ['Unlimited financial exports', 'Executive dashboards', 'Multi-entity consolidation', 'Audit logs export']
    },
    // Product 2: Customer Self-Service Portal
    {
      productId: products[2]._id,
      name: 'Portal Standard',
      code: 'PORTAL-STD-MO',
      billingInterval: 'monthly',
      priceInPaise: 399900, // ₹3,999.00/mo
      trialPeriodDays: 14,
      description: 'White-label customer billing portal and payment management',
      features: ['Custom domain mapping', 'Invoice PDF downloads', 'Plan upgrade workflows', 'Payment method updates']
    },
    // Product 3: Smart Dunning
    {
      productId: products[3]._id,
      name: 'Dunning Automated Recovery',
      code: 'DUNN-AUTO-MO',
      billingInterval: 'monthly',
      priceInPaise: 599900, // ₹5,999.00/mo
      trialPeriodDays: 0,
      description: 'Zero-touch failed payment retry and dunning cadence',
      features: ['Smart ML retry scheduler', 'WhatsApp dunning sequences', 'Overdue fee calculation', 'Recovery analytics']
    },
    // Product 4: Tax Shield
    {
      productId: products[4]._id,
      name: 'India Tax & GST Shield',
      code: 'TAX-GST-YR',
      billingInterval: 'yearly',
      priceInPaise: 4999900, // ₹49,999.00/yr
      trialPeriodDays: 0,
      description: 'Complete GST compliance and invoice reconciliation for Indian SaaS',
      features: ['IRN generation', 'QR Code on B2B invoices', 'GSTR-1 JSON export', 'Tax reconciliation engine']
    },
    // Product 5: Quotation CPQ Engine
    {
      productId: products[5]._id,
      name: 'CPQ Enterprise Quarterly',
      code: 'CPQ-ENT-QTR',
      billingInterval: 'quarterly',
      priceInPaise: 2499900, // ₹24,999.00/qtr
      trialPeriodDays: 7,
      description: 'Quotation-to-subscription contract workflow',
      features: ['Contract approval matrix', 'Custom discount brackets', 'PDF quotation builder', 'One-click subscription conversion']
    },
    // Product 6: Metering API
    {
      productId: products[6]._id,
      name: 'Metering API Pro',
      code: 'METER-PRO-MO',
      billingInterval: 'monthly',
      priceInPaise: 799900, // ₹7,999.00/mo
      trialPeriodDays: 14,
      description: 'Real-time usage aggregation and overage billing',
      features: ['10M events/month', 'Overage auto-calc', 'Custom rate cards', 'Webhook streaming']
    },
    // Product 7: Payment Orchestrator
    {
      productId: products[7]._id,
      name: 'Payment Orchestrator Monthly',
      code: 'ORCH-STD-MO',
      billingInterval: 'monthly',
      priceInPaise: 699900, // ₹6,999.00/mo
      trialPeriodDays: 0,
      description: 'UPI Autopay & multi-rail payment reconciliation',
      features: ['UPI Autopay integration', 'e-Mandates', 'Auto-reconciliation', 'Virtual account collection']
    },
    {
      productId: products[7]._id,
      name: 'Payment Orchestrator Annual',
      code: 'ORCH-ENT-YR',
      billingInterval: 'yearly',
      priceInPaise: 6999900, // ₹69,999.00/yr
      trialPeriodDays: 14,
      description: 'Enterprise payment routing and automated ledger sync',
      features: ['Multi-gateway failover', 'Reconciliation ledger', 'Instant refund workflow', 'Real-time settlements']
    }
  ];

  const plans = await Plan.insertMany(plansData);

  console.log('[Seed] Seeding Discounts & Coupons...');
  const discounts = await Discount.insertMany([
    {
      code: 'FESTIVE25',
      description: 'Diwali Enterprise Tech Discount - 25% off annual plans',
      type: 'percentage',
      value: 25,
      minPurchaseInPaise: 5000000,
      maxDiscountInPaise: 2500000,
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-12-31'),
      maxRedemptions: 50,
      currentRedemptions: 12,
      status: 'Active'
    },
    {
      code: 'STARTUP10K',
      description: 'Flat ₹10,000 rebate on first billing cycle',
      type: 'fixed',
      value: 1000000, // ₹10,000.00
      minPurchaseInPaise: 2000000,
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-12-31'),
      maxRedemptions: 100,
      currentRedemptions: 24,
      status: 'Active'
    },
    {
      code: 'FINTECH15',
      description: 'Exclusive 15% discount for FinTech & Banking technology customers',
      type: 'percentage',
      value: 15,
      minPurchaseInPaise: 1000000,
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-12-31'),
      maxRedemptions: 200,
      currentRedemptions: 45,
      status: 'Active'
    }
  ]);

  console.log('[Seed] Seeding 20 Subscriptions with realistic lifecycle statuses...');
  const now = new Date();
  const subStatuses = [
    'Active', 'Active', 'Active', 'Active', 'Active',
    'Active', 'Active', 'Active', 'Active', 'Active',
    'Active', 'Trial', 'Trial', 'Paused', 'Past Due',
    'Past Due', 'Active', 'Active', 'Cancelled', 'Active'
  ];

  const subscriptions = [];
  for (let i = 0; i < 20; i++) {
    const cust = customers[i % customers.length];
    const plan = plans[i % plans.length];
    const prod = products.find(p => p._id.toString() === plan.productId.toString()) || products[0];
    const status = subStatuses[i];

    const startDate = new Date(now.getTime() - (i * 12 + 10) * 24 * 60 * 60 * 1000);
    // Period end and next billing date
    let currentPeriodEnd;
    if (i < 5) {
      // Near renewal (in next 5 to 12 days) to demonstrate Smart Renewal Center!
      currentPeriodEnd = new Date(now.getTime() + (i * 2 + 3) * 24 * 60 * 60 * 1000);
    } else if (status === 'Past Due') {
      // Past due
      currentPeriodEnd = new Date(now.getTime() - (i + 4) * 24 * 60 * 60 * 1000);
    } else {
      currentPeriodEnd = new Date(now.getTime() + (i * 3 + 15) * 24 * 60 * 60 * 1000);
    }

    const sub = await Subscription.create({
      subscriptionNumber: `SUB-2025-${String(1001 + i)}`,
      customerId: cust._id,
      productId: prod._id,
      planId: plan._id,
      status,
      billingInterval: plan.billingInterval,
      intervalCount: plan.intervalCount || 1,
      quantity: 1 + (i % 3),
      unitPriceInPaise: plan.priceInPaise,
      discountPercent: i % 4 === 0 ? 10 : 0,
      taxRate: 18,
      startDate,
      trialStartDate: status === 'Trial' ? startDate : null,
      trialEndDate: status === 'Trial' ? new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
      currentPeriodStart: startDate,
      currentPeriodEnd,
      nextBillingDate: currentPeriodEnd,
      pausedAt: status === 'Paused' ? new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
      cancelledAt: status === 'Cancelled' ? new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) : null,
      cancellationReason: status === 'Cancelled' ? 'Downsized engineering team for Q3' : '',
      autoRenew: status !== 'Cancelled',
      timeline: [
        {
          action: 'SUBSCRIPTION_CREATED',
          timestamp: startDate,
          description: `Subscription activated for plan ${plan.name}`,
          performedBy: 'Sales Operations'
        },
        ...(status === 'Paused' ? [{ action: 'PAUSED', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), description: 'Subscription billing temporarily paused by customer', performedBy: 'Customer Portal' }] : []),
        ...(status === 'Cancelled' ? [{ action: 'CANCELLED', timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), description: 'Subscription cancelled. Reason: Downsized team', performedBy: 'Aditya Mathur' }] : [])
      ]
    });

    subscriptions.push(sub);
  }

  console.log('[Seed] Seeding 25 Invoices with GST & status distribution...');
  const invoices = [];
  const invoiceStatuses = [
    'Paid', 'Paid', 'Paid', 'Paid', 'Paid',
    'Paid', 'Paid', 'Paid', 'Paid', 'Paid',
    'Paid', 'Paid', 'Paid', 'Paid', 'Paid',
    'Partially Paid', 'Partially Paid', 'Unpaid', 'Unpaid', 'Unpaid',
    'Overdue', 'Overdue', 'Overdue', 'Draft', 'Paid'
  ];

  for (let i = 0; i < 25; i++) {
    const cust = customers[i % customers.length];
    const sub = subscriptions[i % subscriptions.length];
    const status = invoiceStatuses[i];
    const plan = plans[i % plans.length];

    const quantity = 1;
    const unitPrice = plan.priceInPaise;
    const subtotal = unitPrice * quantity;
    const discountAmount = i % 4 === 0 ? Math.round((subtotal * 10) / 100) : 0;
    const taxable = subtotal - discountAmount;
    const taxAmount = Math.round((taxable * 18) / 100);
    const totalAmount = taxable + taxAmount;

    let paidAmount = 0;
    let outstandingAmount = totalAmount;

    if (status === 'Paid') {
      paidAmount = totalAmount;
      outstandingAmount = 0;
    } else if (status === 'Partially Paid') {
      paidAmount = Math.round(totalAmount * 0.5);
      outstandingAmount = totalAmount - paidAmount;
    } else if (status === 'Overdue') {
      paidAmount = 0;
      outstandingAmount = totalAmount;
    }

    const issueDate = new Date(now.getTime() - (i * 6 + 4) * 24 * 60 * 60 * 1000);
    const dueDate = status === 'Overdue'
      ? new Date(now.getTime() - (i + 2) * 24 * 60 * 60 * 1000)
      : new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    const inv = await Invoice.create({
      invoiceNumber: `INV-202510-${String(1001 + i)}`,
      customerId: cust._id,
      subscriptionId: sub ? sub._id : null,
      lineItems: [{
        description: `${plan.name} — ${plan.billingInterval} recurring subscription`,
        quantity,
        unitPriceInPaise: unitPrice,
        discountPercent: i % 4 === 0 ? 10 : 0,
        discountAmountInPaise: discountAmount,
        taxRate: 18,
        taxAmountInPaise: taxAmount,
        subtotalInPaise: subtotal,
        totalAmountInPaise: totalAmount
      }],
      subtotalInPaise: subtotal,
      discountTotalInPaise: discountAmount,
      taxTotalInPaise: taxAmount,
      totalAmountInPaise: totalAmount,
      paidAmountInPaise: paidAmount,
      outstandingAmountInPaise: outstandingAmount,
      status,
      issueDate,
      dueDate,
      paidAt: status === 'Paid' ? new Date(issueDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
      paymentTerms: 'Net 15 days'
    });

    invoices.push(inv);
  }

  console.log('[Seed] Seeding 20 Payment Records (UPI, Card, Bank Transfer, NetBanking)...');
  const paymentMethods = ['UPI', 'Card', 'Bank Transfer', 'UPI', 'Card', 'Bank Transfer', 'Other'];
  const paidOrPartialInvoices = invoices.filter(i => i.paidAmountInPaise > 0);

  const payments = [];
  for (let i = 0; i < 20; i++) {
    const inv = paidOrPartialInvoices[i % paidOrPartialInvoices.length];
    const amount = i < 18 ? inv.paidAmountInPaise : 500000;
    const method = paymentMethods[i % paymentMethods.length];
    const isFailed = i === 19; // 1 deliberate failed payment for health monitor demo!

    const p = await Payment.create({
      paymentNumber: `PAY-202510-${String(1001 + i)}`,
      invoiceId: inv._id,
      customerId: inv.customerId,
      amountInPaise: amount,
      method,
      referenceNumber: method === 'UPI' ? `UPI/${9800000000 + i}@okhdfcbank` : `UTR-HDFC-${7891230 + i}`,
      status: isFailed ? 'Failed' : 'Success',
      paymentDate: new Date(now.getTime() - (i * 4 + 1) * 24 * 60 * 60 * 1000),
      notes: isFailed ? 'Bank response: UPI transaction timeout or insufficient funds' : 'Payment reconciled successfully',
      isSimulated: false,
      reconciled: !isFailed,
      reconciledAt: !isFailed ? new Date() : null
    });

    payments.push(p);
  }

  console.log('[Seed] Seeding Sample Quotations...');
  await Quotation.create([
    {
      quotationNumber: 'QT-2025-0101',
      customerId: customers[0]._id,
      lineItems: [{
        productId: products[0]._id,
        planId: plans[1]._id,
        description: 'Core Growth Annual Platform Licensing (5,000 subscriptions)',
        quantity: 1,
        unitPriceInPaise: 1499900,
        discountPercent: 10,
        discountAmountInPaise: 149990,
        taxRate: 18,
        taxAmountInPaise: 242984,
        subtotalInPaise: 1499900,
        totalAmountInPaise: 1592894
      }],
      subtotalInPaise: 1499900,
      discountTotalInPaise: 149990,
      taxTotalInPaise: 242984,
      grandTotalInPaise: 1592894,
      status: 'Sent',
      expiryDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      notes: 'Custom enterprise proposal for Vertex Media cloud expansion.',
      sentAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      sentToEmail: customers[0].email
    },
    {
      quotationNumber: 'QT-2025-0102',
      customerId: customers[1]._id,
      lineItems: [{
        productId: products[1]._id,
        planId: plans[4]._id,
        description: 'Revenue Intelligence Pro Annual Suite + Tax Shield Integration',
        quantity: 1,
        unitPriceInPaise: 9999900,
        discountPercent: 15,
        discountAmountInPaise: 1499985,
        taxRate: 18,
        taxAmountInPaise: 1529985,
        subtotalInPaise: 9999900,
        totalAmountInPaise: 10029900
      }],
      subtotalInPaise: 9999900,
      discountTotalInPaise: 1499985,
      taxTotalInPaise: 1529985,
      grandTotalInPaise: 10029900,
      status: 'Accepted',
      expiryDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      notes: 'Agreed contract ready for 1-click subscription conversion.',
      sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      sentToEmail: customers[1].email
    }
  ]);

  console.log('[Seed] Seeding Initial Audit Logs...');
  await AuditLog.insertMany([
    {
      userName: 'Aditya Mathur',
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      entityId: 'ROOT',
      details: { environment: 'Production Ready Demo', version: '2.5.0' },
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      userName: 'Aditya Mathur',
      userRole: 'ADMIN',
      action: 'TAX_RULE_CONFIGURED',
      entity: 'TaxRule',
      entityId: taxRules[3]._id.toString(),
      details: { standardGSTRate: 18, jurisdiction: 'India GST' },
      createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
    },
    {
      userName: 'Sahil Kapoor',
      userRole: 'STAFF',
      action: 'CREATE_QUOTATION',
      entity: 'Quotation',
      entityId: 'QT-2025-0101',
      details: { customer: 'Vertex Media Technologies', grandTotal: 1592894 },
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    }
  ]);

  console.log('✓ [Seed] Complete! Seeded:');
  console.log(`  - 3 Users (Admin, Staff, Customer)`);
  console.log(`  - ${customers.length} Customers`);
  console.log(`  - ${products.length} Products`);
  console.log(`  - ${plans.length} Pricing Plans`);
  console.log(`  - ${subscriptions.length} Subscriptions`);
  console.log(`  - ${invoices.length} Invoices`);
  console.log(`  - ${payments.length} Payments`);
  console.log(`  - ${discounts.length} Discounts`);
  console.log(`  - ${taxRules.length} Tax Rules`);
};

module.exports = { seedAll };
