import request from "../utils/request";
import { headUrl } from "@/config/baseUrl";
const api = {
  devPrefix: headUrl,
  // user
  loginApi: "/login",
  registerApi: "/register",
  logoutApi: "/logout",

  // user portrait
  getUserPortrait: "/user-portrait/detail",
  updateUserPortrait: "/user-portrait/update",
};

export default api;

// 用户登录
export const login = (params) => request.post(api.loginApi, params);

// 用户注册
export const register = (params) => request.post(api.registerApi, params);

// 退出登录
export const logout = () => request.post(api.logoutApi);

// 获取用户偏好
export const getUserPortrait = () => request.get(api.getUserPortrait);

// 更新用户偏好
export const updateUserPortrait = (params) => request.post(api.updateUserPortrait, params);

