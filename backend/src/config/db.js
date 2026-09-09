import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the given URI (defaults to process.env.MONGODB_URI).
 * Kept as a plain function (not auto-run on import) so tests can point it at
 * an ephemeral in-memory MongoDB instance instead of a real Atlas cluster.
 */
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and configure it.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
