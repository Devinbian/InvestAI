// 个股查询检测工具
// 用于识别用户输入是否为个股查询消息

import { findStockExact, findStockFuzzy, initStockDatabase } from './stockDatabase.js';

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
  // 股票名称+括号代码的模式（优先级最高，最准确）
  /([\u4e00-\u9fa5]{2,8})(?=\s*[（(]\d{6}[)）])/g,
  // 带有公司类型后缀的股票名称（更精确的匹配，避免误匹配投资咨询）
  /[\u4e00-\u9fa5]{2,6}(股份|科技|集团|控股|实业|发展|建设|能源|医药|电子|通信|银行|保险|证券|地产|汽车|钢铁|化工|电力|煤炭|有色|机械|食品|纺织|建材|交通|传媒|军工|环保|新能源|生物|互联网|5G|AI|芯片)(?=[分析怎么样如何走势趋势前景买入卖出持有建议意见看法评价研究报告数据财报基本面技术面涨跌涨幅跌幅涨停跌停突破支撑阻力买点卖点机会风险估值业绩盈利亏损股票]|$)/g,
  // 以A股、B股、H股结尾
  /[\u4e00-\u9fa5]{2,8}(A|B|H)$/g,
  // 常见知名股票名称（精确匹配）
  /(茅台|平安|腾讯|阿里|美团|京东|拼多多|字节|小米|华为|比亚迪|宁德时代|五粮液|招商|工行|建行|中行|农行|交行|浦发|民生|兴业|中信|光大|华夏|万科|保利|恒大|碧桂园|融创|世茂|绿地|中海|龙湖|新城|中南|金地|华润|招商蛇口|中国平安|中国人寿|中国太保|新华保险|中国神华|中国石油|中国石化|中国移动|中国联通|中国电信|中国铁建|中国中铁|中国建筑|中国交建|中国中车|中国重工|中国船舶|中国核电|中国广核|长江电力|华能国际|大秦铁路|京沪高铁|中国国航|南方航空|东方航空|海南航空|上港集团|宁波港|青岛港|厦门港务|中远海控|中远海发|招商轮船|中集集团|格力电器|美的集团|海尔智家|老板电器|九阳股份|苏泊尔|华帝股份|万和电气|奥克斯|沪硅产业)(?=[分析怎么样如何走势趋势前景投资买入卖出持有建议意见看法评价研究报告数据财报基本面技术面涨跌涨幅跌幅涨停跌停突破支撑阻力买点卖点机会风险估值业绩盈利亏损股票]|$)/g
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
  '策略', '组合', '配置', '风险', '收益', '回测', '量化', '算法',
  // 投资咨询相关关键词
  '投资计划', '投资组合', '投资策略', '投资建议', '投资方案', '投资配置',
  '理财计划', '理财方案', '理财建议', '理财产品', '理财组合',
  '资产配置', '资产分配', '资产组合', '资产管理', '资产规划',
  '财务规划', '财务计划', '财务管理', '财务配置',
  '年化收益', '收益率', '收益目标', '预期收益', '投资收益',
  '风险评估', '风险控制', '风险管理', '风险偏好', '风险承受',
  '闲钱', '闲置资金', '余钱', '存款', '储蓄',
  '月收入', '收入', '工资', '薪资', '薪水'
];

/**
 * 检测消息是否为个股查询
 * @param {string} message - 用户输入的消息
 * @returns {Object} 检测结果
 */
