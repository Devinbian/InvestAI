// 股票数据库工具
// 用于获取和管理完整的A股股票列表数据

import { ElMessage } from 'element-plus';
import { getAllStocks } from '../api/stockData.js';

// 完整的股票列表缓存
let stockDatabase = null;
let lastUpdateTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

/**
 * 初始化股票数据库（从API获取完整股票列表）
 */
export async function initStockDatabase() {
  // 检查缓存是否有效
  if (stockDatabase && lastUpdateTime && (Date.now() - lastUpdateTime < CACHE_DURATION)) {
    return stockDatabase;
  }

  // 暂时跳过API调用，直接使用内置数据
  console.log('🔧 临时跳过API调用，使用内置股票数据');
  stockDatabase = buildBuiltInDatabase();
  lastUpdateTime = Date.now();
  return stockDatabase;

  /* 
  // TODO: 等后端接口完成后恢复此代码
  try {
    // 调用后端API获取完整股票列表
    const response = await getAllStocks();
    
    if (response.success) {
      stockDatabase = {
        stocks: response.data || [],
        nameToCode: {},
        codeToName: {},
        fuzzyMap: new Map()
      };
      
      // 建立快速查找映射
      buildSearchMaps(stockDatabase);
      lastUpdateTime = Date.now();
      
      console.log(`股票数据库初始化成功，共加载 ${stockDatabase.stocks.length} 只股票`);
      return stockDatabase;
    }
  } catch (error) {
    console.warn('从API获取股票数据失败，使用内置数据', error);
  }
  
  // 如果API失败，使用内置的常见股票数据
  stockDatabase = buildBuiltInDatabase();
  lastUpdateTime = Date.now();
  return stockDatabase;
  */
}

/**
 * 建立搜索映射
 */
function buildSearchMaps(database) {
  database.stocks.forEach(stock => {
    // 代码到名称映射
    database.codeToName[stock.code] = stock.name;
    
    // 名称到代码映射
    database.nameToCode[stock.name] = stock.code;
    
    // 模糊搜索映射（包含简称、全称等）
    const searchKeys = [
      stock.name,
      stock.shortName || '',
      stock.fullName || '',
      stock.code
    ].filter(key => key);
    
    searchKeys.forEach(key => {
      if (key) {
        database.fuzzyMap.set(key.toLowerCase(), stock);
      }
    });
  });
}

/**
 * 内置常见股票数据库
 */
function buildBuiltInDatabase() {
  const commonStocks = [
    // 银行股
    { code: '000001', name: '平安银行', shortName: '平安银行', industry: '银行' },
    { code: '600000', name: '浦发银行', shortName: '浦发银行', industry: '银行' },
    { code: '600036', name: '招商银行', shortName: '招商银行', industry: '银行' },
    { code: '601318', name: '中国平安', shortName: '中国平安', industry: '保险' },
    { code: '601398', name: '工商银行', shortName: '工商银行', industry: '银行' },
    { code: '601939', name: '建设银行', shortName: '建设银行', industry: '银行' },
    { code: '601288', name: '农业银行', shortName: '农业银行', industry: '银行' },
    { code: '601328', name: '交通银行', shortName: '交通银行', industry: '银行' },
    
    // 白酒股
    { code: '600519', name: '贵州茅台', shortName: '茅台', industry: '食品饮料' },
    { code: '000858', name: '五粮液', shortName: '五粮液', industry: '食品饮料' },
    { code: '000596', name: '古井贡酒', shortName: '古井贡酒', industry: '食品饮料' },
    { code: '002304', name: '洋河股份', shortName: '洋河股份', industry: '食品饮料' },
    { code: '000799', name: '酒鬼酒', shortName: '酒鬼酒', industry: '食品饮料' },
    
    // 科技股
    { code: '000002', name: '万科A', shortName: '万科', industry: '房地产' },
    { code: '000858', name: '五粮液', shortName: '五粮液', industry: '食品饮料' },
    { code: '002415', name: '海康威视', shortName: '海康威视', industry: '电子' },
    { code: '300059', name: '东方财富', shortName: '东方财富', industry: '非银金融' },
    { code: '300750', name: '宁德时代', shortName: '宁德时代', industry: '电气设备' },
    
    // 食糖行业
    { code: '600737', name: '中粮糖业', shortName: '中粮糖业', industry: '食品饮料' },
    { code: '000911', name: '南宁糖业', shortName: '南宁糖业', industry: '食品饮料' },
    { code: '000833', name: '贵糖股份', shortName: '贵糖股份', industry: '食品饮料' },
    
    // 更多常见股票
    { code: '002594', name: '比亚迪', shortName: '比亚迪', industry: '汽车' },
    { code: '000725', name: '京东方A', shortName: '京东方', industry: '电子' },
    { code: '600276', name: '恒瑞医药', shortName: '恒瑞医药', industry: '医药生物' },
    { code: '000063', name: '中兴通讯', shortName: '中兴通讯', industry: '通信' },
    { code: '002230', name: '科大讯飞', shortName: '科大讯飞', industry: '计算机' }
  ];

  const database = {
    stocks: commonStocks,
    nameToCode: {},
    codeToName: {},
    fuzzyMap: new Map()
  };
  
  buildSearchMaps(database);
  return database;
}

