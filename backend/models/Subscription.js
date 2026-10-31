const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String, required: true },
  performedBy: { type: String, default: 'System' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  subscriptionNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    default: null
  },
  status: {
    type: String,
    enum: ['Draft', 'Trial', 'Active', 'Paused', 'Past Due', 'Cancelled', 'Expired'],
    default: 'Active'
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  intervalCount: {
    type: Number,
    default: 1
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unitPriceInPaise: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 18 // GST
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  trialStartDate: {
    type: Date,
    default: null
  },
  trialEndDate: {
    type: Date,
    default: null
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  pausedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  timeline: [timelineEventSchema]
}, {
  timestamps: true
});

subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ subscriptionNumber: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
