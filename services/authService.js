const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel");
const { generateToken } = require("../utils/jwt");

class AuthService {
  // 用户注册
  // 修复注册方法，确保密码正确传递
  static async register(userData) {
    try {
      console.log("前端注册提交数据:", userData); // 打印完整注册数据

      // 验证注册数据完整性
      if (!userData?.username || !userData?.password) {
        throw new Error("用户名、密码和邮箱为必填项");
      }

      const response = await api.post("/auth/register", userData);
      const data = response.data || response;

      console.log("注册成功，后端返回:", data);
      return data;
    } catch (error) {
      console.error("注册失败:", error);
      throw new Error(error.response?.data?.message || "注册失败，请重试");
    }
  }

  // 用户登录（修复密码验证错误）
  static async login(credentials) {
    try {
      console.log("AuthService: 发送登录请求", credentials);
      console.log("后端接收登录请求 - 用户名:", credentials.username);
      // 直接发送请求到登录接口
      const response = await api.post("/auth/login", credentials);
      console.log("AuthService: 后端返回响应", response);
      // 验证输入
      if (!credentials.username || !credentials.password) {
        throw new Error("用户名和密码不能为空");
      }

      // 查询用户
      const user = await UserModel.findByUsername(credentials.username);
      console.log("查询到的用户:", user ? `存在（ID: ${user.id}）` : "不存在");
      console.log("查询到的用户完整数据:", user);
      console.log(
        "用户密码哈希字段值:",
        user ? user.password_hash : "用户不存在"
      );

      if (!user) {
        throw new Error("用户名或密码错误");
      }

      // 检查password_hash是否存在
      if (!user.password_hash) {
        console.error("用户记录中没有密码哈希字段:", user);
        throw new Error("用户数据异常，无法验证密码");
      }

      // 验证密码（使用正确的password_hash字段）
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      console.log("密码验证结果:", isPasswordValid);

      if (!isPasswordValid) {
        throw new Error("用户名或密码错误");
      }

      // 生成token
      const token = generateToken({ id: user.id, username: user.username });
      console.log(
        "生成的token:",
        token ? `已生成（长度: ${token.length}）` : "生成失败"
      );

      if (!token) {
        throw new Error("令牌生成失败");
      }
      // 返回完整的用户信息
      const result = {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || "",
          avatar_url: user.avatar_url || "",
          gender: user.gender || "other",
          birth_date: user.birth_date || "",
          points: user.points || 0,
          bio: user.bio || "",
          nickname: user.nickname || user.username || "",
        },
      };

      console.log("登录成功，返回数据:", {
        ...result,
        token: "已隐藏", // 脱敏显示
      });

      return result;
    } catch (error) {
      console.error("登录处理错误:", error.message);
      throw error;
    }
  }

  // 获取用户信息
  static async getProfile(userId) {
    if (!userId) {
      throw new Error("用户ID不能为空");
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("用户不存在");
    }

    // 过滤敏感信息
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points || 0,
      createdAt: user.createdAt,
    };
  }
}

module.exports = AuthService;
