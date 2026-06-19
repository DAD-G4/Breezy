import { Sequelize } from "sequelize";
import mongoose from "mongoose";
import { sequelize } from "./connection";

export async function connectPostgres(): Promise<Sequelize> {
  await sequelize.authenticate();
  console.log("✅ PostgreSQL connected successfully");

  // Auto-sync tables in development (creates tables if they don't exist)
  if (process.env.NODE_ENV !== "production") {
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synced");
  }

  return sequelize;
}

export async function connectMongo(): Promise<typeof mongoose> {
  const uri =
    process.env.MONGO_URI || "mongodb://localhost:27017/breezy";

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected successfully");

  return mongoose;
}
