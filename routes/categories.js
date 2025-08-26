const express = require("express");
const router = express.Router();
const categoryService = require("../services/categoryService");

// 获取所有分类（用于导航栏）
router.get("/", async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories();
    res.json({
      success: true,
      data: categories,
      message: "获取分类列表成功",
    });
  } catch (error) {
    next(error);
  }
});

// 根据slug获取分类详情
router.get("/slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);
    res.json({
      success: true,
      data: category,
      message: "获取分类详情成功",
    });
  } catch (error) {
    if (error.message === "分类不存在") {
      return res.status(404).json({
        success: false,
        message: "分类不存在",
      });
    }
    next(error);
  }
});

// 根据ID获取分类详情
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(parseInt(id));
    res.json({
      success: true,
      data: category,
      message: "获取分类详情成功",
    });
  } catch (error) {
    if (error.message === "分类不存在") {
      return res.status(404).json({
        success: false,
        message: "分类不存在",
      });
    }
    next(error);
  }
});

// 获取分类树形结构
router.get("/tree/structure", async (req, res, next) => {
  try {
    const categoryTree = await categoryService.getCategoryTree();
    res.json({
      success: true,
      data: categoryTree,
      message: "获取分类树成功",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
