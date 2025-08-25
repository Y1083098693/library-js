const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utils/jwt");
// 引入订单数据访问层
const OrderRepository = require("../repositories/orderRepository");

// 创建新订单
router.post("/", authenticateToken, async (req, res) => {
  try {
    const orderData = {
      user_id: req.userId,
      ...req.body, // 应包含 items, total_amount, final_amount, address_id
    };

    // 基本参数验证
    if (!orderData.items || !orderData.items.length) {
      return res.status(400).json({ message: "订单不能为空" });
    }

    const newOrder = await OrderRepository.createOrder(orderData);
    res.status(201).json({
      success: true,
      message: "订单创建成功",
      data: { order: newOrder },
    });
  } catch (error) {
    console.error("创建订单错误:", error);
    res.status(500).json({ message: "创建订单失败" });
  }
});

// 获取订单详情
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderRepository.getOrderById(id);

    if (!order) {
      return res.status(404).json({ message: "订单不存在" });
    }

    // 验证订单归属权
    if (order.user_id !== req.userId) {
      return res.status(403).json({ message: "无权访问该订单" });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("获取订单详情错误:", error);
    res.status(500).json({ message: "获取订单详情失败" });
  }
});

// 获取用户订单列表
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { orders, total } = await OrderRepository.getUserOrders(
      req.userId,
      status,
      limitNum,
      offset
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("获取订单列表错误:", error);
    res.status(500).json({ message: "获取订单列表失败" });
  }
});

// 更新订单状态
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "请提供订单状态" });
    }

    // 先验证订单是否存在且属于当前用户
    const order = await OrderRepository.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: "订单不存在" });
    }
    if (order.user_id !== req.userId) {
      return res.status(403).json({ message: "无权修改该订单" });
    }

    // 更新状态
    await OrderRepository.updateOrderStatus(id, status);
    res.json({
      success: true,
      message: "订单状态已更新",
    });
  } catch (error) {
    console.error("更新订单状态错误:", error);
    res.status(500).json({ message: "更新订单状态失败" });
  }
});

module.exports = router;
