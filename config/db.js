const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || '';
  if (!uri || uri.includes('REPLACE_')) {
    throw new Error('MONGODB_URI not set — update your .env file');
  }
  console.log('Connecting to MongoDB...');
  const conn = await mongoose.connect(uri, {
    dbName: 'swiftbite',
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
  });
  console.log(`✅  MongoDB connected: ${conn.connection.host}`);

  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('✅  MongoDB reconnected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
};

module.exports = connectDB;
