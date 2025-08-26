const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    parent_id: {
      type: DataTypes.INTEGER,
    },
    image_url: {
      type: DataTypes.STRING(255),
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "categories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

Category.associate = function (models) {
  Category.hasMany(models.Book, {
    foreignKey: "category_id",
    as: "books",
  });

  Category.belongsTo(models.Category, {
    foreignKey: "parent_id",
    as: "parent",
  });

  Category.hasMany(models.Category, {
    foreignKey: "parent_id",
    as: "children",
  });
};

module.exports = Category;
