const pool = require("../config/database"); // 确保路径正确

class CarouselModel {
  // 获取所有轮播图（按排序号升序），返回所有字段
  static async findAll() {
    try {
      const [rows] = await pool.query(
        "SELECT id, image_url, title, description, link, button_text, sort_order, created_at, updated_at FROM carousels ORDER BY sort_order ASC"
      );
      console.log("从数据库查询到的轮播图数据:", rows);
      return rows;
    } catch (error) {
      console.error("CarouselModel查询错误:", error);
      throw error; // 传递错误给服务层处理
    }
  }
}

module.exports = CarouselModel;
