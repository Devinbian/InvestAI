/**
 * 格式化工具函数
 * 用于统一处理数值格式化显示
 */

/**
 * 格式化货币显示
 * @param {number} value - 货币数值
 * @returns {string} 格式化后的货币字符串
 */
export const formatProfit = (value) => {
  if (value === 0) return "¥0.00";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}¥${Math.abs(value).toFixed(2)}`;
};

/**
 * 格式化百分比显示
 * @param {number} value - 百分比数值
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercent = (value) => {
  if (value === 0) return "0.00%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
};

/**
 * 格式化货币显示（简化版，用于大额数值）
 * @param {number} amount - 货币数值
 * @returns {string} 格式化后的货币字符串（万为单位）
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount);
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + "万";
  }
  return num.toFixed(2);
};

/**
 * 格式化数值显示（带千分位分隔符）
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数，默认2位
 * @returns {string} 格式化后的数值字符串
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return "0.00";
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * 格式化价格变化显示
 * @param {number} change - 价格变化值
 * @param {number} changePercent - 价格变化百分比
 * @returns {object} 包含格式化后的变化值和百分比的对象
 */
export const formatPriceChange = (change, changePercent) => {
  const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  const percentStr =
    changePercent >= 0
      ? `+${changePercent.toFixed(2)}%`
      : `${changePercent.toFixed(2)}%`;

  return {
    change: changeStr,
    percent: percentStr,
    isPositive: change >= 0,
    isNegative: change < 0,
  };
};

// 生成唯一的消息ID
export const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
