const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    default: 'Software'
  },
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  },
  features: [{
    type: String
  }],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

productSchema.index({ code: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
