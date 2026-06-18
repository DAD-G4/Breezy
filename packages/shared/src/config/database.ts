import { Sequelize } from "sequelize";
import mongoose from "mongoose";

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

export async function connectMongo(): Promise<typeof mongoose> {
  const uri =
    process.env.MONGO_URI || "mongodb://localhost:27017/breezy";

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected successfully");

  return mongoose;
}
