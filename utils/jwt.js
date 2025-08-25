const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET 未在环境变量中配置");
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// 生成Token
function generateToken(payload) {
  const safePayload = { ...payload };
  delete safePayload.password;
  return jwt.sign(safePayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// 验证Token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("token已过期");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("无效的token");
    } else {
      throw new Error("token验证失败");
    }
  }
}

// 认证中间件（确保设置req.userId）
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "访问被拒绝，需要token",
    });
  }

  try {
    const decoded = verifyToken(token);
    // 确保设置req.userId（与生成Token时的payload字段一致）
    if (!decoded.id) {
      return res.status(403).json({
        success: false,
        message: "token格式不正确（缺少id）",
      });
    }
    req.userId = decoded.id; // 关键：设置用户ID
    req.username = decoded.username;
    console.log("认证成功，用户ID:", req.userId); // 调试用
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
};
