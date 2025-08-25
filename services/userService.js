const bcrypt = require("bcrypt"); // 添加缺失的bcrypt导入
const UserModel = require("../models/userModel");
const OrderModel = require("../models/orderModel"); // 添加缺失的OrderModel导入

class UserService {
  // 获取用户信息
  static async getUserProfile(userId) {
    return await UserModel.findById(Number(userId)); // 确保传递数字类型
  }

  // 更新用户信息
  static async updateUserProfile(userId, updateData) {
    // 修正重复定义问题，合并允许的字段
    const allowedFields = [
      "email",
      "points",
      "avatar",
      "phone",
      "gender",
      "birth_date",
    ];
    const filteredUpdateData = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    if (Object.keys(filteredUpdateData).length === 0) {
      throw new Error("没有有效的字段可更新");
    }

    return await UserModel.update(Number(userId), filteredUpdateData);
  }

  // 检查用户名是否可用
  static async checkUsernameAvailable(username, excludeUserId = null) {
    const user = await UserModel.findByUsername(username);

    if (!user) return true;
    if (excludeUserId && user.id === Number(excludeUserId)) return true;

    return false;
  }

  // 检查邮箱是否可用
  static async checkEmailAvailable(email, excludeUserId = null) {
    const user = await UserModel.findByEmail(email);

    if (!user) return true;
    if (excludeUserId && user.id === Number(excludeUserId)) return true;

    return false;
  }

  // 修改密码
  static async updatePassword(userId, oldPassword, newPassword) {
    // 查询用户
    const user = await UserModel.findById(Number(userId));
    if (!user) throw new Error("用户不存在");

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash
    );
    if (!isOldPasswordValid) throw new Error("旧密码不正确");

    // 加密新密码并更新
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    return await UserModel.update(Number(userId), {
      password_hash: newPasswordHash,
    });
  }

  // 获取用户订单列表
  static async getUserOrders(userId, status, page, limit) {
    // 确保参数为数字类型
    const numericUserId = Number(userId);
    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const offset = (numericPage - 1) * numericLimit;

    // 验证参数有效性
    if (isNaN(numericUserId) || isNaN(numericPage) || isNaN(numericLimit)) {
      throw new Error("无效的分页参数");
    }

    const orders = await OrderModel.findByUserId(
      numericUserId,
      status,
      numericLimit,
      offset
    );
    const total = await OrderModel.countByUserId(numericUserId, status);

    return {
      orders,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit),
      },
    };
  }
  /**
   * 上传用户头像
   * @param {FormData} formData - 包含头像文件的FormData
   * @returns {Promise<Object>} 上传结果
   */
  async uploadAvatar(formData) {
    const response = await api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
  /**
   * 更新用户个人资料，包括用户名
   * @param {Object} userData - 用户资料数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(userData) {
    const response = await api.put("/users/profile", userData);
    return response.data;
  }

  /**
   * 修改用户密码
   * @param {Object} passwordData - 密码数据，包含oldPassword, newPassword
   * @returns {Promise<Object>} 操作结果
   */
  async changePassword(passwordData) {
    const response = await api.post("/users/change-password", passwordData);
    return response.data;
  }
}

module.exports = UserService;
