const pool = require("../config/database");

class OrderRepository {
  /**
   * 创建新订单
   * @param {Object} orderData - 订单数据
   * @param {number} orderData.user_id - 用户ID
   * @param {Array} orderData.items - 订单项列表
   * @param {number} orderData.total_amount - 总金额
   * @param {number} orderData.final_amount - 最终支付金额
   * @param {number} orderData.address_id - 地址ID
   * @returns {Promise<Object>} 新创建的订单
   */
  static async createOrder(orderData) {
    const { user_id, items, total_amount, final_amount, address_id } =
      orderData;

    // 使用事务确保数据一致性
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 创建订单主记录
      const [orderResult] = await connection.execute(
        `INSERT INTO orders 
         (user_id, total_amount, final_amount, address_id, status, created_at) 
         VALUES (?, ?, ?, ?, 'pending', NOW())`,
        [user_id, total_amount, final_amount, address_id]
      );

      const orderId = orderResult.insertId;

      // 创建订单项
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items 
           (order_id, book_id, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [orderId, item.book_id, item.quantity, item.price]
        );
      }

      await connection.commit();
      return this.getOrderById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 根据ID获取订单详情
   * @param {number} orderId - 订单ID
   * @returns {Promise<Object>} 订单详情（包含订单项）
   */
  static async getOrderById(orderId) {
    // 获取订单基本信息
    const [orderRows] = await pool.execute(
      `SELECT o.*, a.recipient_name, a.recipient_phone, 
              a.province, a.city, a.district, a.detail_address
       FROM orders o
       LEFT JOIN user_addresses a ON o.address_id = a.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return null;
    }

    // 获取订单项
    const [itemRows] = await pool.execute(
      `SELECT oi.*, b.title, b.cover_url 
       FROM order_items oi
       LEFT JOIN books b ON oi.book_id = b.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return {
      ...orderRows[0],
      items: itemRows,
    };
  }

  /**
   * 获取用户订单列表
   * @param {number} userId - 用户ID
   * @param {string} status - 订单状态筛选
   * @param {number} limit - 每页条数
   * @param {number} offset - 偏移量
   * @returns {Promise<{orders: [], total: number}>}
   */
  static async getUserOrders(userId, status = "all", limit, offset) {
    let query = `
      SELECT o.*, a.recipient_name 
      FROM orders o
      LEFT JOIN user_addresses a ON o.address_id = a.id
      WHERE o.user_id = ?
    `;
    let countQuery = "SELECT COUNT(*) as total FROM orders WHERE user_id = ?";
    const params = [userId];
    const countParams = [userId];

    // 状态筛选
    if (status !== "all") {
      query += " AND o.status = ?";
      countQuery += " AND status = ?";
      params.push(status);
      countParams.push(status);
    }

    // 排序和分页
    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [orders] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);

    return {
      orders,
      total: totalResult[0].total,
    };
  }

  /**
   * 更新订单状态
   * @param {number} orderId - 订单ID
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 操作结果
   */
  static async updateOrderStatus(orderId, status) {
    return await pool.execute(
      "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, orderId]
    );
  }
}

module.exports = OrderRepository;
