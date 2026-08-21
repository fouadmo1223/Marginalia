import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  await mongoose.connection.db!.admin().ping();
  console.log(`[keep-alive] pinged MongoDB Atlas at ${new Date().toISOString()}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[keep-alive] failed:', err);
  process.exit(1);
});