export async function detectStockQuery(message) {
  if (!message || typeof message !== 'string') {
    return {
      isStockQuery: false,
      confidence: 0,
      stockInfo: null,
      queryType: null,
      reason: '无效输入'
    };
  }

  // 确保股票数据库已初始化
  await initStockDatabase();

  const cleanMessage = message.trim();
  const lowerMessage = cleanMessage.toLowerCase();
  
  // 强化大盘指数检测 - 优先级最高
  const marketIndexKeywords = [
    '上证指数', '深证成指', '创业板指', '沪深300', '中证500', '科创50',
    '大盘指数', '指数分析', '大盘走势', '市场指数', '指数走势',
    '上证', '深证', '创业板', '沪深', '中证', '科创'
  ];
  
  const hasMarketIndexKeywords = marketIndexKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  if (hasMarketIndexKeywords) {
    return {
      isStockQuery: false,
      confidence: 0,
      stockInfo: null,
      queryType: null,
      reason: '检测到大盘指数相关关键词'
    };
  }
  
  // 投资咨询检测 - 优先级第二高
  const investmentConsultationPatterns = [
    /投资计划.*年化收益/,
    /制定.*投资计划/,
    /\d+万元.*投资组合/,
    /月收入.*投资组合/,
    /闲钱.*投资/,
    /适合.*投资组合/,
    /投资建议.*收益/,
    /理财.*组合/,
    /资产配置.*建议/
  ];
  
  const isInvestmentConsultation = investmentConsultationPatterns.some(pattern => 
    pattern.test(lowerMessage)
  );
  
  if (isInvestmentConsultation) {
    return {
      isStockQuery: false,
      confidence: 0,
      stockInfo: null,
      queryType: null,
      reason: '检测到投资咨询相关模式'
    };
  }
  
  // 检查是否包含排除关键词（改进版：先检测股票信息，如果有明确的股票代码或名称，则不排除）
  const hasStockCodeInMessage = STOCK_CODE_PATTERNS.some(pattern => pattern.test(cleanMessage));
  const hasStockNameInMessage = STOCK_NAME_PATTERNS.some(pattern => pattern.test(cleanMessage));
  
  // 只有在没有明确股票信息的情况下才应用排除关键词
  if (!hasStockCodeInMessage && !hasStockNameInMessage) {
    const hasExcludeKeywords = EXCLUDE_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    if (hasExcludeKeywords) {
      return {
        isStockQuery: false,
        confidence: 0,
        stockInfo: null,
        queryType: null,
        reason: '包含排除关键词且无明确股票信息'
      };
    }
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

  // 2. 使用股票数据库进行精确和模糊匹配
  const databaseMatches = await searchInStockDatabase(cleanMessage);
  if (databaseMatches.exact.length > 0) {
    confidence += 60;
    stockInfo = {
      codes: databaseMatches.exact.map(s => s.code),
      names: databaseMatches.exact.map(s => s.name),
      type: 'database_exact'
    };
    queryType = 'database_exact_query';
    reasons.push(`数据库精确匹配: ${databaseMatches.exact.map(s => s.name).join(', ')}`);
  } else if (databaseMatches.fuzzy.length > 0 && databaseMatches.fuzzy[0].confidence > 80) {
    confidence += 45;
    stockInfo = {
      codes: databaseMatches.fuzzy.map(s => s.code),
      names: databaseMatches.fuzzy.map(s => s.name),
      type: 'database_fuzzy'
    };
    queryType = 'database_fuzzy_query';
    reasons.push(`数据库模糊匹配: ${databaseMatches.fuzzy.slice(0, 3).map(s => `${s.name}(${s.confidence}%)`).join(', ')}`);
  }

  // 3. 传统股票名称检测（作为补充）
  const stockNames = extractStockNames(cleanMessage);
  if (stockNames.length > 0) {
    confidence += 30; // 降低传统方法的权重
    if (!stockInfo) {
      stockInfo = {
        names: stockNames,
        type: 'pattern'
      };
      queryType = 'pattern_query';
    } else {
      if (!stockInfo.names) stockInfo.names = [];
      stockInfo.names.push(...stockNames);
    }
    reasons.push(`模式匹配股票名称: ${stockNames.join(', ')}`);
  }

  // 4. 检测查询关键词
  const queryKeywords = QUERY_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (queryKeywords.length > 0) {
    confidence += Math.min(queryKeywords.length * 5, 25);
    reasons.push(`检测到查询关键词: ${queryKeywords.join(', ')}`);
  }

  // 5. 消息长度和结构分析
  if (cleanMessage.length < 50 && (stockCodes.length > 0 || stockNames.length > 0 || (stockInfo && (stockInfo.codes || stockInfo.names)))) {
    confidence += 15;
    reasons.push('消息简洁且包含股票标识');
  }

  // 6. 特殊模式检测
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
 * 在股票数据库中搜索
 * @param {string} message - 用户输入消息
 * @returns {Object} 搜索结果
 */
async function searchInStockDatabase(message) {
  const results = {
    exact: [],
    fuzzy: []
  };

  // 提取可能的股票标识符
  const tokens = extractPossibleStockTokens(message);
  
  for (const token of tokens) {
    // 精确匹配
    const exactMatch = findStockExact(token);
    if (exactMatch) {
      results.exact.push(exactMatch);
    } else {
      // 模糊匹配
      const fuzzyMatches = findStockFuzzy(token);
      results.fuzzy.push(...fuzzyMatches);
    }
  }

  // 去重
  results.exact = results.exact.filter((item, index, self) => 
    index === self.findIndex(t => t.code === item.code)
  );
  
  results.fuzzy = results.fuzzy.filter((item, index, self) => 
    index === self.findIndex(t => t.code === item.code)
  ).sort((a, b) => b.confidence - a.confidence);

  return results;
}

/**
 * 提取可能的股票标识符
 * @param {string} message - 用户输入消息  
 * @returns {Array} 可能的股票标识符列表
 */
function extractPossibleStockTokens(message) {
  const tokens = new Set();
  
  // 1. 6位数字代码
  const codeMatches = message.match(/\d{6}/g);
  if (codeMatches) {
    codeMatches.forEach(code => tokens.add(code));
  }
  
  // 2. 中文字符组合（2-8个字符）
  const chineseMatches = message.match(/[\u4e00-\u9fa5]{2,8}/g);
  if (chineseMatches) {
    chineseMatches.forEach(name => {
      tokens.add(name);
      // 也尝试去掉可能的后缀
      const withoutSuffix = name.replace(/(股份|集团|科技|控股|实业|发展|建设|能源|医药|电子|通信|银行|保险|证券|地产|汽车|钢铁|化工|电力|煤炭|有色|机械|食品|纺织|建材|交通|传媒|军工|环保|新能源|生物|互联网|5G|AI|芯片|A股|B股|H股)$/, '');
      if (withoutSuffix !== name && withoutSuffix.length >= 2) {
        tokens.add(withoutSuffix);
      }
    });
  }
  
  // 3. 完整的股票名称（代码）模式
  const fullMatches = message.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/g);
  if (fullMatches) {
    fullMatches.forEach(match => {
      const parts = match.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/);
      if (parts) {
        tokens.add(parts[1]); // 股票名称
        tokens.add(parts[2]); // 股票代码
      }
    });
  }
  
  return [...tokens];
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
export async function extractStockInfoFromContent(aiContent, userContent, detectionResult) {
  let stockName = "未知股票";
  let stockCode = "000000";
  
  console.log('🔍 开始提取股票信息:', {
    aiContentLength: aiContent?.length || 0,
    userContent,
    detectionResult: detectionResult ? {
      isStockQuery: detectionResult.isStockQuery,
      confidence: detectionResult.confidence,
      stockInfo: detectionResult.stockInfo
    } : null
  });
  
  // 1. 优先从检测结果中获取
  if (detectionResult?.stockInfo) {
    if (detectionResult.stockInfo.codes && detectionResult.stockInfo.codes.length > 0) {
      stockCode = detectionResult.stockInfo.codes[0].replace(/^(SH|SZ)/, '').replace(/\.(SH|SZ)$/, '');
      console.log('✅ 从检测结果获取股票代码:', stockCode);
    }
    if (detectionResult.stockInfo.names && detectionResult.stockInfo.names.length > 0) {
      stockName = detectionResult.stockInfo.names[0];
      console.log('✅ 从检测结果获取股票名称:', stockName);
    }
  }
  
  // 2. 从AI回复中提取完整格式：股票名称(代码)
  if (aiContent) {
    const fullStockMatch = aiContent.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/);
    if (fullStockMatch) {
      stockName = fullStockMatch[1];
      stockCode = fullStockMatch[2];
      console.log('✅ 从AI回复提取完整格式:', { name: stockName, code: stockCode });
      return { name: stockName, code: stockCode, source: 'ai_full_match' };
    }
    
    // 额外尝试：从AI回复的标题中提取
    const lines = aiContent.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine) {
      const titleMatch = firstLine.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/);
      if (titleMatch) {
        stockName = titleMatch[1];
        stockCode = titleMatch[2];
        console.log('✅ 从AI回复标题提取:', { name: stockName, code: stockCode });
        return { name: stockName, code: stockCode, source: 'ai_title_match' };
      }
    }
  }
  
  // 3. 从用户输入中提取完整格式
  const userFullMatch = userContent.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/);
  if (userFullMatch) {
    stockName = userFullMatch[1];
    stockCode = userFullMatch[2];
    console.log('✅ 从用户输入提取完整格式:', { name: stockName, code: stockCode });
    return { name: stockName, code: stockCode, source: 'user_full_match' };
  }
  
  // 4. 分别提取名称和代码
  // 如果还没有获取到股票名称，从用户输入中提取
  if (stockName === "未知股票") {
    // 从用户输入中提取股票名称（优化的模式）
    const userNamePatterns = [
      // 简单的中文股票名称（2-8个字符）
      /^([\u4e00-\u9fa5]{2,8})$/,
      // 股票名称+查询词的模式
      /([\u4e00-\u9fa5]{2,8})(?=[分析怎么样如何走势趋势前景投资买入卖出持有建议意见看法评价研究报告数据财报基本面技术面涨跌涨幅跌幅涨停跌停突破支撑阻力买点卖点机会风险估值业绩盈利亏损])/,
      // 知名股票名称匹配
      /(中粮糖业|茅台|平安|腾讯|阿里|美团|京东|拼多多|字节|小米|华为|比亚迪|宁德时代|五粮液|招商|万科|格力|美的|南宁糖业|贵糖股份)/
    ];
    
    for (const pattern of userNamePatterns) {
      const match = userContent.match(pattern);
      if (match) {
        stockName = match[1];
        console.log('✅ 从用户输入提取股票名称:', stockName);
        break;
      }
    }
    
    // 从AI回复中提取股票名称
    if (stockName === "未知股票" && aiContent) {
      const aiNamePatterns = [
        /([\u4e00-\u9fa5]{2,8})(?=\s*[（(]?\d{6}[)）]?|是|的|股票|公司)/,
        /(?:关于|分析|看好|推荐|建议|关注)([\u4e00-\u9fa5]{2,8})/,
        /([\u4e00-\u9fa5]{2,8})(?=\s*(?:股票|公司|集团|股份))/,
        // 新增：基本信息格式
        /股票名称[：:]\s*([\u4e00-\u9fa5]{2,8})/,
        // 新增：标题格式
        /^([\u4e00-\u9fa5]{2,8})\s+基本信息/
      ];
      
      for (const pattern of aiNamePatterns) {
        const match = aiContent.match(pattern);
        if (match) {
          stockName = match[1];
          console.log('✅ 从AI回复提取股票名称:', stockName);
          break;
        }
      }
    }
  }
  
  // 如果还没有获取到股票代码，尝试提取
  if (stockCode === "000000") {
    // 从AI回复中提取股票代码（更强的模式）
    if (aiContent) {
      const aiCodePatterns = [
        // 标准括号格式
        /[（(](\d{6})[)）]/,
        // 股票代码：格式
        /股票代码[：:]\s*(\d{6})/,
        // 代码：格式
        /代码[：:]\s*(\d{6})/,
        // 单独的6位数字（在没有其他6位数字干扰的情况下）
        /\b(\d{6})\b/
      ];
      
      for (const pattern of aiCodePatterns) {
        const match = aiContent.match(pattern);
        if (match) {
          stockCode = match[1];
          console.log('✅ 从AI回复提取股票代码:', stockCode);
          break;
        }
      }
    }
    
    // 从用户输入中提取股票代码
    if (stockCode === "000000") {
      const userCodeMatch = userContent.match(/(\d{6})/);
      if (userCodeMatch) {
        stockCode = userCodeMatch[1];
        console.log('✅ 从用户输入提取股票代码:', stockCode);
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
        console.log('✅ 智能匹配提取代码:', stockCode);
      } else {
        stockName = match;
        console.log('✅ 智能匹配提取名称:', stockName);
      }
    }
  }
  
  // 6. 特殊处理：如果有股票名称但没有代码，尝试查找数据库
  if (stockName !== "未知股票" && stockCode === "000000") {
    try {
      // 尝试从数据库中查找对应的代码
      const { findStockExact } = await import('./stockDatabase.js');
      const exactMatch = findStockExact(stockName);
      if (exactMatch && exactMatch.code) {
        stockCode = exactMatch.code;
        console.log('✅ 从数据库查找到股票代码:', stockCode);
      }
    } catch (error) {
      console.warn('⚠️ 数据库查找失败:', error.message);
    }
  }
  
  // 7. 最终清理
  if (stockName === "未知股票" && stockCode !== "000000") {
    stockName = `股票${stockCode}`;
  }
  
  const result = { 
    name: stockName, 
    code: stockCode, 
    source: 'intelligent_extraction' 
  };
  
  console.log('🎯 最终提取结果:', result);
  
  return result;
}

// 导出默认检测函数
export default detectStockQuery; 