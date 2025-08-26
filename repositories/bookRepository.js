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
  // 获取书本详情（与分类页面保持一致）
  async getBookById(id) {
    try {
      const [rows] = await db.execute(
        `
      SELECT 
        b.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(i.quantity, 0) as stock_quantity
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN inventory i ON b.id = i.book_id
      WHERE b.id = ?
    `,
        [id]
      );

      return rows[0] || null;
    } catch (error) {
      console.error("获取图书详情错误:", error);
      throw error;
    }
  },

  // 新增：获取分类书本（排除特定书本）
  async getBooksByCategoryExclude(categoryId, excludeId, limit = 4) {
    try {
      const [rows] = await db.execute(
        `
      SELECT 
        b.*,
        c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.category_id = ? AND b.id != ?
      ORDER BY RAND() -- 随机排序获取不同推荐
      LIMIT ?
    `,
        [categoryId, excludeId, limit]
      );

      return rows;
    } catch (error) {
      console.error("获取分类图书错误:", error);
      return []; // 出错返回空数组
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
  // 新增：获取相关书本（基于关联表）
  async getRelatedBooks(bookId) {
    try {
      const [rows] = await db.execute(
        `
        SELECT b.* FROM book_relations br
        JOIN books b ON br.related_book_id = b.id
        WHERE br.book_id = ?
        ORDER BY br.relation_type DESC
        LIMIT 4
      `,
        [bookId]
      );

      return rows;
    } catch (error) {
      console.error("获取相关书本错误:", error);
      throw error;
    }
  },
  // 增强获取书本详情方法
  async getBookDetailWithRelations(id) {
    try {
      const [books] = await db.execute(
        `
      SELECT 
        b.*,
        c.name AS category_name,
        c.slug AS category_slug,
        i.quantity AS stock_quantity,
        -- 计算折扣率
        CASE 
          WHEN b.original_price > 0 AND b.selling_price > 0 
          THEN ROUND((1 - b.selling_price / b.original_price) * 100)
          ELSE 0 
        END AS discount_rate
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN inventory i ON b.id = i.book_id
      WHERE b.id = ?
    `,
        [id]
      );

      if (!books || books.length === 0) return null;

      const book = books[0];

      // 获取相关书本（避免重复）
      const [relatedBooks] = await db.execute(
        `
      SELECT DISTINCT
        b.id,
        b.title, 
        b.author,
        b.cover_image,
        b.selling_price AS price,
        b.original_price,
        b.rating,
        b.review_count
      FROM book_relations br
      JOIN books b ON br.related_book_id = b.id
      WHERE br.book_id = ? AND b.id != ?
      LIMIT 4
    `,
        [id, id]
      );

      return {
        ...book,
        related_books: relatedBooks || [],
      };
    } catch (error) {
      console.error("获取书本详情错误:", error);
      throw error;
    }
  },
};

module.exports = BookRepository;
