import { User } from "./User";
import { Profile } from "./Profile";
import { Follower } from "./Follower";
import { Ban } from "./Ban";
import { sequelize } from "../../config/connection";

const models = {
  User,
  Profile,
  Follower,
  Ban,
};

Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export { User, Profile, Follower, Ban, sequelize };
export default models;
