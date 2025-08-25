const express = require("express");
const router = express.Router();
// 引入封装的图书数据访问层
const BookRepository = require("../repositories/bookRepository");

// 获取所有图书（支持分页、筛选、排序和搜索）
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sort, search } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // 调用封装的方法，无需关注SQL细节
    const { books, total } = await BookRepository.getBooks({
      keyword: search,
      categoryId: category,
      sort,
      limit: limitNum,
      offset,
    });

    res.json({
      books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("获取图书列表错误:", error);
    res.status(500).json({ message: "获取图书列表失败" });
  }
});

// 获取图书详情
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // 调用封装的方法
    const book = await BookRepository.getBookById(id);

    if (!book) {
      return res.status(404).json({ message: "图书不存在" });
    }

    res.json(book);
  } catch (error) {
    console.error("获取图书详情错误:", error);
    res.status(500).json({ message: "获取图书详情失败" });
  }
});

// 获取热门图书
router.get("/featured/hot", async (req, res) => {
  try {
    // 调用封装的方法
    const books = await BookRepository.getHotBooks();
    res.json(books);
  } catch (error) {
    console.error("获取热门图书错误:", error);
    res.status(500).json({ message: "获取热门图书失败" });
  }
});

// 获取新书上架
router.get("/featured/new", async (req, res) => {
  try {
    // 调用封装的方法
    const books = await BookRepository.getNewBooks();
    res.json(books);
  } catch (error) {
    console.error("获取新书错误:", error);
    res.status(500).json({ message: "获取新书失败" });
  }
});

module.exports = router;
