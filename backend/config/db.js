const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // First try the configured URI if it is not default localhost, or try localhost with a short timeout
  if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
    try {
      console.log(`[DB] Attempting connection to configured MongoDB: ${uri.split('@')[1] || uri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000
      });
      console.log('✓ [DB] Connected successfully to external MongoDB');
      return;
    } catch (err) {
      console.warn('! [DB] Failed to connect to external MongoDB:', err.message);
    }
  }

  // Try localhost 27017 with a 1.5s timeout
  try {
    const localUri = uri || 'mongodb://127.0.0.1:27017/brightloop';
    console.log(`[DB] Testing local MongoDB connection on ${localUri}...`);
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 1500
    });
    console.log('✓ [DB] Connected to local MongoDB instance');
    return;
  } catch (localErr) {
    console.log('[DB] Local MongoDB not running. Initializing embedded high-performance in-memory MongoDB...');
  }

  // Fallback to embedded MongoMemoryServer
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'brightloop'
      }
    });
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`✓ [DB] Connected to embedded in-memory MongoDB (${memoryUri})`);
  } catch (memErr) {
    console.error('✗ [DB] Critical failure connecting to MongoDB:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
