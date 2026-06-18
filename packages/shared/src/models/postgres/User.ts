import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/connection";

// Define User attributes interface
export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: "user" | "moderator" | "admin";
  is_validated: boolean;
  created_at: Date;
  updated_at: Date;
}

// Define optional fields for creation
export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "id" | "is_validated" | "created_at" | "updated_at"
  > {}

// Define the User model
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public role!: "user" | "moderator" | "admin";
  public is_validated!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association methods
  public getProfile!: () => Promise<any>;
  public setProfile!: (profile: any) => Promise<void>;

  public static associate(models: any) {
    User.hasOne(models.Profile, { foreignKey: "user_id", as: "profile" });
    User.hasMany(models.Follower, {
      foreignKey: "follower_id",
      as: "following",
    });
    User.hasMany(models.Follower, {
      foreignKey: "following_id",
      as: "followers",
    });
    User.hasMany(models.Ban, { foreignKey: "user_id", as: "bans" });
    User.hasMany(models.Ban, { foreignKey: "banned_by", as: "issuedBans" });
  }
}

// Initialize the User model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.ENUM("user", "moderator", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    is_validated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default User;
