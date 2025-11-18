import mongoose from 'mongoose';

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment');
  }

  // Use mongoose to connect with reasonable options
  await mongoose.connect(uri, {
    // mongoose 7+ has sensible defaults; keep options minimal
    dbName: process.env.MONGO_DB || undefined
  });

  console.log('MongoDB connected');
}

export default connectDB;
