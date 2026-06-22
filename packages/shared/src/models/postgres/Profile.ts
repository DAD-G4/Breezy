import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/connection";

export interface ProfileAttributes {
  id: number;
  user_id: number;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  language_preference: string;
  theme_preference: string;
}

export type ProfileCreationAttributes = Optional<
  ProfileAttributes,
  "id" | "display_name" | "bio" | "avatar_url" | "language_preference" | "theme_preference"
>;

export class Profile
  extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes
{
  public id!: number;
  public user_id!: number;
  public display_name!: string | null;
  public bio!: string | null;
  public avatar_url!: string | null;
  public language_preference!: string;
  public theme_preference!: string;

  public getUser!: () => Promise<any>;
  public setUser!: (user: any) => Promise<void>;

  public static associate(models: any) {
    Profile.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  }
}

Profile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    language_preference: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "en",
    },
    theme_preference: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "light",
    },
  },
  {
    sequelize,
    tableName: "Profiles",
    timestamps: false,
  }
);

export default Profile;
