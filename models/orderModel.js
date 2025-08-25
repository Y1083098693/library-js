const pool = require("../config/database");

class OrderModel {
  // 根据用户ID查询订单
  static async findByUserId(userId, status, limit, offset) {
    // 转换为数字类型
    const numericUserId = Number(userId);
    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    // 验证参数
    if (isNaN(numericUserId) || isNaN(numericLimit) || isNaN(numericOffset)) {
      throw new Error("订单查询参数必须为数字");
    }

    let query = `
      SELECT * FROM orders 
      WHERE user_id = ? 
    `;
    const params = [numericUserId];

    // 支持按状态筛选
    if (status !== "all") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(numericLimit, numericOffset);

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 统计订单总数
  static async countByUserId(userId, status) {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      throw new Error("用户ID必须为数字");
    }

    let query = "SELECT COUNT(*) as total FROM orders WHERE user_id = ?";
    const params = [numericUserId];

    if (status !== "all") {
      query += " AND status = ?";
      params.push(status);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  }
}

module.exports = OrderModel;
