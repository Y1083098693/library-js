const pool = require("../config/database");

class BookRepository {
  /**
   * 获取图书列表（支持分页、搜索、分类和排序）
   * @param {Object} options - 查询选项
   * @param {string} options.keyword - 搜索关键词
   * @param {number} options.categoryId - 分类ID
   * @param {string} options.sort - 排序方式
   * @param {number} options.limit - 每页条数
   * @param {number} options.offset - 偏移量
   * @returns {Promise<{books: [], total: number}>}
   */
  static async getBooks({
    keyword = "",
    categoryId = null,
    sort = "new",
    limit,
    offset,
  }) {
    let query = `
      SELECT b.*, c.name as category_name 
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE 1=1
    `;
    let countQuery = "SELECT COUNT(*) as total FROM books WHERE 1=1";
    const params = [];
    const countParams = [];

    // 分类筛选
    if (categoryId) {
      query += " AND b.category_id = ?";
      countQuery += " AND category_id = ?";
      params.push(categoryId);
      countParams.push(categoryId);
    }

    // 搜索关键词
    if (keyword) {
      query += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)";
      countQuery += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)";
      const searchParam = `%${keyword}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    // 排序处理
    switch (sort) {
      case "price_asc":
        query += " ORDER BY b.selling_price ASC";
        break;
      case "price_desc":
        query += " ORDER BY b.selling_price DESC";
        break;
      case "rating":
        query += " ORDER BY b.rating DESC";
        break;
      case "sales":
        query += " ORDER BY b.sales_volume DESC";
        break;
      case "new":
      default:
        query += " ORDER BY b.created_at DESC";
    }

    // 分页处理
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [books] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);

    return {
      books,
      total: totalResult[0].total,
    };
  }

  /**
   * 根据ID获取图书详情
   * @param {number} bookId - 图书ID
   * @returns {Promise<Object>} 图书详情
   */
  static async getBookById(bookId) {
    const [rows] = await pool.execute(
      `SELECT b.*, c.name as category_name 
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [bookId]
    );
    return rows[0] || null;
  }

  /**
   * 获取热门图书
   * @param {number} limit - 数量限制，默认10
   * @returns {Promise<Array>} 热门图书列表
   */
  static async getHotBooks(limit = 10) {
    const [rows] = await pool.execute(
      `SELECT * FROM books 
       WHERE is_hot = TRUE 
       ORDER BY sales_volume DESC 
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  /**
   * 获取新书上架
   * @param {number} limit - 数量限制，默认10
   * @returns {Promise<Array>} 新书列表
   */
  static async getNewBooks(limit = 10) {
    const [rows] = await pool.execute(
      `SELECT * FROM books 
       WHERE is_new = TRUE 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  /**
   * 检查图书是否已被收藏
   * @param {number} bookId - 图书ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否收藏
   */
  static async isFavorite(bookId, userId) {
    const [rows] = await pool.execute(
      "SELECT id FROM favorites WHERE book_id = ? AND user_id = ?",
      [bookId, userId]
    );
    return rows.length > 0;
  }

  /**
   * 添加图书收藏
   * @param {number} bookId - 图书ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 操作结果
   */
  static async addFavorite(bookId, userId) {
    const isFav = await this.isFavorite(bookId, userId);
    if (isFav) {
      throw new Error("已经收藏过这本书了");
    }

    return await pool.execute(
      "INSERT INTO favorites (book_id, user_id, created_at) VALUES (?, ?, NOW())",
      [bookId, userId]
    );
  }

  /**
   * 取消图书收藏
   * @param {number} bookId - 图书ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 操作结果
   */
  static async removeFavorite(bookId, userId) {
    return await pool.execute(
      "DELETE FROM favorites WHERE book_id = ? AND user_id = ?",
      [bookId, userId]
    );
  }
}

module.exports = BookRepository;
