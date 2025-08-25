// models/userModel.js
const pool = require("../config/database"); // 确保路径正确

class UserModel {
  // 检查用户名是否存在
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, username, password_hash, email, points FROM users WHERE username = ?",
        [username]
      );
      return rows[0] || null; // 明确返回查询到的用户对象
    } catch (error) {
      console.error("findByUsername错误:", error);
      throw error;
    }
  }

  // 检查邮箱是否存在
  static async findByEmail(email) {
    try {
      if (!email) return null;

      const [rows] = await pool.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      return rows[0];
    } catch (error) {
      console.error("findByEmail错误:", error);
      throw error;
    }
  }

  // 创建新用户
  static async create(userData) {
    try {
      const { username, passwordHash, email } = userData;
      const [result] = await pool.execute(
        "INSERT INTO users (username, password_hash, email, points, created_at) VALUES (?, ?, ?, 100, NOW())",
        [username, passwordHash, email || null]
      );
      return result;
    } catch (error) {
      console.error("create用户错误:", error);
      throw error;
    }
  }

  // 根据ID查找用户 - 合并重复的方法
  static async findById(userId) {
    try {
      // 合并两个查询，返回所有需要的字段
      const [rows] = await pool.execute(
        "SELECT id, username, email, phone, avatar_url, gender, birth_date, points, created_at FROM users WHERE id = ?",
        [userId]
      );
      return rows[0];
    } catch (error) {
      console.error("findById错误:", error);
      throw error;
    }
  }

  // 更新用户信息
  static async update(userId, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach((key) => {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      });

      values.push(userId);

      const [result] = await pool.execute(
        `UPDATE users SET ${fields.join(
          ", "
        )}, updated_at = NOW() WHERE id = ?`,
        values
      );

      return result;
    } catch (error) {
      console.error("update用户错误:", error);
      throw error;
    }
  }
}

module.exports = UserModel;
