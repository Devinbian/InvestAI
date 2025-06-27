// 股票操作按钮标准配置
// 统一管理所有股票相关的操作按钮配置

// 图标常量
export const STOCK_ACTION_ICONS = {
  star: "⭐",
  chart: "🎯",
  robot: "🤖",
  money: "💰",
  sell: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  buy: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  trend: "📈",
  warning: "⚠️",
};

// 基础操作按钮配置
export const BASE_STOCK_ACTIONS = {
  // 自选股相关
  addWatchlist: {
    key: "addWatchlist",
    text: "加入自选",
    mobileText: "加自选",
    type: "primary",
    class: "add-watchlist-btn",
    icon: STOCK_ACTION_ICONS.star,
    priority: 1,
  },

  removeWatchlist: {
    key: "removeWatchlist",
    text: "移除自选",
    mobileText: "移除",
    type: "success",
    class: "remove-watchlist-btn",
    icon: STOCK_ACTION_ICONS.star,
    priority: 1,
  },

  // 交易相关
  buy: {
    key: "buy",
    text: "买入",
    mobileText: "买入",
    type: "default",
    class: "buy-stock-btn-secondary",
    icon: STOCK_ACTION_ICONS.buy,
    priority: 2,
  },

  sell: {
    key: "sell",
    text: "卖出",
    mobileText: "卖出",
    type: "danger",
    class: "sell-stock-btn",
    icon: STOCK_ACTION_ICONS.sell,
    priority: 2,
  },

  addPosition: {
    key: "addPosition",
    text: "加仓",
    mobileText: "加仓",
    type: "default",
    class: "buy-stock-btn-secondary",
    icon: STOCK_ACTION_ICONS.buy,
    priority: 3,
  },

  // 分析相关
  analysis: {
    key: "analysis",
    text: "量化分析",
    mobileText: "分析",
    type: "default",
    class: "paid-analysis-btn",
    icon: STOCK_ACTION_ICONS.chart,
    priceTag: {
      original: "3智点",
      promo: "1智点",
    },
    priority: 4,
  },

  paidAnalysis: {
    key: "paidAnalysis",
    text: "量化分析",
    mobileText: "分析",
    type: "default",
    class: "paid-analysis-btn",
    icon: STOCK_ACTION_ICONS.chart,
    priceTag: {
      original: "3智点",
      promo: "1智点",
    },
    priority: 4,
  },

  aiTrading: {
    key: "aiTrading",
    text: "AI委托交易",
    mobileText: "AI交易",
    type: "default",
    class: "quant-analysis-btn",
    icon: STOCK_ACTION_ICONS.robot,
    priceTag: {
      original: "3智点",
      promo: "1智点",
    },
    priority: 5,
  },

  quantAnalysis: {
    key: "quantAnalysis",
    text: "AI委托交易",
    mobileText: "AI交易",
    type: "default",
    class: "quant-analysis-btn",
    icon: STOCK_ACTION_ICONS.robot,
    priceTag: {
      original: "3智点",
      promo: "1智点",
    },
    priority: 5,
  },
};

// 预设的操作按钮组合
export const STOCK_ACTION_PRESETS = {
  // 推荐股票场景
  recommendation: [
    BASE_STOCK_ACTIONS.addWatchlist,
    BASE_STOCK_ACTIONS.removeWatchlist,
    BASE_STOCK_ACTIONS.analysis,
    BASE_STOCK_ACTIONS.aiTrading,
    BASE_STOCK_ACTIONS.buy,
  ],

  // 自选股场景
  watchlist: [
    BASE_STOCK_ACTIONS.removeWatchlist,
    BASE_STOCK_ACTIONS.analysis,
    BASE_STOCK_ACTIONS.aiTrading,
    BASE_STOCK_ACTIONS.buy,
  ],

  // 持仓股票场景
  portfolio: [
    BASE_STOCK_ACTIONS.sell,
    BASE_STOCK_ACTIONS.addPosition,
    BASE_STOCK_ACTIONS.analysis,
    BASE_STOCK_ACTIONS.aiTrading,
  ],

  // 聊天消息中的股票操作（完整版）
  chatFull: [
    BASE_STOCK_ACTIONS.addWatchlist,
    BASE_STOCK_ACTIONS.removeWatchlist,
    BASE_STOCK_ACTIONS.aiTrading,
    BASE_STOCK_ACTIONS.buy,
  ],

  // 聊天消息中的股票操作（紧凑版）
  chatCompact: [
    BASE_STOCK_ACTIONS.addWatchlist,
    BASE_STOCK_ACTIONS.removeWatchlist,
    BASE_STOCK_ACTIONS.buy,
  ],

  // 移动端优化版本
  mobile: [
    BASE_STOCK_ACTIONS.addWatchlist,
    BASE_STOCK_ACTIONS.removeWatchlist,
    BASE_STOCK_ACTIONS.aiTrading,
    BASE_STOCK_ACTIONS.buy,
  ],
};

// 根据场景获取操作按钮配置
export const getStockActionConfig = (scenario, options = {}) => {
  const {
    isMobile = false,
    maxButtons = 4,
    includePaidFeatures = true,
  } = options;

  let actions =
    STOCK_ACTION_PRESETS[scenario] || STOCK_ACTION_PRESETS.recommendation;

  // 移动端优化
  if (isMobile) {
    actions = actions.slice(0, maxButtons);
  }

  // 如果不包含付费功能，过滤掉付费按钮
  if (!includePaidFeatures) {
    actions = actions.filter((action) => !action.priceTag);
  }

  // 按优先级排序
  actions.sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return actions;
};

// 创建自定义操作按钮配置
export const createCustomAction = (config) => {
  return {
    key: config.key,
    text: config.text,
    mobileText: config.mobileText || config.text,
    type: config.type || "default",
    class: config.class || "",
    icon: config.icon || "",
    priceTag: config.priceTag,
    priority: config.priority || 999,
    loading: config.loading || false,
    ...config,
  };
};

// 操作按钮的事件映射
export const STOCK_ACTION_EVENTS = {
  addWatchlist: "add-watchlist",
  removeWatchlist: "remove-watchlist",
  buy: "buy-stock",
  sell: "sell-stock",
  addPosition: "buy-stock",
  analysis: "paid-analysis",
  paidAnalysis: "paid-analysis",
  aiTrading: "ai-trading",
  quantAnalysis: "ai-trading",
};

// 操作按钮的对话框事件映射
export const STOCK_ACTION_DIALOGS = {
  buy: "show-buy-dialog",
  sell: "show-sell-dialog",
  addPosition: "show-buy-dialog",
  analysis: "show-analysis-dialog",
  paidAnalysis: "show-analysis-dialog",
  aiTrading: "show-ai-trading-dialog",
  quantAnalysis: "show-ai-trading-dialog",
};

export default {
  STOCK_ACTION_ICONS,
  BASE_STOCK_ACTIONS,
  STOCK_ACTION_PRESETS,
  getStockActionConfig,
  createCustomAction,
  STOCK_ACTION_EVENTS,
  STOCK_ACTION_DIALOGS,
};