/**
 * 精确查找股票（根据代码或名称）
 */
export function findStockExact(query) {
  if (!stockDatabase) {
    return null;
  }
  
  // 移除空格和特殊字符
  const cleanQuery = query.trim();
  
  // 优先按代码查找
  if (/^\d{6}$/.test(cleanQuery)) {
    const name = stockDatabase.codeToName[cleanQuery];
    if (name) {
      return {
        code: cleanQuery,
        name: name,
        source: 'code_match'
      };
    }
  }
  
  // 按名称查找
  const code = stockDatabase.nameToCode[cleanQuery];
  if (code) {
    return {
      code: code,
      name: cleanQuery,
      source: 'name_match'
    };
  }
  
  return null;
}

/**
 * 模糊查找股票
 */
export function findStockFuzzy(query) {
  if (!stockDatabase) {
    return [];
  }
  
  const cleanQuery = query.toLowerCase().trim();
  const results = [];
  
  // 完全匹配
  const exactMatch = stockDatabase.fuzzyMap.get(cleanQuery);
  if (exactMatch) {
    results.push({
      ...exactMatch,
      matchType: 'exact',
      confidence: 100
    });
  }
  
  // 包含匹配
  stockDatabase.fuzzyMap.forEach((stock, key) => {
    if (key.includes(cleanQuery) && key !== cleanQuery) {
      let confidence = 80;
      
      // 如果是以查询开头，给更高分数
      if (key.startsWith(cleanQuery)) {
        confidence = 90;
      }
      
      // 计算相似度
      const similarity = calculateSimilarity(cleanQuery, key);
      confidence = Math.max(confidence, similarity);
      
      results.push({
        ...stock,
        matchType: 'fuzzy',
        confidence: confidence,
        matchedKey: key
      });
    }
  });
  
  // 去重并排序
  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex(t => t.code === item.code)
  );
  
  return uniqueResults.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

/**
 * 计算字符串相似度
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 100;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return Math.round((longer.length - editDistance) / longer.length * 100);
}

/**
 * 计算编辑距离
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 批量验证股票代码或名称
 */
export function validateStocks(queries) {
  return queries.map(query => {
    const exact = findStockExact(query);
    if (exact) {
      return { query, result: exact, valid: true };
    }
    
    const fuzzy = findStockFuzzy(query);
    if (fuzzy.length > 0 && fuzzy[0].confidence > 80) {
      return { query, result: fuzzy[0], valid: true, suggestion: true };
    }
    
    return { query, result: null, valid: false };
  });
}

/**
 * 获取行业分类股票
 */
export function getStocksByIndustry(industry) {
  if (!stockDatabase) {
    return [];
  }
  
  return stockDatabase.stocks.filter(stock => 
    stock.industry && stock.industry.includes(industry)
  );
}

// 导出数据库实例（用于调试）
export function getStockDatabase() {
  return stockDatabase;
}

export default {
  initStockDatabase,
  findStockExact,
  findStockFuzzy,
  validateStocks,
  getStocksByIndustry,
  getStockDatabase
}; 