const express = require('express');
const router = express.Router();
const {
  getSubscriptionHealth,
  getSmartRenewals,
  getRevenueIntelligence,
  getFinancialReconciliation
} = require('../services/healthIntelligence');
const { authenticateToken } = require('../middleware/auth');

// 1. Subscription Health Monitor
router.get('/health-monitor', authenticateToken, async (req, res, next) => {
  try {
    const data = await getSubscriptionHealth();
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// 2. Smart Renewal Center (7, 15, 30 days)
router.get('/renewals', authenticateToken, async (req, res, next) => {
  try {
    const data = await getSmartRenewals();
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// 3. Revenue Intelligence & Leakage Alerts
router.get('/revenue-alerts', authenticateToken, async (req, res, next) => {
  try {
    const data = await getRevenueIntelligence();
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// 4. Financial Reconciliation Engine
router.get('/reconciliation', authenticateToken, async (req, res, next) => {
  try {
    const data = await getFinancialReconciliation();
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
