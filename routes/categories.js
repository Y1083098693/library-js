const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// 获取所有分类
router.get("/", async (req, res) => {
  try {
    const [categories] = await pool.execute(
      "SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order"
    );
    res.json(categories);
  } catch (error) {
    console.error("获取分类错误:", error);
    res.status(500).json({ message: "获取分类失败" });
  }
});

module.exports = router;
