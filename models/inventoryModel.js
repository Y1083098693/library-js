const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Inventory = sequelize.define(
  "Inventory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    low_stock_threshold: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
  },
  {
    tableName: "inventory",
    timestamps: true,
    updatedAt: "updated_at",
    createdAt: false,
    underscored: true,
  }
);

Inventory.associate = function (models) {
  Inventory.belongsTo(models.Book, {
    foreignKey: "book_id",
    as: "book",
  });
};

module.exports = Inventory;
