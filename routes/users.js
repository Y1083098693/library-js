const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utils/jwt");
const multer = require("multer");
const path = require("path");
const UserService = require("../services/userService");
const UserRepository = require("../repositories/userRepository"); // 引入封装的查询类
const fs = require("fs");

// 头像上传配置
const uploadDir = path.join(__dirname, "../uploads/avatars");
// 确保上传目录存在
try {
  fs.accessSync(uploadDir);
} catch (err) {
  // 如果目录不存在则创建
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：用户ID + 时间戳 + 原始扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${req.userId}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});
// 文件过滤
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("只允许上传JPG、PNG或GIF格式的图片"), false);
  }
};

// 配置上传限制
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});
// 上传头像接口
router.post(
  "/avatar",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      // 检查是否有文件上传
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "请选择要上传的图片",
        });
      }

      // 构建头像URL
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // 更新数据库中的头像URL
      await UserRepository.updateAvatar(req.userId, avatarUrl);

      // 返回新的头像URL
      res.json({
        success: true,
        message: "头像上传成功",
        data: {
          avatarUrl: avatarUrl,
        },
      });
    } catch (error) {
      console.error("头像上传错误:", error);

      // 如果有文件已上传但处理失败，删除该文件
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("删除临时文件失败:", unlinkError);
        }
      }

      // 返回适当的错误信息
      if (error.message === "只允许上传JPG、PNG或GIF格式的图片") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "上传失败，请重试",
      });
    }
  }
);

// 1. 获取用户信息
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    // 调试日志：确认当前用户ID
    console.log("获取用户信息，用户ID:", userId);

    const user = await UserRepository.getUserProfile(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    // 关键修复：确保id字段存在于返回数据的顶层
    // 强制构建返回结构，确保id字段
    const userData = {
      id: user.id, // 明确设置id字段
      username: user.username || "",
      nickname: user.nickname || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
      avatar_url: user.avatar_url || "",
      gender: user.gender || "",
      birth_date: user.birth_date || null,
      points: user.points || 0,
      created_at: user.created_at || null,
    };

    // 调试日志：检查返回数据是否包含id
    console.log("返回用户信息:", {
      hasId: !!userData.id,
      idValue: userData.id,
    });

    // 修复：直接返回用户数据，而非嵌套在data.user中
    res.json(userData);
  } catch (error) {
    console.error("获取用户信息错误:", error);
    res.status(500).json({
      success: false,
      message: "获取用户信息失败",
      error: error.message,
    });
  }
});

// 2. 获取用户订单列表
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const { status = "all", page = "1", limit = "10" } = req.query;

    // 参数处理
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = Math.max(0, (pageNum - 1) * limitNum);

    // 调用封装的查询方法
    const { orders, total } = await UserRepository.getOrders(
      req.userId,
      status,
      limitNum,
      offset
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("获取订单列表错误:", error);
    res.status(500).json({ success: false, message: "获取订单列表失败" });
  }
});

// 3. 获取用户收藏列表
router.get("/wishlist", authenticateToken, async (req, res) => {
  try {
    const { page = "1", limit = "10" } = req.query;

    // 参数处理
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = Math.max(0, (pageNum - 1) * limitNum);

    // 调用封装的查询方法
    const { favorites, total } = await UserRepository.getFavorites(
      req.userId,
      limitNum,
      offset
    );

    res.json({
      success: true,
      data: {
        items: favorites,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
        },
      },
    });
  } catch (error) {
    console.error("获取收藏列表错误:", error);
    res.status(500).json({ success: false, message: "获取收藏列表失败" });
  }
});

// 4. 获取用户地址列表
router.get("/addresses", authenticateToken, async (req, res) => {
  try {
    const addresses = await UserRepository.getAddresses(req.userId);

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("获取地址列表错误:", error);
    res.status(500).json({ success: false, message: "获取地址列表失败" });
  }
});

// 5. 获取用户统计数据
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await UserRepository.getStats(req.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("获取用户统计错误:", error);
    res.status(500).json({ success: false, message: "获取用户统计数据失败" });
  }
});
// 更新个人资料接口
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { username, email, nickname, phone, bio } = req.body;

    if (username) {
      const userWithSameUsername = await UserRepository.findByUsername(
        username
      );
      if (userWithSameUsername && userWithSameUsername.id !== req.userId) {
        return res.status(400).json({
          success: false,
          message: "用户名已被使用",
        });
      }
    }

    await UserRepository.updateProfile(req.userId, {
      username,
      email,
      nickname,
      phone,
      bio,
    });

    // 获取更新后的用户资料
    const updatedUser = await UserRepository.findById(req.userId);

    // 确保返回数据包含id
    res.json({
      id: updatedUser.id,
      username: updatedUser.username || "",
      nickname: updatedUser.nickname || "",
      email: updatedUser.email || "",
      phone: updatedUser.phone || "",
      bio: updatedUser.bio || "",
      avatar_url: updatedUser.avatar_url || "",
    });
  } catch (error) {
    console.error("更新个人资料失败:", error);
    res.status(500).json({
      success: false,
      message: error.message || "更新个人资料失败",
    });
  }
});
// 密码修改接口
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "请提供原密码和新密码",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "新密码长度至少为8位",
      });
    }

    const user = await UserRepository.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    // 修复：使用password_hash字段（与数据库一致）
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "原密码不正确",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserRepository.updatePassword(req.userId, hashedPassword);

    res.json({
      success: true,
      message: "密码修改成功",
    });
  } catch (error) {
    console.error("修改密码失败:", error);
    res.status(500).json({
      success: false,
      message: error.message || "修改密码失败",
    });
  }
});
module.exports = router;
