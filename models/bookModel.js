const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Book = sequelize.define(
  "Book",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    isbn: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    subtitle: {
      type: DataTypes.STRING(200),
    },
    author: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    translator: {
      type: DataTypes.STRING(100),
    },
    publisher: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    publish_date: {
      type: DataTypes.DATEONLY,
    },
    language: {
      type: DataTypes.STRING(20),
      defaultValue: "中文",
    },
    pages: {
      type: DataTypes.INTEGER,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sales_volume: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    details: {
      type: DataTypes.TEXT,
    },
    author_intro: {
      type: DataTypes.TEXT,
    },
    is_hot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_new: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
    },
    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "books",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
    indexes: [
      {
        fields: ["category_id"],
      },
      {
        fields: ["isbn"],
        unique: true,
      },
      {
        fields: ["author"],
      },
      {
        fields: ["title"],
      },
    ],
  }
);

// 定义关联关系
Book.associate = function (models) {
  Book.belongsTo(models.Category, {
    foreignKey: "category_id",
    as: "category",
  });

  Book.hasMany(models.Review, {
    foreignKey: "book_id",
    as: "reviews",
  });

  Book.hasOne(models.Inventory, {
    foreignKey: "book_id",
    as: "inventory",
  });

  Book.belongsToMany(models.Book, {
    through: "book_relations",
    as: "relatedBooks",
    foreignKey: "book_id",
    otherKey: "related_book_id",
  });
};

module.exports = Book;
