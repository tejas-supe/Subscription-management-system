const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amountInPaise: {
    type: Number,
    required: true,
    min: 1
  },
  method: {
    type: String,
    enum: ['UPI', 'Card', 'Bank Transfer', 'Cash', 'Other'],
    required: true
  },
  referenceNumber: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Success', 'Pending', 'Failed', 'Refunded'],
    default: 'Success'
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  isSimulated: {
    type: Boolean,
    default: false
  },
  reconciled: {
    type: Boolean,
    default: true
  },
  reconciledAt: {
    type: Date,
    default: Date.now
  },
  refundReason: {
    type: String,
    default: ''
  },
  refundedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
