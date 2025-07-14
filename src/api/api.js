import request from "../utils/request";
import { headUrl } from "@/config/baseUrl";
const api = {
  devPrefix: headUrl,
  // user
  loginApi: "/login",
  registerApi: "/register",
  logoutApi: "/logout",

  getUserInfoApi: "/user/info", // 获取用户信息
  updateUserInfoApi: "/user/update-info", // 更新用户信息
  
  // 手机绑定相关
  sendPhoneCodeApi: "/user/send-phone-code", // 发送手机验证码
  bindPhoneApi: "/user/bind-phone", // 绑定手机号
  unbindPhoneApi: "/user/unbind-phone", // 解绑手机号
  
  // 邮箱绑定相关
  sendEmailCodeApi: "/user/send-email-code", // 发送邮箱验证码
  bindEmailApi: "/user/bind-email", // 绑定邮箱
  unbindEmailApi: "/user/unbind-email", // 解绑邮箱
  
  // 密码修改
  changePasswordApi: "/user/update-password", // 修改密码

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
  executePlan:"/stock/execute-trade-plan",//执行量化委托

  userPositionApi: "/user/position/detail", // 获取用户某只股票的持仓详情
  userPositionOverviewApi: "/user/position/overview", //用户持仓概览
  canCancelStockOrderApi: "/stock/can-cancel-order", // 可撤单列表

  createConversationApi: "/conversation/create", // 创建会话
  chatStreamApi: "/chat/stream", // 聊天流式接口

  // sidebar
  marketIndicesApi: "/market/indices", // 获取大盘指数
  recommendStocksApi: "/stock/recommend", // 获取推荐股票


  stockSelectListApi: "/stock/selectList", // 自选股列表
  stockSelectApi: "/stock/select", // 加入自选股
  stockUnselectApi: "/stock/unselect", // 移除自选股
  stockSelectStatusApi: "/stock/select-status", // 是否已经加入了自选股
  stockUnselectAllApi: "/stock/unselect-all", // 移除自选股
 
  stockOrderRecordApi: "/record/stock-order", // 获取股票委托记录

  //record
  analyzeRecordApi:"/record/analyze",// 量化分析报告记录
  aiTradeRecordApi:"/record/ai-trade", //ai交易
  cancelAiTradeApi:"/record/ai-trade/cancel" // AI交易撤销
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

// 更新用户信息
export const updateUserInfo = (params) => request.post(api.updateUserInfoApi, params);

// 发送手机验证码
export const sendPhoneCode = (params) => request.post(api.sendPhoneCodeApi, params);

// 绑定手机号
export const bindPhone = (params) => request.post(api.bindPhoneApi, params);

// 解绑手机号
export const unbindPhone = (params) => request.post(api.unbindPhoneApi, params);

// 发送邮箱验证码
export const sendEmailCode = (params) => request.post(api.sendEmailCodeApi, params);

// 绑定邮箱
export const bindEmail = (params) => request.post(api.bindEmailApi, params);

// 解绑邮箱
export const unbindEmail = (params) => request.post(api.unbindEmailApi, params);

// 修改密码
export const changePassword = (params) => request.post(api.changePasswordApi, params);

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

//  自选股列表
export const getStockSelectList = () => request.get(api.stockSelectListApi);


// 加入自选股
export const stockSelect = (params) => request.get(api.stockSelectApi, {
  params
});

// 移除自选股
export const stockUnselect = (params) => request.get(api.stockUnselectApi, {
  params
});

// 移除所有自选股
export const stockUnselectAll = () => request.post(api.stockUnselectAllApi);

// 是否已经加入了自选股
export const stockSelectStatus = (params) => request.get(api.stockSelectStatusApi, {
  params
});

// 获取用户持仓概览
export const getUserPositionOverview = () => request.get(api.userPositionOverviewApi);

export const exeuteTradePlan = (params) => request.post(api.executePlan, params);

// 获取股票委托记录
export const getStockOrderRecord = (params) => request.get(api.stockOrderRecordApi, {
  params
});
export const analyzeRecord=(params)=>request.get(api.analyzeRecordApi, {
  params
});

export const aiTradeRecord=(params)=>request.get(api.aiTradeRecordApi,{
  params
})

// 撤销AI交易
export const cancelAiTrade = (params) => request.post(api.cancelAiTradeApi, params);
