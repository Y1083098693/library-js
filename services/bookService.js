const BookRepository = require("../repositories/bookRepository");

class BookService {
  // 获取所有图书
  static async getBooks({ keyword, categoryId, sort, page, limit }) {
    const offset = (page - 1) * limit;
    return await BookRepository.getBooks({
      keyword,
      categoryId,
      sort,
      limit,
      offset,
    });
  }

  // 获取图书详情
  static async getBookById(id) {
    return await BookRepository.getBookById(id);
  }

  // 获取热门图书
  static async getHotBooks(limit = 10) {
    return await BookRepository.getHotBooks(limit);
  }

  // 获取新书上架
  static async getNewBooks(limit = 10) {
    return await BookRepository.getNewBooks(limit);
  }

  // 根据分类获取图书
  static async getBooksByCategory(
    categoryId,
    { page = 1, limit = 12, sort = "recommended" } = {}
  ) {
    try {
      // 参数验证
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const categoryIdNum = parseInt(categoryId);
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      if (isNaN(categoryIdNum) || isNaN(limitNum) || isNaN(offsetNum)) {
        throw new Error("参数类型错误");
      }

      // 获取数据
      const result = await BookRepository.getBooksByCategory(categoryIdNum, {
        page: page,
        limit: limitNum,
        offset: offsetNum,
        sort,
      });

      // 确保返回标准结构
      return {
        books: Array.isArray(result.books) ? result.books : [],
        total: parseInt(result.total) || 0,
      };
    } catch (error) {
      console.error("服务层-根据分类获取图书错误:", error);
      throw error;
    }
  }
}

module.exports = BookService;
