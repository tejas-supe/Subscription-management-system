const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
    // percentage: e.g. 15 for 15%; fixed: amount in paise, e.g. 50000 for ₹500
  },
  minPurchaseInPaise: {
    type: Number,
    default: 0
  },
  maxDiscountInPaise: {
    type: Number,
    default: null // null for unlimited
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  maxRedemptions: {
    type: Number,
    default: 100
  },
  currentRedemptions: {
    type: Number,
    default: 0
  },
  perCustomerLimit: {
    type: Number,
    default: 1
  },
  customerUsage: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

discountSchema.index({ code: 1 });
discountSchema.index({ status: 1 });

module.exports = mongoose.model('Discount', discountSchema);
