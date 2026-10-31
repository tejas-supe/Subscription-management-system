require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { processDueSubscriptions } = require('./services/billingEngine');
const Customer = require('./models/Customer');
const { seedAll } = require('./seed/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const planRoutes = require('./routes/planRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const discountRoutes = require('./routes/discountRoutes');
const taxRoutes = require('./routes/taxRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const differentiatorRoutes = require('./routes/differentiatorRoutes');
const auditRoutes = require('./routes/auditRoutes');
const portalRoutes = require('./routes/portalRoutes');
const teamRoutes = require('./routes/teamRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Brightloop Enterprise Subscription Management',
    version: '2.5.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/intelligence', differentiatorRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/team', teamRoutes);

// Centralized error handler
app.use(errorHandler);

// Scheduled recurring billing job: runs every hour at minute 0
// Can also be triggered on-demand via POST /api/subscriptions/run-billing-cycle
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running scheduled subscription recurring billing job...');
  try {
    const results = await processDueSubscriptions();
    console.log(`[Cron] Completed. Invoices generated: ${results.invoicesGenerated}, Skipped: ${results.skipped}`);
  } catch (err) {
    console.error('[Cron] Error during scheduled billing job:', err.message);
  }
});

// Server Initialization
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is freshly initialized or empty
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      console.log('[Init] Database is empty. Auto-seeding initial enterprise dataset...');
      await seedAll();
    } else {
      console.log(`[Init] Database ready with ${customerCount} existing customers.`);
    }

    app.listen(PORT, () => {
      console.log(`
==========================================================
⚡ BRIGHTLOOP ENTERPRISE SUBSCRIPTION PLATFORM API RUNNING
📡 Local URL: http://localhost:${PORT}
🔐 Admin Demo: admin@brightloop.io | Brightloop@2025
==========================================================
      `);
    });
  } catch (err) {
    console.error('Fatal: Failed to start Brightloop server:', err);
    process.exit(1);
  }
};

startServer();
