const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

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

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development" ? err.message : "服务器内部错误",
  });
};

module.exports = errorHandler;
