const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  intervalCount: {
    type: Number,
    default: 1,
    min: 1
  },
  priceInPaise: {
    type: Number,
    required: true,
    min: 0
  },
  trialPeriodDays: {
    type: Number,
    default: 0,
    min: 0
  },
  setupFeeInPaise: {
    type: Number,
    default: 0,
    min: 0
  },
  isOneTime: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  features: [{
    type: String
  }],
  comparisonBullets: [{
    feature: String,
    included: Boolean,
    detail: String
  }],
  defaultTaxRate: {
    type: Number,
    default: 18 // 18% GST default
  }
}, {
  timestamps: true
});

planSchema.index({ productId: 1 });
planSchema.index({ code: 1 });
planSchema.index({ status: 1 });

module.exports = mongoose.model('Plan', planSchema);
