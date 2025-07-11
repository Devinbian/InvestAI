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
  stockPlan:"/stock/trade-plan",//获取股票计划
  excuteStockPlan:"/stock/execute-trade-plan",//执行股票计划

  userPositionApi: "/user/position/detail", // 获取用户某只股票的持仓详情
  canCancelStockOrderApi: "/stock/can-cancel-order", // 可撤单列表

  createConversationApi: "/conversation/create", // 创建会话
  chatStreamApi: "/chat/stream", // 聊天流式接口

  // sidebar
  marketIndicesApi: "/market/indices", // 获取大盘指数
  recommendStocksApi: "/stock/recommend", // 获取推荐股票


  stockSelectApi: "/stock/select", // 加入自选股
  stockUnselectApi: "/stock/unselect", // 移除自选股
  stockSelectStatusApi: "/stock/select-status", // 是否已经加入了自选股
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

export const getStockPlan = (code) => request.get(api.stockPlan+"?code="+code);


// 获取用户某只股票的持仓详情
export const getUserPosition = (params) => request.get(api.userPositionApi, {
  params
});

// 获取可撤单列表
export const getCanCancelStockOrder = (params) => request.get(api.canCancelStockOrderApi, {
  params
});

// 加入自选股
export const stockSelect = (params) => request.get(api.stockSelectApi, {
  params
});

// 移除自选股
export const stockUnselect = (params) => request.get(api.stockUnselectApi, {
  params
});

// 是否已经加入了自选股
export const stockSelectStatus = (params) => request.get(api.stockSelectStatusApi, {
  params
});

// ai 委托交易
export const excuteTradePlan = (params) => request.post(api.excuteStockPlan, params);
