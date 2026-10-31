const mongoose = require('mongoose');

const quotationLineItemSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPriceInPaise: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  taxRate: {
    type: Number,
    default: 18 // GST percentage
  },
  subtotalInPaise: {
    type: Number,
    required: true
  },
  discountAmountInPaise: {
    type: Number,
    default: 0
  },
  taxAmountInPaise: {
    type: Number,
    default: 0
  },
  totalAmountInPaise: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  lineItems: [quotationLineItemSchema],
  subtotalInPaise: {
    type: Number,
    required: true,
    min: 0
  },
  discountTotalInPaise: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    default: null
  },
  taxTotalInPaise: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotalInPaise: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'],
    default: 'Draft'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  terms: {
    type: String,
    default: 'Valid for 30 days. All payments due as per agreed billing cycle.'
  },
  sentAt: {
    type: Date,
    default: null
  },
  sentToEmail: {
    type: String,
    default: null
  },
  convertedSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  convertedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

quotationSchema.index({ customerId: 1 });
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ status: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
