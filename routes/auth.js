const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

// 修复1：导入你的用户模型（根据实际路径调整）
const UserModel = require("../models/userModel"); // 关键：导入正确的用户模型

// 登录接口
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证请求数据
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "请提供用户名和密码",
      });
    }

    // 修复2：使用模型的findByUsername方法查询用户
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    // 修复3：验证密码（注意你的模型中存储的是password_hash字段）
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    // 生成Token（确保使用用户的id字段）
    const tokenPayload = {
      id: user.id, // 你的用户表主键是id，正确
      username: user.username,
    };
    const token = generateToken(tokenPayload);

    // 返回响应（匹配模型中的字段）
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || "",
        points: user.points || 0, // 包含用户积分（可选）
      },
    });
  } catch (error) {
    console.error("登录接口错误:", error);
    return res.status(500).json({
      success: false,
      message: "登录失败，请稍后重试",
    });
  }
});

// 注册接口（补充完整，与你的模型匹配）
router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 验证数据
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "用户名和密码不能为空",
      });
    }

    // 检查用户名是否已存在
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "用户名已被占用",
      });
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "邮箱已被注册",
        });
      }
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户（使用模型的create方法）
    const result = await UserModel.create({
      username,
      passwordHash, // 注意模型中参数是passwordHash
      email,
    });

    return res.status(201).json({
      success: true,
      message: "注册成功，请登录",
      userId: result.insertId, // 返回新创建的用户ID
    });
  } catch (error) {
    console.error("注册接口错误:", error);
    return res.status(500).json({
      success: false,
      message: "注册失败，请稍后重试",
    });
  }
});

module.exports = router;
