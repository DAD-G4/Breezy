import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/connection";

// Define Ban attributes interface
export interface BanAttributes {
  id: number;
  user_id: number;
  reason: string;
  banned_by: number;
  expires_at: Date | null;
  created_at: Date;
}

// Define optional fields for creation
export interface BanCreationAttributes
  extends Optional<BanAttributes, "id" | "expires_at" | "created_at"> {}

// Define the Ban model
export class Ban
  extends Model<BanAttributes, BanCreationAttributes>
  implements BanAttributes
{
  public id!: number;
  public user_id!: number;
  public reason!: string;
  public banned_by!: number;
  public expires_at!: Date | null;
  public readonly created_at!: Date;

  // Association methods
  public getUser!: () => Promise<any>;
  public setUser!: (user: any) => Promise<void>;
  public getBanner!: () => Promise<any>;
  public setBanner!: (user: any) => Promise<void>;

  public static associate(models: any) {
    Ban.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "bannedUser",
    });
    Ban.belongsTo(models.User, {
      foreignKey: "banned_by",
      as: "banner",
    });
  }
}

// Initialize the Ban model
Ban.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    banned_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Bans",
    timestamps: false,
  }
);

export default Ban;
