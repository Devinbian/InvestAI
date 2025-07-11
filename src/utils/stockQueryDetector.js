// 个股查询检测工具
// 用于识别用户输入是否为个股查询消息

// 股票代码正则表达式
const STOCK_CODE_PATTERNS = [
  /\b(\d{6})\b/g,           // 6位数字股票代码
  /\b(SH\d{6})\b/gi,        // 上海股票代码
  /\b(SZ\d{6})\b/gi,        // 深圳股票代码
  /\b(\d{6}\.SH)\b/gi,      // 上海股票代码（带后缀）
  /\b(\d{6}\.SZ)\b/gi,      // 深圳股票代码（带后缀）
];

// 股票名称模式（常见的股票名称特征）
const STOCK_NAME_PATTERNS = [
  // 带有公司类型后缀的股票名称
  /[\u4e00-\u9fa5]{2,6}(股份|科技|集团|控股|实业|发展|投资|建设|能源|医药|电子|通信|银行|保险|证券|地产|汽车|钢铁|化工|电力|煤炭|有色|机械|食品|纺织|建材|交通|传媒|军工|环保|新能源|生物|互联网|5G|AI|芯片)/g,
  // 以A股、B股、H股结尾
  /[\u4e00-\u9fa5]{2,8}(A|B|H)$/g,
  // 常见的简短股票名称（2-6个中文字符）
  /(?:^|[^[\u4e00-\u9fa5])[\u4e00-\u9fa5]{2,6}(?=[分析怎么样如何走势趋势前景投资买入卖出持有建议意见看法评价研究报告数据财报基本面技术面涨跌涨幅跌幅涨停跌停突破支撑阻力买点卖点机会风险估值业绩盈利亏损]|$)/g,
  // 股票名称+括号代码的模式
  /[\u4e00-\u9fa5]{2,8}(?=\(\d{6}\))/g,
  // 常见知名股票名称（精确匹配）
  /(?:^|[^[\u4e00-\u9fa5])(茅台|平安|腾讯|阿里|美团|京东|拼多多|字节|小米|华为|比亚迪|宁德时代|五粮液|招商|工行|建行|中行|农行|交行|浦发|民生|兴业|中信|光大|华夏|万科|保利|恒大|碧桂园|融创|世茂|绿地|中海|龙湖|新城|中南|金地|华润|招商蛇口|中国平安|中国人寿|中国太保|新华保险|中国神华|中国石油|中国石化|中国移动|中国联通|中国电信|中国铁建|中国中铁|中国建筑|中国交建|中国中车|中国重工|中国船舶|中国核电|中国广核|长江电力|华能国际|大秦铁路|京沪高铁|中国国航|南方航空|东方航空|海南航空|上港集团|宁波港|青岛港|厦门港务|中远海控|中远海发|招商轮船|中集集团|格力电器|美的集团|海尔智家|老板电器|九阳股份|苏泊尔|华帝股份|万和电气|奥克斯)(?=[分析怎么样如何走势趋势前景投资买入卖出持有建议意见看法评价研究报告数据财报基本面技术面涨跌涨幅跌幅涨停跌停突破支撑阻力买点卖点机会风险估值业绩盈利亏损]|$)/g
];

// 查询关键词
const QUERY_KEYWORDS = [
  '分析', '怎么样', '如何', '走势', '趋势', '前景', '投资', '买入', '卖出',
  '持有', '建议', '意见', '看法', '评价', '研究', '报告', '数据', '财报',
  '基本面', '技术面', 'K线', '均线', '成交量', '市盈率', '市净率',
  '涨跌', '涨幅', '跌幅', '涨停', '跌停', '突破', '支撑', '阻力',
  '买点', '卖点', '机会', '风险', '估值', '业绩', '盈利', '亏损'
];

// 排除关键词（这些词出现时通常不是个股查询）
const EXCLUDE_KEYWORDS = [
  '智能荐股', '推荐股票', '自选股', '持仓', '资产', '资讯', '新闻',
  '复盘', '市场', '大盘', '指数', '板块', '行业', '概念', '题材',
  '策略', '组合', '配置', '风险', '收益', '回测', '量化', '算法'
];

/**
 * 检测消息是否为个股查询
 * @param {string} message - 用户输入的消息
 * @returns {Object} 检测结果
 */
export function detectStockQuery(message) {
  if (!message || typeof message !== 'string') {
    return {
      isStockQuery: false,
      confidence: 0,
      stockInfo: null,
      queryType: null,
      reason: '无效输入'
    };
  }

  const cleanMessage = message.trim();
  const lowerMessage = cleanMessage.toLowerCase();
  
  // 检查是否包含排除关键词
  const hasExcludeKeywords = EXCLUDE_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (hasExcludeKeywords) {
    return {
      isStockQuery: false,
      confidence: 0,
      stockInfo: null,
      queryType: null,
      reason: '包含排除关键词'
    };
  }

  let confidence = 0;
  let stockInfo = null;
  let queryType = null;
  const reasons = [];

  // 1. 检测股票代码
  const stockCodes = extractStockCodes(cleanMessage);
  if (stockCodes.length > 0) {
    confidence += 60;
    stockInfo = {
      codes: stockCodes,
      type: 'code'
    };
    queryType = 'code_query';
    reasons.push(`检测到股票代码: ${stockCodes.join(', ')}`);
  }

  // 2. 检测股票名称
  const stockNames = extractStockNames(cleanMessage);
  if (stockNames.length > 0) {
    confidence += 40;
    if (!stockInfo) {
      stockInfo = {
        names: stockNames,
        type: 'name'
      };
      queryType = 'name_query';
    } else {
      stockInfo.names = stockNames;
    }
    reasons.push(`检测到股票名称: ${stockNames.join(', ')}`);
  }

  // 3. 检测查询关键词
  const queryKeywords = QUERY_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (queryKeywords.length > 0) {
    confidence += Math.min(queryKeywords.length * 5, 25);
    reasons.push(`检测到查询关键词: ${queryKeywords.join(', ')}`);
  }

  // 4. 消息长度和结构分析
  if (cleanMessage.length < 50 && (stockCodes.length > 0 || stockNames.length > 0)) {
    confidence += 15;
    reasons.push('消息简洁且包含股票标识');
  }

  // 5. 特殊模式检测
  if (detectSpecialPatterns(cleanMessage)) {
    confidence += 20;
    reasons.push('检测到特殊查询模式');
  }

  // 最终判断
  const isStockQuery = confidence >= 50;
  
  return {
    isStockQuery,
    confidence: Math.min(confidence, 100),
    stockInfo,
    queryType,
    reasons,
    message: cleanMessage
  };
}

/**
 * 提取股票代码
 */
function extractStockCodes(message) {
  const codes = [];
  
  STOCK_CODE_PATTERNS.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) {
      codes.push(...matches.map(match => match.toUpperCase()));
    }
  });
  
  // 去重
  return [...new Set(codes)];
}

