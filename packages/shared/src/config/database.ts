import { Sequelize } from "sequelize";
import mongoose from "mongoose";

/**
 * Connect to PostgreSQL using Sequelize.
 * Reads connection string from POSTGRES_URI env var.
 */
export async function connectPostgres(): Promise<Sequelize> {
  const uri =
    process.env.POSTGRES_URI ||
    "postgres://breezy:breezy@localhost:5432/breezy";

  const sequelize = new Sequelize(uri, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "production" ? false : console.log,
  });

  await sequelize.authenticate();
  console.log("✅ PostgreSQL connected successfully");

  return sequelize;
}

/**
 * Connect to MongoDB using Mongoose.
 * Reads connection string from MONGO_URI env var.
 */
export async function connectMongo(): Promise<typeof mongoose> {
  const uri =
    process.env.MONGO_URI || "mongodb://localhost:27017/breezy";

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected successfully");

  return mongoose;
}
