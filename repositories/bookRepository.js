const db = require("../config/database");

const BookRepository = {
  // 获取所有图书（支持分页、筛选、排序和搜索）
  async getBooks({ keyword, categoryId, sort, limit, offset }) {
    try {
      let query = `
        SELECT 
          b.*,
          c.name as category_name,
          c.slug as category_slug
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE 1=1
      `;
      const params = [];

      // 添加关键词搜索
      if (keyword) {
        query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
        const searchTerm = `%${keyword}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // 添加分类筛选
      if (categoryId) {
        query += ` AND b.category_id = ?`;
        params.push(Number(categoryId)); // 确保是数字
      }

      // 添加排序
      const sortOptions = {
        newest: "b.created_at DESC",
        "price-asc": "b.selling_price ASC",
        "price-desc": "b.selling_price DESC",
        bestseller: "b.sales_volume DESC",
        recommended:
          "b.is_recommended DESC, b.rating DESC, b.sales_volume DESC",
        default: "b.created_at DESC",
      };

      const sortOrder = sortOptions[sort] || sortOptions["default"];
      query += ` ORDER BY ${sortOrder}`;

      // 添加分页 - 关键修复点
      query += ` LIMIT ? OFFSET ?`;
      // 确保limit和offset是数字且顺序正确
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      console.log("执行SQL:", query);
      console.log("参数:", params);

      // 使用connection.query替代execute（解决某些mysql2版本的参数绑定问题）
      const [books] = await db.query(query, params);

      // 获取总数
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE 1=1
      `;
      const countParams = [];

      if (keyword) {
        countQuery += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
        const searchTerm = `%${keyword}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (categoryId) {
        countQuery += ` AND b.category_id = ?`;
        countParams.push(Number(categoryId));
      }

      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      return { books, total };
    } catch (error) {
      console.error("获取图书列表错误:", error);
      throw new Error("获取图书列表失败");
    }
  },

  // 获取图书详情
  async getBookById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          b.*,
          c.name as category_name,
          c.slug as category_slug
         FROM books b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.id = ?`,
        [Number(id)]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("获取图书详情错误:", error);
      throw new Error("获取图书详情失败");
    }
  },

  // 获取热门图书
  async getHotBooks(limit = 10) {
    try {
      const [rows] = await db.execute(
        `SELECT b.*, c.name as category_name 
         FROM books b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.is_hot = 1 
         ORDER BY b.sales_volume DESC 
         LIMIT ?`,
        [Number(limit)]
      );
      return rows;
    } catch (error) {
      console.error("获取热门图书错误:", error);
      throw new Error("获取热门图书失败");
    }
  },

  // 获取新书上架
  async getNewBooks(limit = 10) {
    try {
      const [rows] = await db.execute(
        `SELECT b.*, c.name as category_name 
         FROM books b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.is_new = 1 
         ORDER BY b.created_at DESC 
         LIMIT ?`,
        [Number(limit)]
      );
      return rows;
    } catch (error) {
      console.error("获取新书错误:", error);
      throw new Error("获取新书失败");
    }
  },

  // 根据分类获取图书（支持分页和排序）
  async getBooksByCategory(
    categoryId,
    { page = 1, limit = 12, sort = "recommended" } = {}
  ) {
    try {
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // 参数验证
      if (
        isNaN(parseInt(categoryId, 10)) ||
        isNaN(parseInt(limit, 10)) ||
        isNaN(offset)
      ) {
        throw new Error("Invalid parameters");
      }

      return await this.getBooks({
        categoryId: parseInt(categoryId, 10),
        sort,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      });
    } catch (error) {
      console.error("根据分类获取图书错误:", error);
      throw new Error("根据分类获取图书失败");
    }
  },
};

module.exports = BookRepository;
