require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const { seedAll } = require('./seedData');

const run = async () => {
  try {
    await connectDB();
    await seedAll();
    console.log('[SeedRunner] All collections successfully populated.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[SeedRunner] Error during seeding:', err);
    process.exit(1);
  }
};

run();
