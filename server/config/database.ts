import mongoose from 'mongoose';

let isConnected = false;
let useFallback = false;

export async function connectDatabase(): Promise<{ isMongoose: boolean }> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[Database] MONGODB_URI not provided; initializing robust persistent memory/file store.');
    useFallback = true;
    return { isMongoose: false };
  }

  try {
    // Try to connect with a short 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('[Database] Connected successfully to MongoDB via Mongoose');
    return { isMongoose: true };
  } catch (error) {
    console.warn('[Database] Could not connect to MongoDB URI. Seamlessly activating built-in storage engine:', (error as Error).message);
    useFallback = true;
    return { isMongoose: false };
  }
}

export function isUsingMongoose(): boolean {
  return isConnected && !useFallback;
}
