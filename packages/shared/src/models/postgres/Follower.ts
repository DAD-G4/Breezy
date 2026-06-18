import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/connection";

export interface FollowerAttributes {
  id: number;
  follower_id: number;
  following_id: number;
  created_at: Date;
}

export interface FollowerCreationAttributes
  extends Optional<FollowerAttributes, "id" | "created_at"> {}

export class Follower
  extends Model<FollowerAttributes, FollowerCreationAttributes>
  implements FollowerAttributes
{
  public id!: number;
  public follower_id!: number;
  public following_id!: number;
  public readonly created_at!: Date;

  public getFollower!: () => Promise<any>;
  public setFollower!: (user: any) => Promise<void>;
  public getFollowing!: () => Promise<any>;
  public setFollowing!: (user: any) => Promise<void>;

  public static associate(models: any) {
    Follower.belongsTo(models.User, {
      foreignKey: "follower_id",
      as: "follower",
    });
    Follower.belongsTo(models.User, {
      foreignKey: "following_id",
      as: "following",
    });
  }
}

Follower.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    follower_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    following_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Followers",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["follower_id", "following_id"],
      },
    ],
  }
);

export default Follower;
