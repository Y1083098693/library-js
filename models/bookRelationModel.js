const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BookRelation = sequelize.define(
  "BookRelation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    related_book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    relation_type: {
      type: DataTypes.ENUM("similar", "also_bought", "same_author"),
      defaultValue: "similar",
    },
  },
  {
    tableName: "book_relations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
    indexes: [
      {
        fields: ["book_id"],
      },
      {
        fields: ["related_book_id"],
      },
      {
        unique: true,
        fields: ["book_id", "related_book_id"],
      },
    ],
  }
);

// 定义关联关系
BookRelation.associate = function (models) {
  BookRelation.belongsTo(models.Book, {
    foreignKey: "book_id",
    as: "sourceBook",
  });

  BookRelation.belongsTo(models.Book, {
    foreignKey: "related_book_id",
    as: "relatedBook",
  });
};

module.exports = BookRelation;
