import { Sequelize } from "sequelize";

const uri = process.env.POSTGRES_URI;
if (!uri) {
  throw new Error("POSTGRES_URI environment variable is required");
}

export const sequelize = new Sequelize(uri, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "production" ? false : console.log,
});

export default sequelize;
