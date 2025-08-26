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
  // 新增：获取相关推荐书本
  static async getRelatedBooks(bookId) {
    try {
      // 方法1：使用关联表查询（推荐）
      const relatedBooks = await BookRepository.getRelatedBooks(bookId);

      // 方法2：若无关联表，按分类随机推荐（备用方案）
      // const book = await this.getBookById(bookId);
      // const relatedBooks = await BookRepository.getBooksByCategory(
      //   book.category_id,
      //   { limit: 4, exclude: bookId }
      // );

      return relatedBooks;
    } catch (error) {
      console.error("获取相关推荐失败:", error);
      throw error;
    }
  }
  static async getBookDetail(id) {
    try {
      // 使用与分类页面相同的数据获取逻辑
      const book = await BookRepository.getBookById(id);

      if (!book) {
        throw new ApiError(404, "图书不存在");
      }

      // 确保价格数据正确 - 关键修复！
      const price =
        parseFloat(book.selling_price) || parseFloat(book.price) || 0;
      const originalPrice = parseFloat(book.original_price) || price;

      // 计算有效折扣
      const discount =
        originalPrice > 0 && price > 0 && price < originalPrice
          ? Math.round((1 - price / originalPrice) * 100)
          : 0;

      // 获取相关推荐 - 使用与分类页面相同的逻辑
      const relatedBooks = await this.getBooksByCategory(book.category_id, {
        limit: 4,
        exclude: id, // 排除当前书本
      });

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        cover_image: book.cover_image || "/images/default-book.jpg",
        price: price,
        original_price: originalPrice,
        discount: discount,
        rating: parseFloat(book.rating) || 0,
        reviews: parseInt(book.review_count) || 0,
        description: book.description || "暂无内容简介",
        category: book.category_name,
        stock: parseInt(book.stock_quantity) || 0,
        is_available: parseInt(book.stock_quantity) > 0,
        related_books: relatedBooks.books || [], // 使用分类页面相同的数据结构
      };
    } catch (error) {
      console.error("获取书本详情服务错误:", error);
      throw error;
    }
  }
}

module.exports = BookService;
