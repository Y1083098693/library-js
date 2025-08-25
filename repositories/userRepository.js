const pool = require("../config/database");
const mysql = require("mysql2/promise");

class UserRepository {
  /**
   * 通过ID查找用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  // 根据ID查找用户（确保返回id）
  static async findById(userId) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, username, nickname, email, phone, avatar_url, points FROM users WHERE id = ?",
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("findById 错误:", error);
      throw error;
    }
  }

  /**
   * 获取取取用户订单列表
   * @param {number} userId - 用户ID
   * @param {string} status - 订单状态，默认'all'
   * @param {number} limit - 每页条数
   * @param {number} offset - 偏移量
   * @returns {Promise<{orders: [], total: number}>}
   */
  // 修改getOrders方法，确保参数正确匹配
  static async getOrders(userId, status = "all", limit = 10, offset = 0) {
    // 1. 严格验证参数
    const validUserId = Number(userId);
    if (isNaN(validUserId) || validUserId <= 0) {
      console.error("无效的用户ID:", userId);
      return { orders: [], total: 0 };
    }

    const validLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const validOffset = Math.max(Number(offset) || 0, 0);

    // 2. 构建查询 - 分开处理以避免参数混淆
    let baseQuery = "SELECT * FROM orders WHERE user_id = ?";
    let countBaseQuery =
      "SELECT COUNT(*) as total FROM orders WHERE user_id = ?";
    const params = [validUserId];
    const countParams = [validUserId];

    // 处理状态筛选
    if (status && status !== "all") {
      baseQuery += " AND status = ?";
      countBaseQuery += " AND status = ?";
      params.push(status);
      countParams.push(status);
    }

    // 3. 分页查询 - 使用单独的参数数组避免混淆
    const paginationParams = [...params, validLimit, validOffset];
    const fullQuery = `${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    try {
      // 关键修复：使用命名参数或单独的参数数组
      // 方案1：使用数组形式传递（最兼容）
      const [orders] = await pool.query(fullQuery, paginationParams);

      // 计数查询
      const [totalResult] = await pool.query(countBaseQuery, countParams);

      return {
        orders: Array.isArray(orders) ? orders : [],
        total: totalResult[0]?.total || 0,
      };
    } catch (error) {
      console.error("获取订单失败:", error);

      // 方案2：作为最后的备选，使用字符串拼接（注意安全）
      try {
        console.log("尝试字符串拼接方式执行...");
        const safeUserId = mysql.escape(validUserId);
        const safeLimit = mysql.escape(validLimit);
        const safeOffset = mysql.escape(validOffset);
        let safeQuery = `SELECT * FROM orders WHERE user_id = ${safeUserId}`;

        if (status && status !== "all") {
          const safeStatus = mysql.escape(status);
          safeQuery += ` AND status = ${safeStatus}`;
        }

        safeQuery += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

        const [orders] = await pool.query(safeQuery);
        const [totalResult] = await pool.query(
          `SELECT COUNT(*) as total FROM orders WHERE user_id = ${safeUserId}` +
            (status && status !== "all"
              ? ` AND status = ${mysql.escape(status)}`
              : "")
        );

        return {
          orders: Array.isArray(orders) ? orders : [],
          total: totalResult[0]?.total || 0,
        };
      } catch (fallbackError) {
        console.error("备选方案执行失败:", fallbackError);
        throw new Error("获取订单失败，请稍后重试");
      }
    }
  }

  /**
   * 获取用户收藏列表
   * @param {number} userId - 用户ID
   * @param {number} limit - 每页条数
   * @param {number} offset - 偏移量
   * @returns {Promise<{favorites: [], total: number}>}
   */
  static async getFavorites(userId, limit, offset) {
    // 修复了此处重复的async关键字
    const query = `
      SELECT b.* FROM books b
      JOIN favorites f ON b.id = f.book_id
      WHERE f.user_id = ${userId}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM favorites WHERE user_id = ${userId}
    `;

    const [favorites] = await pool.execute(query);
    const [totalResult] = await pool.execute(countQuery);

    return {
      favorites,
      total: totalResult[0].total,
    };
  }

  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  // 获取用户个人资料
  static async getUserProfile(userId) {
    try {
      // 明确查询id字段，确保返回
      const [rows] = await pool.execute(
        `SELECT id, username, nickname, email, phone, bio, 
                avatar_url, gender, birth_date, points, created_at 
         FROM users 
         WHERE id = ?`,
        [userId]
      );

      const user = rows[0] || null;
      // 调试日志：检查查询结果是否包含id
      console.log(
        `查询用户ID ${userId} 的资料:`,
        user ? `包含id: ${!!user.id}` : "用户不存在"
      );

      return user;
    } catch (error) {
      console.error("getUserProfile 错误:", error);
      throw error;
    }
  }

  /**
   * 按用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object>} 用户数据
   */
  // 根据用户名查找用户
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?",
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("findByUsername 错误:", error);
      throw error;
    }
  }
  catch(error) {
    console.error("按用户名查找用户失败:", error);
    throw error;
  }

  static async createUser(userData) {
    const { username, password, email, phone } = userData;

    if (!username || !password || !email) {
      throw new Error("用户名、密码和邮箱为必填项");
    }

    try {
      // 1. 检查用户名是否是否已存在
      const [existingUsers] = await pool.execute(
        "SELECT id FROM users users WHERE username = ?",
        [username]
      );

      if (existingUsers.length > 0) {
        throw new Error("用户名已存在");
      }

      // 2. 加密密码
      const bcrypt = require("bcrypt");
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("生成的密码哈希:", hashedPassword); // 必须看到这个日志

      // 3. 写入数据库（强制使用password_hash字段）
      const [result] = await pool.execute(
        `INSERT INTO users 
       (username, password_hash, email, phone, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
        [username, hashedPassword, email, phone]
      );

      console.log("用户写入数据库成功，ID:", result.insertId); // 必须看到这个日志
      return { id: result.insertId, username, email };
    } catch (error) {
      console.error("用户创建失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户资料，包括用户名
   * @param {number} userId - 用户ID
   * @param {Object} data - 要更新的用户数据
   * @returns {Promise<Object>} 操作结果
   */
  // 更新用户资料
  static async updateProfile(userId, updateData) {
    try {
      // 确保所有参数都有定义，未提供的参数使用null
      const username =
        updateData.username !== undefined ? updateData.username : null;
      const email = updateData.email !== undefined ? updateData.email : null;
      const nickname =
        updateData.nickname !== undefined ? updateData.nickname : null;
      const phone = updateData.phone !== undefined ? updateData.phone : null;
      const bio = updateData.bio !== undefined ? updateData.bio : null;

      // 检查必填参数
      if (
        email === null &&
        nickname === null &&
        phone === null &&
        bio === null
      ) {
        throw new Error("没有提供任何可更新的字段");
      }

      const [result] = await pool.execute(
        `UPDATE users SET 
         username = COALESCE(?, username),
         email = COALESCE(?, email),
         nickname = COALESCE(?, nickname),
         phone = COALESCE(?, phone),
         bio = COALESCE(?, bio),
         updated_at = NOW() 
         WHERE id = ?`,
        [username, email, nickname, phone, bio, userId]
      );
      return result;
    } catch (error) {
      console.error("updateProfile 错误:", error);
      throw error;
    }
  }

  /**
   * 更新用户密码
   * @param {number} userId - 用户ID
   * @param {string} hashedPassword - 加密后的密码
   * @returns {Promise<Object>} 操作结果
   */
  // 更新密码
  static async updatePassword(userId, hashedPassword) {
    try {
      const [result] = await pool.execute(
        "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
        [hashedPassword, userId]
      );
      return result;
    } catch (error) {
      console.error("updatePassword 错误:", error);
      throw error;
    }
  }

  /**
   * 获取用户地址列表
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 地址列表
   */
  static async getAddresses(userId) {
    const [tableCheck] = await pool.execute(
      "SHOW TABLES LIKE 'user_addresses'"
    );

    if (tableCheck.length === 0) {
      await pool.execute(`
        CREATE TABLE user_addresses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          recipient_name VARCHAR(50) NOT NULL,
          recipient_phone VARCHAR(20) NOT NULL,
          province VARCHAR(20) NOT NULL,
          city VARCHAR(20) NOT NULL,
          district VARCHAR(20) NOT NULL,
          detail_address VARCHAR(200) NOT NULL,
          is_default TINYINT(1) DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    }

    const [addresses] = await pool.execute(
      "SELECT * FROM user_addresses WHERE user_id = ?",
      [userId]
    );

    return addresses;
  }

  /**
   * 获取用户统计数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 统计数据
   */
  static async getStats(userId) {
    const [orderCount] = await pool.execute(
      "SELECT COUNT(*) as total FROM orders WHERE user_id = ?",
      [userId]
    );

    const [favoriteCount] = await pool.execute(
      "SELECT COUNT(*) as total FROM favorites WHERE user_id = ?",
      [userId]
    );

    const [spendTotal] = await pool.execute(
      "SELECT IFNULL(SUM(final_amount), 0) as total FROM orders WHERE user_id = ?",
      [userId]
    );

    return {
      orderTotal: orderCount[0].total,
      favoriteTotal: favoriteCount[0].total,
      spendTotal: spendTotal[0].total,
    };
  }

  /**
   * 更新用户头像
   * @param {number} userId - 用户ID
   * @param {string} avatarUrl - 头像URL
   * @returns {Promise<Object>} 操作结果
   */
  // 更新用户头像
  static async updateAvatar(userId, avatarUrl) {
    try {
      const [result] = await pool.execute(
        "UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?",
        [avatarUrl, userId]
      );
      return result;
    } catch (error) {
      console.error("updateAvatar 错误:", error);
      throw error;
    }
  }
}

module.exports = UserRepository;
