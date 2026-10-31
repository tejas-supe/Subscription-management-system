const mongoose = require('mongoose');

const invoiceLineItemSchema = new mongoose.Schema({
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
    default: 0
  },
  discountAmountInPaise: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 18 // GST
  },
  taxAmountInPaise: {
    type: Number,
    default: 0
  },
  subtotalInPaise: {
    type: Number,
    required: true
  },
  totalAmountInPaise: {
    type: Number,
    required: true
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    default: null
  },
  lineItems: [invoiceLineItemSchema],
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
  taxTotalInPaise: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmountInPaise: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmountInPaise: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingAmountInPaise: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Void'],
    default: 'Unpaid'
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: {
    type: Date,
    default: null
  },
  billingPeriodStart: {
    type: Date,
    default: null
  },
  billingPeriodEnd: {
    type: Date,
    default: null
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: {
    type: String,
    default: 'Thank you for your business.'
  },
  paymentTerms: {
    type: String,
    default: 'Net 15 days'
  }
}, {
  timestamps: true
});

invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ subscriptionId: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
