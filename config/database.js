const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "library_store",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 添加namedPlaceholders配置，确保参数绑定正确处理
  namedPlaceholders: true,
  // 确保使用utf8mb4编码，避免潜在的字符问题
  charset: "utf8mb4_unicode_ci",
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ 数据库连接成功");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
    return false;
  }
}

// 立即测试连接
testConnection();

// 导出pool对象
module.exports = pool;
