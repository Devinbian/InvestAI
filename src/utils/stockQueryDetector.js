// 个股查询检测工具
// 用于识别用户输入是否为个股查询消息

import { validateStock } from '../api/api.js';

// 大盘指数关键词（优先排除）
const MARKET_INDEX_KEYWORDS = [
  '上证指数', '深证成指', '创业板指', '沪深300', '中证500', '科创50',
  '大盘指数', '指数分析', '大盘走势', '市场指数', '指数走势',
  '上证', '深证', '创业板', '沪深', '中证', '科创'
];

// 投资咨询关键词（优先排除）
const INVESTMENT_CONSULTATION_PATTERNS = [
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

// 排除关键词
const EXCLUDE_KEYWORDS = [
  '智能荐股', '推荐股票', '自选股', '持仓', '资产', '资讯', '新闻',
  '复盘', '市场', '大盘', '指数', '板块', '行业', '概念', '题材',
  '策略', '组合', '配置', '风险', '收益', '回测', '量化', '算法',
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

  const cleanMessage = message.trim();
  const lowerMessage = cleanMessage.toLowerCase();
  
  // 1. 优先排除大盘指数相关查询
  const hasMarketIndexKeywords = MARKET_INDEX_KEYWORDS.some(keyword => 
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
  
  // 2. 优先排除投资咨询相关查询
  const isInvestmentConsultation = INVESTMENT_CONSULTATION_PATTERNS.some(pattern => 
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

  // 3. 排除其他非个股相关关键词
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

  // 4. 使用API验证是否为个股查询
  try {
    console.log('🔍 调用validateStock API验证:', cleanMessage);
    
    const response = await validateStock({ keyword: cleanMessage });
    
    console.log('🔍 API完整响应:', response);
    console.log('🔍 API响应数据部分:', response?.data);
    
    // axios响应格式：response.data = { success: true, code: "00000", message: "请求成功", data: true }
    const apiData = response?.data;
    if (apiData && apiData.success === true && apiData.data === true) {
      // API确认为个股查询
      console.log('✅ API确认为个股查询');
      
      // 尝试提取股票信息
      const stockInfo = extractStockInfoFromMessage(cleanMessage);
      
      return {
        isStockQuery: true,
        confidence: 95, // API验证的高置信度
        stockInfo,
        queryType: 'api_validated',
        reason: 'API验证确认为个股查询',
        message: cleanMessage
      };
    } else {
      // API确认不是个股查询
      console.log('❌ API确认不是个股查询，详细信息:', {
        success: apiData?.success,
        data: apiData?.data,
        code: apiData?.code,
        message: apiData?.message
      });
      
      return {
        isStockQuery: false,
        confidence: 0,
        stockInfo: null,
        queryType: null,
        reason: 'API验证确认不是个股查询'
      };
    }
  } catch (error) {
    console.error('❌ validateStock API调用失败:', error);
    
    // API调用失败时，使用简单的本地检测作为后备
    return performLocalDetection(cleanMessage);
  }
}

/**
 * 从消息中提取股票信息
 * @param {string} message - 用户输入消息
 * @returns {Object} 股票信息
 */
function extractStockInfoFromMessage(message) {
  const stockInfo = {
    type: 'extracted'
  };

  // 提取股票代码
  const codeMatch = message.match(/\b(\d{6})\b/);
  if (codeMatch) {
    stockInfo.codes = [codeMatch[1]];
  }

  // 提取股票名称（带括号代码的完整格式）
  const fullMatch = message.match(/([\u4e00-\u9fa5]{2,8})\s*[（(](\d{6})[)）]/);
  if (fullMatch) {
    stockInfo.names = [fullMatch[1]];
    if (!stockInfo.codes) {
      stockInfo.codes = [fullMatch[2]];
    }
  } else {
    // 提取简单的中文股票名称
    const nameMatch = message.match(/([\u4e00-\u9fa5]{2,8})/);
    if (nameMatch && !stockInfo.names) {
      stockInfo.names = [nameMatch[1]];
    }
  }

  return stockInfo;
}

/**
 * 本地检测（作为API失败时的后备方案）
 * @param {string} message - 用户输入消息
 * @returns {Object} 检测结果
 */
function performLocalDetection(message) {
  console.log('🔄 使用本地检测作为后备方案');
  
  // 简单的本地检测逻辑
  const hasStockCode = /\b\d{6}\b/.test(message);
  const hasStockName = /([\u4e00-\u9fa5]{2,8})\s*[（(]\d{6}[)）]/.test(message);
  const hasSimpleName = /^[\u4e00-\u9fa5]{2,8}$/.test(message.trim());
  
  if (hasStockCode || hasStockName || hasSimpleName) {
    const stockInfo = extractStockInfoFromMessage(message);
    
    return {
      isStockQuery: true,
      confidence: 60, // 本地检测的中等置信度
      stockInfo,
      queryType: 'local_detection',
      reason: '本地检测识别为可能的个股查询',
      message
    };
  }
  
  return {
    isStockQuery: false,
    confidence: 0,
    stockInfo: null,
    queryType: null,
    reason: '本地检测未识别为个股查询'
  };
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
  
  const { stockInfo, confidence, queryType, reason } = detection;
  
  return {
    type: 'individual_stock_query',
    confidence,
    queryType,
    stockInfo,
    reason,
    suggestions: getStockQuerySuggestions(stockInfo),
    displayInfo: {
      title: '个股查询检测',
      subtitle: `置信度: ${confidence}%`,
      details: reason
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
    
    // 从AI回复的标题中提取
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
  if (stockName === "未知股票") {
    // 从用户输入中提取股票名称
    const userNameMatch = userContent.match(/^([\u4e00-\u9fa5]{2,8})/) || 
                         userContent.match(/([\u4e00-\u9fa5]{2,8})(?=[分析怎么样如何走势])/);
    if (userNameMatch) {
      stockName = userNameMatch[1];
      console.log('✅ 从用户输入提取股票名称:', stockName);
    }
    
    // 从AI回复中提取股票名称
    if (stockName === "未知股票" && aiContent) {
      const aiNameMatch = aiContent.match(/股票名称[：:]\s*([\u4e00-\u9fa5]{2,8})/) ||
                         aiContent.match(/^([\u4e00-\u9fa5]{2,8})\s+基本信息/) ||
                         aiContent.match(/([\u4e00-\u9fa5]{2,8})(?=\s*(?:股票|公司|集团|股份))/);
      if (aiNameMatch) {
        stockName = aiNameMatch[1];
        console.log('✅ 从AI回复提取股票名称:', stockName);
      }
    }
  }
  
  if (stockCode === "000000") {
    // 从AI回复中提取股票代码
    if (aiContent) {
      const aiCodeMatch = aiContent.match(/股票代码[：:]\s*(\d{6})/) ||
                         aiContent.match(/代码[：:]\s*(\d{6})/) ||
                         aiContent.match(/[（(](\d{6})[)）]/) ||
                         aiContent.match(/\b(\d{6})\b/);
      if (aiCodeMatch) {
        stockCode = aiCodeMatch[1];
        console.log('✅ 从AI回复提取股票代码:', stockCode);
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
  
  // 5. 最终处理
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

/**
 * 测试函数 - 验证API集成
 * @param {string} testMessage - 测试消息
 */
export async function testStockQuery(testMessage = "中国平安") {
  console.log('🧪 开始测试个股查询检测...');
  console.log('测试消息:', testMessage);
  console.log('API参数: { keyword:', testMessage, '}');
  
  try {
    const result = await detectStockQuery(testMessage);
    console.log('🎯 检测结果:', result);
    return result;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return null;
  }
} 