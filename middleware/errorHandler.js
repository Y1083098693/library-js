// middleware/errorHandler.js (简化版)
const errorHandler = (err, req, res, next) => {
  console.error("错误堆栈:", err.stack);

  // 处理特定的错误消息
  if (err.message === "用户名或密码错误") {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message === "用户名已存在" || err.message === "邮箱已被注册") {
    return res.status(409).json({
      success: false,
      message: err.message,
    });
  }

  // 处理其他类型的错误
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "数据验证失败",
      errors: err.errors,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "无效的ID格式",
    });
  }

  // 默认错误处理
  console.error("未捕获的错误:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development" ? err.message : "服务器内部错误",
  });
};

module.exports = errorHandler;
