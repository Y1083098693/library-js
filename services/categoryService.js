const categoryRepository = require("../repositories/categoryRepository");

const categoryService = {
  // 获取所有分类
  async getCategories() {
    try {
      return await categoryRepository.findAll();
    } catch (error) {
      throw error;
    }
  },

  // 根据slug获取分类
  async getCategoryBySlug(slug) {
    try {
      const category = await categoryRepository.findBySlug(slug);
      if (!category) {
        throw new Error("分类不存在");
      }
      return category;
    } catch (error) {
      throw error;
    }
  },

  // 根据ID获取分类
  async getCategoryById(id) {
    try {
      const category = await categoryRepository.findById(id);
      if (!category) {
        throw new Error("分类不存在");
      }
      return category;
    } catch (error) {
      throw error;
    }
  },

  // 获取分类树
  async getCategoryTree() {
    try {
      const categories = await categoryRepository.findTree();

      // 构建树形结构
      const categoryMap = new Map();
      const rootCategories = [];

      // 首先将所有分类存入map
      categories.forEach((category) => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      // 构建树形结构
      categories.forEach((category) => {
        const node = categoryMap.get(category.id);
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootCategories.push(node);
        }
      });

      return rootCategories;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = categoryService;