/**
 * 提取股票名称
 */
function extractStockNames(message) {
  const names = [];
  
  STOCK_NAME_PATTERNS.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // 清理匹配结果，去除可能的前缀空格或特殊字符
        const cleanMatch = match.replace(/^[^\u4e00-\u9fa5]*/, '').replace(/[^\u4e00-\u9fa5A-Z0-9]*$/, '');
        if (cleanMatch && cleanMatch.length >= 2) {
          names.push(cleanMatch);
        }
      });
    }
  });
  
  // 去重并过滤掉过短的名称
  return [...new Set(names)].filter(name => name.length >= 2);
}

/**
 * 检测特殊查询模式
 */
function detectSpecialPatterns(message) {
  const specialPatterns = [
    /^[\u4e00-\u9fa5]{2,8}[\s]*[分析怎么样如何]/,  // 股票名称+查询词
    /^\d{6}[\s]*[分析怎么样如何]/,                // 股票代码+查询词
    /[\u4e00-\u9fa5]{2,8}\(\d{6}\)/,              // 股票名称(代码)
    /\d{6}[\s]*[\u4e00-\u9fa5]{2,8}/,             // 代码+名称
  ];
  
  return specialPatterns.some(pattern => pattern.test(message));
}

/**
 * 获取股票查询的建议操作
 */
export function getStockQuerySuggestions(stockInfo) {
  if (!stockInfo) return [];
  
  const suggestions = [
    {
      key: 'analysis',
      text: '量化分析',
      icon: '🎯',
      priority: 1
    },
    {
      key: 'aiTrading',
      text: 'AI委托交易',
      icon: '🤖',
      priority: 2
    },
    {
      key: 'addWatchlist',
      text: '加入自选',
      icon: '⭐',
      priority: 3
    },
    {
      key: 'technicalAnalysis',
      text: '技术分析',
      icon: '📊',
      priority: 4
    },
    {
      key: 'fundamentalAnalysis',
      text: '基本面分析',
      icon: '📈',
      priority: 5
    }
  ];
  
  return suggestions.sort((a, b) => a.priority - b.priority);
}

/**
 * 格式化股票查询结果用于显示
 */
