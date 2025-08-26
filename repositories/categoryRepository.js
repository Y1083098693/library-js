const db = require("../config/database");

const categoryRepository = {
  // 获取所有分类（用于导航栏）
  async findAll() {
    try {
      const [rows] = await db.execute(
        `SELECT id, name, slug, description 
         FROM categories 
         WHERE is_active = 1 
         ORDER BY sort_order ASC, name ASC`
      );
      return rows;
    } catch (error) {
      throw new Error(`获取分类列表失败: ${error.message}`);
    }
  },

  // 根据slug获取单个分类详情
  async findBySlug(slug) {
    try {
      const [rows] = await db.execute(
        `SELECT id, name, slug, description 
         FROM categories 
         WHERE slug = ? AND is_active = 1`,
        [slug]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`获取分类详情失败: ${error.message}`);
    }
  },

  // 根据ID获取单个分类详情
  async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT id, name, slug, description 
         FROM categories 
         WHERE id = ? AND is_active = 1`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`获取分类详情失败: ${error.message}`);
    }
  },

  // 获取分类树形结构（包含父子关系）
  async findTree() {
    try {
      const [rows] = await db.execute(`
        SELECT 
          c1.id, 
          c1.name, 
          c1.slug, 
          c1.description,
          c1.parent_id,
          c2.name as parent_name
        FROM categories c1
        LEFT JOIN categories c2 ON c1.parent_id = c2.id
        WHERE c1.is_active = 1
        ORDER BY c1.sort_order ASC, c1.name ASC
      `);
      return rows;
    } catch (error) {
      throw new Error(`获取分类树失败: ${error.message}`);
    }
  },
};

module.exports = categoryRepository;
