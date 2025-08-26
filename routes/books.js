const express = require("express");
const router = express.Router();
const BookService = require("../services/bookService");

// 获取所有图书（支持分页、筛选、排序和搜索）
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sort, search } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // 使用服务层
    const result = await BookService.getBooks({
      keyword: search,
      categoryId: category,
      sort,
      page: pageNum,
      limit: limitNum,
    });

    res.json({
      success: true,
      data: result.books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum),
      },
    });
  } catch (error) {
    console.error("获取图书列表错误:", error);
    res.status(500).json({
      success: false,
      message: "获取图书列表失败",
    });
  }
});

// 根据分类获取图书
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12, sort = "recommended" } = req.query;

    // 参数验证
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const categoryIdNum = parseInt(categoryId);

    if (isNaN(categoryIdNum)) {
      return res.status(400).json({
        success: false,
        message: "分类ID必须是数字",
      });
    }

    // 获取数据
    const result = await BookService.getBooksByCategory(categoryIdNum, {
      page: pageNum,
      limit: limitNum,
      sort,
    });

    // 标准化响应格式
    res.json({
      success: true,
      data: result.books, // 直接返回数组
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("根据分类获取图书错误:", error);
    res.status(500).json({
      success: false,
      message: error.message || "根据分类获取图书失败",
    });
  }
});

// 获取图书详情
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const book = await BookService.getBookById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "图书不存在",
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("获取图书详情错误:", error);
    res.status(500).json({
      success: false,
      message: "获取图书详情失败",
    });
  }
});

// 获取热门图书
router.get("/featured/hot", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await BookService.getHotBooks(parseInt(limit));

    res.json({
      success: true,
      data: books,
    });
  } catch (error) {
    console.error("获取热门图书错误:", error);
    res.status(500).json({
      success: false,
      message: "获取热门图书失败",
    });
  }
});

// 获取新书上架
router.get("/featured/new", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await BookService.getNewBooks(parseInt(limit));

    res.json({
      success: true,
      data: books,
    });
  } catch (error) {
    console.error("获取新书错误:", error);
    res.status(500).json({
      success: false,
      message: "获取新书失败",
    });
  }
});

module.exports = router;
