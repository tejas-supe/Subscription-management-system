const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    default: ''
  },
  jurisdiction: {
    type: String,
    default: 'India GST'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TaxRule', taxRuleSchema);
