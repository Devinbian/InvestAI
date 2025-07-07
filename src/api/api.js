import request from "../utils/request";
import { headUrl } from "@/config/baseUrl";
const api = {
  devPrefix: headUrl,
  // user
  loginApi: "/login",
  registerApi: "/register",
  logoutApi: "/logout",

  getUserInfoApi: "/user/info", // 获取用户信息

  // user portrait
  getUserPortraitApi: "/user-portrait/detail",
  updateUserPortraitApi: "/user-portrait/update", 

  // stock
  recommendStockApi: "/chat/recommendStock", // 智能荐股
  analyzeStockApi: "/chat/analyzeStock", // 量化分析股票
  stockRealtimeDataApi: "/stock/realtime-data", // 获取股票实时数据
  buyStockApi: "/stock/buy", // 买入股票
  sellStockApi: "/stock/sell", // 卖出股票
  cancelStockOrderApi: "/stock/cancel-order", // 撤销订单


  createConversationApi: "/conversation/create", // 创建会话
  chatStreamApi: "/chat/stream", // 聊天流式接口

  // sidebar
  marketIndicesApi: "/market/indices", // 获取大盘指数
  recommendStocksApi: "/stock/recommend", // 获取推荐股票
  
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

// 获取用户信息
export const getUserInfo = () => request.get(api.getUserInfoApi);

// 股票实时数据
export const getStockRealtimeData = (params) => request.get(api.stockRealtimeDataApi, {
  params
});

// 买入股票
export const buyStock = (params) => request.post(api.buyStockApi, params);

// 卖出股票
export const sellStock = (params) => request.post(api.sellStockApi, params);

// 撤销订单
export const cancelStockOrder = (params) => request.post(api.cancelStockOrderApi, params);
// 获取大盘指数
export const getMarketIndices = () => request.get(api.marketIndicesApi);

// 获取推荐股票
export const getRecommendStocks = () => request.get(api.recommendStocksApi);

