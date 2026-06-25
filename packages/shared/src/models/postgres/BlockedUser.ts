import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/connection";

export interface BlockedUserAttributes {
  id: number;
  blocker_id: number;
  blocked_id: number;
  created_at: Date;
}

export type BlockedUserCreationAttributes = Optional<BlockedUserAttributes, "id" | "created_at">;

export class BlockedUser
  extends Model<BlockedUserAttributes, BlockedUserCreationAttributes>
  implements BlockedUserAttributes
{
  public id!: number;
  public blocker_id!: number;
  public blocked_id!: number;
  public readonly created_at!: Date;

  public getBlocker!: () => Promise<any>;
  public setBlocker!: (user: any) => Promise<void>;
  public getBlocked!: () => Promise<any>;
  public setBlocked!: (user: any) => Promise<void>;

  public static associate(models: any) {
    BlockedUser.belongsTo(models.User, {
      foreignKey: "blocker_id",
      as: "blocker",
    });
    BlockedUser.belongsTo(models.User, {
      foreignKey: "blocked_id",
      as: "blocked",
    });
  }
}

BlockedUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    blocker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    blocked_id: {
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
    tableName: "BlockedUsers",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["blocker_id", "blocked_id"],
      },
    ],
  }
);

export default BlockedUser;
