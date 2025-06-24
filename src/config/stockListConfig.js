// 股票列表配置文件
// 定义不同场景下的操作按钮和显示配置

// 图标路径常量
const ICONS = {
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  chart: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  trading: "M3 3v18h18M7 16l4-4 4 4 4-4",
  buy: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  sell: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
};

// 推荐股票列表配置
export const RECOMMENDATION_CONFIG = {
  // 显示配置
  showRecommendIndex: true,
  showRecommendTooltip: true,
  showBasicDetails: true,
  showReason: true,
  clickable: true,

  // 操作按钮配置
  actions: [
    {
      key: "addWatchlist",
      text: "加入自选",
      type: "primary",
      class: "add-watchlist-btn",
      icon: ICONS.star,
    },
    {
      key: "removeWatchlist",
      text: "已加自选",
      type: "success",
      class: "remove-watchlist-btn",
      icon: ICONS.star,
    },
    {
      key: "analysis",
      text: "量化分析",
      type: "default",
      class: "paid-analysis-btn",
      icon: ICONS.chart,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
    {
      key: "aiTrading",
      text: "AI委托交易",
      type: "default",
      class: "quant-analysis-btn",
      icon: ICONS.trading,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
    {
      key: "buy",
      text: "购买",
      type: "default",
      class: "buy-stock-btn-secondary",
      icon: ICONS.buy,
    },
  ],
};

// 自选股列表配置
export const WATCHLIST_CONFIG = {
  // 显示配置
  showWatchlistStatus: true,
  showBasicDetails: true,
  showWatchlistDetails: false,
  clickable: true,

  // 操作按钮配置
  actions: [
    {
      key: "removeWatchlist",
      text: "移除自选",
      type: "default",
      class: "remove-watchlist-btn",
      icon: ICONS.star,
    },
    {
      key: "analysis",
      text: "量化分析",
      type: "default",
      class: "paid-analysis-btn",
      icon: ICONS.chart,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
    {
      key: "aiTrading",
      text: "AI委托交易",
      type: "default",
      class: "quant-analysis-btn",
      icon: ICONS.trading,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
    {
      key: "buy",
      text: "买入",
      type: "default",
      class: "buy-stock-btn-secondary",
      icon: ICONS.buy,
    },
  ],
};

// 持仓股票列表配置
export const PORTFOLIO_CONFIG = {
  // 显示配置
  showPositionStatus: true,
  showPositionDetails: true,
  clickable: true,

  // 操作按钮配置
  actions: [
    {
      key: "sell",
      text: "卖出",
      type: "danger",
      class: "sell-stock-btn",
      icon: ICONS.sell,
    },
    {
      key: "buy",
      text: "加仓",
      type: "default",
      class: "buy-stock-btn-secondary",
      icon: ICONS.buy,
    },
    {
      key: "analysis",
      text: "量化分析",
      type: "default",
      class: "paid-analysis-btn",
      icon: ICONS.chart,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
    {
      key: "aiTrading",
      text: "AI委托交易",
      type: "default",
      class: "quant-analysis-btn",
      icon: ICONS.trading,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
  ],
};

// 智能荐股列表配置（带工具栏）
export const SMART_RECOMMENDATION_CONFIG = {
  // 显示配置
  showToolbar: true,
  showTime: true,
  showRecommendIndex: true,
  showRecommendTooltip: true,
  showBasicDetails: true,
  showReason: true,
  clickable: true,
  listClass: "persistent-stock-list",

  // 操作按钮配置
  actions: [
    {
      key: "addWatchlist",
      text: "加入自选",
      type: "primary",
      class: "add-watchlist-btn",
      icon: ICONS.star,
    },
    {
      key: "removeWatchlist",
      text: "已加自选",
      type: "success",
      class: "remove-watchlist-btn",
      icon: ICONS.star,
    },
    {
      key: "analysis",
      text: "量化分析",
      type: "default",
      class: "paid-analysis-btn",
      icon: ICONS.chart,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
    {
      key: "aiTrading",
      text: "AI委托交易",
      type: "default",
      class: "quant-analysis-btn",
      icon: ICONS.trading,
      priceTag: {
        original: "3智点",
        promo: "1智点",
      },
    },
    {
      key: "buy",
      text: "购买",
      type: "default",
      class: "buy-stock-btn-secondary",
      icon: ICONS.buy,
    },
  ],
};

// 量化分析推荐股票配置
export const QUANT_RECOMMENDATION_CONFIG = {
  // 显示配置
  showBasicDetails: true,
  showReason: true,
  clickable: true,

  // 操作按钮配置
  actions: [
    {
      key: "analysis",
      text: "详细分析",
      type: "default",
      class: "detail-analysis-btn",
    },
    {
      key: "addWatchlist",
      text: "加入自选",
      type: "primary",
      class: "add-watchlist-btn",
      icon: ICONS.star,
    },
  ],
};

// 简单股票列表配置（仅显示基本信息）
export const SIMPLE_CONFIG = {
  // 显示配置
  showBasicDetails: false,
  clickable: true,

  // 操作按钮配置
  actions: [
    {
      key: "addWatchlist",
      text: "关注",
      type: "primary",
      class: "add-watchlist-btn",
      icon: ICONS.star,
    },
  ],
};

// 获取配置的辅助函数
export const getStockListConfig = (type) => {
  const configs = {
    recommendation: RECOMMENDATION_CONFIG,
    watchlist: WATCHLIST_CONFIG,
    portfolio: PORTFOLIO_CONFIG,
    smartRecommendation: SMART_RECOMMENDATION_CONFIG,
    quantRecommendation: QUANT_RECOMMENDATION_CONFIG,
    simple: SIMPLE_CONFIG,
  };

  return configs[type] || SIMPLE_CONFIG;
};

// 创建自定义配置的辅助函数
export const createCustomConfig = (baseType, overrides = {}) => {
  const baseConfig = getStockListConfig(baseType);

  return {
    ...baseConfig,
    ...overrides,
    actions: overrides.actions || baseConfig.actions,
  };
};
