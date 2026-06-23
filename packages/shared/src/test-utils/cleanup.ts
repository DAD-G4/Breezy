import { sequelize } from '../config/connection';
import mongoose from 'mongoose';

export async function clearAllTestData(): Promise<void> {
  // PostgreSQL: truncate in correct order (respect FKs)
  await sequelize.query('TRUNCATE TABLE "Bans" CASCADE');
  await sequelize.query('TRUNCATE TABLE "Followers" CASCADE');
  await sequelize.query('TRUNCATE TABLE "Profiles" CASCADE');
  await sequelize.query('TRUNCATE TABLE "Users" CASCADE');

  // MongoDB: drop all test collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
