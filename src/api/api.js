import request from "../utils/request";
import { headUrl } from "@/config/baseUrl";
const api = {
  devPrefix: headUrl,
  // user
  loginApi: "/login",
  registerApi: "/register",
  logoutApi: "/logout",

  // user portrait
  getUserPortraitApi: "/user-portrait/detail",
  updateUserPortraitApi: "/user-portrait/update", 

  // stock
  recommendStockApi: "/chat/recommendStock", // 智能荐股
  analyzeStockApi: "/chat/analyzeStock", // 量化分析股票


  createConversationApi: "/conversation/create", // 创建会话
  chatStreamApi: "/chat/stream", // 聊天流式接口
  
};

export default api;

export { api };

// 用户登录
export const login = (params) => request.post(api.loginApi, params);

// 用户注册
export const register = (params) => request.post(api.registerApi, params);

// 退出登录
export const logout = () => request.post(api.logoutApi);

// 获取用户偏好
export const getUserPortrait = () => request.get(api.getUserPortraitApi);

// 更新用户偏好
export const updateUserPortrait = (params) => request.post(api.updateUserPortraitApi, params);

// 获取推荐股票
export const recommendStock = (params) => request.get(api.recommendStockApi, {
  params,
  timeout: 600000 // 设置600秒超时
});

// 创建会话
export const createConversation = () => request.post(api.createConversationApi);

