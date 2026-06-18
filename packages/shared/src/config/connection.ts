import { Sequelize } from "sequelize";

const uri =
  process.env.POSTGRES_URI ||
  "postgres://breezy:breezy@localhost:5432/breezy";

export const sequelize = new Sequelize(uri, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "production" ? false : console.log,
});

export default sequelize;
