const CarouselModel = require("../models/carouselModel");

class CarouselService {
  // 获取所有轮播图数据，保持与数据库字段一致
  static async getAllCarousels() {
    try {
      const carousels = await CarouselModel.findAll();

      // 不转换字段名，保持与数据库一致（避免前端混淆）
      return carousels.map((carousel) => ({
        id: carousel.id,
        image_url: carousel.image_url, // 保持下划线格式，与数据库一致
        title: carousel.title,
        description: carousel.description,
        link: carousel.link,
        button_text: carousel.button_text, // 保持下划线格式
        sort_order: carousel.sort_order,
        created_at: carousel.created_at,
        updated_at: carousel.updated_at,
      }));
    } catch (error) {
      console.error("CarouselService获取数据失败:", error);
      throw new Error("获取轮播图数据失败: " + error.message);
    }
  }
}

module.exports = CarouselService;
