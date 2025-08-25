require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// CORS配置 - 允许前端跨域请求
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 中间件配置
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析表单请求体
// 配置静态文件服务，让前端可以访问上传的头像
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 导入路由
const bookRoutes = require("./routes/books");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const categoryRoutes = require("./routes/categories");
const carouselRoutes = require("./routes/carouselRoutes");
const errorHandler = require("./middleware/errorHandler");

// 基础路由
app.get("/", (req, res) => {
  res.json({ message: "书城后端API服务运行中" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 注册业务路由
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/carousels", carouselRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 错误处理中间件（需放在所有路由之后）
app.use(errorHandler);

// 404路由处理
app.use("*", (req, res) => {
  res.status(404).json({ message: "接口不存在" });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(
    `静态资源托管路径: /uploads -> ${path.join(__dirname, "uploads")}`
  );
});
