const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// List products
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    // Attach plans count & active subscribers count
    const enriched = await Promise.all(products.map(async (p) => {
      const plans = await Plan.find({ productId: p._id }).lean();
      const activeSubsCount = await Subscription.countDocuments({ productId: p._id, status: 'Active' });
      return {
        ...p,
        plans,
        plansCount: plans.length,
        activeSubscribersCount: activeSubsCount
      };
    }));

    res.json({ success: true, count: enriched.length, products: enriched });
  } catch (err) {
    next(err);
  }
});

// Create product
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, code, description, category, features } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Product name and unique code are required' });
    }

    const product = await Product.create({
      name,
      code: code.trim().toUpperCase(),
      description: description || '',
      category: category || 'SaaS Cloud',
      features: features || [],
      status: 'Active'
    });

    await recordAudit(req, {
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name, code: product.code }
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// Update product
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, code, description, category, status, features } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code: code ? code.trim().toUpperCase() : undefined,
        description,
        category,
        status,
        features
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await recordAudit(req, {
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name, status: product.status }
    });

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// Archive / Delete product
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Toggle to Archived or delete if no plans
    const plansCount = await Plan.countDocuments({ productId: product._id });
    if (plansCount > 0) {
      product.status = 'Archived';
      await product.save();
      await recordAudit(req, {
        action: 'ARCHIVE_PRODUCT',
        entity: 'Product',
        entityId: product._id,
        details: { name: product.name, code: product.code }
      });
      return res.json({ success: true, message: `Product archived (${plansCount} linked plans preserved)`, product });
    }

    await Product.findByIdAndDelete(product._id);
    await recordAudit(req, {
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name }
    });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
