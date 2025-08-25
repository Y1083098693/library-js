const express = require("express");
const router = express.Router();
const CarouselService = require("../services/carouselService");

router.get("/", async (req, res) => {
  try {
    console.log("接收到轮播图数据请求");
    const carousels = await CarouselService.getAllCarousels();

    // 检查是否有数据
    if (!carousels || carousels.length === 0) {
      console.log("未查询到轮播图数据");
      return res.status(200).json({
        success: true,
        data: [],
        message: "暂无轮播图数据",
      });
    }

    res.status(200).json({
      success: true,
      data: carousels,
    });
  } catch (error) {
    console.error("轮播图接口错误:", error);
    res.status(500).json({
      success: false,
      message: error.message || "获取轮播图数据失败",
      // 开发环境可返回错误详情，生产环境移除
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
