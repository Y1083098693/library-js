const BookService = require("../services/bookService");
const ApiError = require("../utils/apiError"); // 假设有自定义错误类

class BookController {
  // 获取书本详情
  static async getBookDetail(req, res, next) {
    try {
      const book = await BookService.getBookById(req.params.id);

      if (!book) {
        throw new ApiError(404, "图书不存在");
      }

      res.json({
        success: true,
        data: {
          ...book,
          // 添加前端需要的额外字段
          discount:
            book.original_price > 0
              ? Math.round((1 - book.selling_price / book.original_price) * 100)
              : 0,
          is_in_wishlist: false, // 需根据用户登录状态补充
        },
      });
    } catch (error) {
      next(error); // 统一错误处理
    }
  }

  // 获取相关推荐书本
  static async getRelatedBooks(req, res, next) {
    try {
      const relatedBooks = await BookService.getRelatedBooks(req.params.id);

      res.json({
        success: true,
        data: relatedBooks.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          cover_image: book.cover_image,
          price: book.selling_price,
          original_price: book.original_price,
          rating: book.rating,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BookController;
