const pool = require("../config/database");

// 获取所有轮播图数据
exports.getAllCarousels = async (req, res) => {
  try {
    // 查询carousels表所有数据，并按sort_order排序
    const [rows] = await db.query(
      "SELECT id, image_url, title, description, link, button_text, sort_order, created_at, updated_at FROM carousels ORDER BY sort_order ASC"
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("获取轮播图数据失败:", error);
    res.status(500).json({
      success: false,
      message: "获取轮播图数据失败",
    });
  }
};