export function formatStockQueryResult(detection) {
  if (!detection.isStockQuery) {
    return null;
  }
  
  const { stockInfo, confidence, queryType, reasons } = detection;
  
  return {
    type: 'individual_stock_query',
    confidence,
    queryType,
    stockInfo,
    reasons,
    suggestions: getStockQuerySuggestions(stockInfo),
    displayInfo: {
      title: '个股查询检测',
      subtitle: `置信度: ${confidence}%`,
      details: reasons.join('; ')
    }
  };
}

/**
 * 智能提取股票信息（从AI回复内容中）
 * @param {string} aiContent - AI回复内容
 * @param {string} userContent - 用户输入内容
 * @param {Object} detectionResult - 检测结果
 * @returns {Object} 提取的股票信息
 */
export function extractStockInfoFromContent(aiContent, userContent, detectionResult) {
  let stockName = "未知股票";
  let stockCode = "000000";
  
  // 1. 优先从检测结果中获取
  if (detectionResult.stockInfo) {
    if (detectionResult.stockInfo.codes && detectionResult.stockInfo.codes.length > 0) {
      stockCode = detectionResult.stockInfo.codes[0].replace(/^(SH|SZ)/, '').replace(/\.(SH|SZ)$/, '');
    }
    if (detectionResult.stockInfo.names && detectionResult.stockInfo.names.length > 0) {
      stockName = detectionResult.stockInfo.names[0];
    }
  }
  
  // 2. 从AI回复中提取完整格式：股票名称(代码)
  const fullStockMatch = aiContent.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/);
  if (fullStockMatch) {
    stockName = fullStockMatch[1];
    stockCode = fullStockMatch[2];
    return { name: stockName, code: stockCode, source: 'ai_full_match' };
  }
  
  // 3. 从用户输入中提取完整格式
  const userFullMatch = userContent.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/);
  if (userFullMatch) {
    stockName = userFullMatch[1];
    stockCode = userFullMatch[2];
    return { name: stockName, code: stockCode, source: 'user_full_match' };
  }
  
  // 4. 分别提取名称和代码
  // 提取股票名称
  if (stockName === "未知股票") {
    // 从用户输入中提取
    const userNamePatterns = [
      /([\u4e00-\u9fa5]{2,8})(?=[分析怎么样如何走势趋势前景投资买入卖出持有建议意见看法评价研究报告数据财报基本面技术面涨跌涨幅跌幅涨停跌停突破支撑阻力买点卖点机会风险估值业绩盈利亏损])/,
      /^([\u4e00-\u9fa5]{2,8})/,
      /(茅台|平安|腾讯|阿里|美团|京东|拼多多|字节|小米|华为|比亚迪|宁德时代|五粮液|招商|万科|格力|美的)/
    ];
    
    for (const pattern of userNamePatterns) {
      const match = userContent.match(pattern);
      if (match) {
        stockName = match[1];
        break;
      }
    }
    
    // 从AI回复中提取
    if (stockName === "未知股票") {
      const aiNamePatterns = [
        /([\u4e00-\u9fa5]{2,8})(?=\s*[（(]?\d{6}[)）]?|是|的|股票|公司)/,
        /(?:关于|分析|看好|推荐|建议|关注)([\u4e00-\u9fa5]{2,8})/,
        /([\u4e00-\u9fa5]{2,8})(?=\s*(?:股票|公司|集团|股份))/
      ];
      
      for (const pattern of aiNamePatterns) {
        const match = aiContent.match(pattern);
        if (match) {
          stockName = match[1];
          break;
        }
      }
    }
  }
  
  // 提取股票代码
  if (stockCode === "000000") {
    // 从AI回复中提取
    const aiCodeMatch = aiContent.match(/[（(]?(\d{6})[)）]?/);
    if (aiCodeMatch) {
      stockCode = aiCodeMatch[1];
    } else {
      // 从用户输入中提取
      const userCodeMatch = userContent.match(/(\d{6})/);
      if (userCodeMatch) {
        stockCode = userCodeMatch[1];
      }
    }
  }
  
  // 5. 最后的智能匹配
  if (stockName === "未知股票" && stockCode === "000000") {
    const possibleStock = userContent.match(/([\u4e00-\u9fa5]{2,8}|\d{6})/);
    if (possibleStock) {
      const match = possibleStock[1];
      if (/^\d{6}$/.test(match)) {
        stockCode = match;
        stockName = `股票${match}`;
      } else {
        stockName = match;
      }
    }
  }
  
  // 6. 最终清理
  if (stockName === "未知股票" && stockCode !== "000000") {
    stockName = `股票${stockCode}`;
  }
  
  return { 
    name: stockName, 
    code: stockCode, 
    source: 'intelligent_extraction' 
  };
}

// 导出默认检测函数
export default detectStockQuery; 