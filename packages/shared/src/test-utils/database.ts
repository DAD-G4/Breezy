import { connectPostgres, connectMongo } from '../config/database';
import { sequelize } from '../config/connection';
import mongoose from 'mongoose';

export async function connectTestDatabases(): Promise<void> {
  await connectPostgres();
  await connectMongo();
}

export async function disconnectTestDatabases(): Promise<void> {
  await sequelize.close();
  await mongoose.disconnect();
}
