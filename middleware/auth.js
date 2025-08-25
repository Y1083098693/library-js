const express = require("express");
const router = express.Router();
const { generateToken } = require("../utils/jwt"); // 导入认证中间件
const UserController = require("../controllers/userController");

// 所有用户接口都需要认证
router.use(authenticateToken);

// 用户个人信息接口
router.get("/profile", UserController.getProfile);

// 订单接口
router.get("/orders", UserController.getOrders);

// 收藏接口
router.get("/wishlist", UserController.getWishlist);

// 地址接口
router.get("/addresses", UserController.getAddresses);

// 统计接口
router.get("/stats", UserController.getStats);

// 其他用户接口...

module.exports = router;
