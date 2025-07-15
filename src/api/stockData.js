// 股票数据API接口
// 用于获取完整的A股股票列表数据

import request from '../utils/request.js';

/**
 * 获取完整的A股股票列表
 * @returns {Promise} API响应
 */
export function getAllStocks() {
  return request({
    url: '/stocks/all',
    method: 'get',
    timeout: 10000 // 10秒超时
  });
}

/**
 * 获取股票基本信息
 * @param {string} code - 股票代码
 * @returns {Promise} API响应
 */
export function getStockInfo(code) {
  return request({
    url: `/stocks/info/${code}`,
    method: 'get'
  });
}

/**
 * 搜索股票（支持代码和名称）
 * @param {string} query - 搜索关键词
 * @param {number} limit - 返回结果数量限制
 * @returns {Promise} API响应
 */
export function searchStocks(query, limit = 10) {
  return request({
    url: '/stocks/search',
    method: 'get',
    params: {
      q: query,
      limit: limit
    }
  });
}

/**
 * 根据行业获取股票列表
 * @param {string} industry - 行业名称
 * @returns {Promise} API响应
 */
export function getStocksByIndustry(industry) {
  return request({
    url: '/stocks/industry',
    method: 'get',
    params: {
      industry: industry
    }
  });
}

/**
 * 验证股票代码或名称
 * @param {Array} queries - 待验证的股票代码或名称列表
 * @returns {Promise} API响应
 */
export function validateStockQueries(queries) {
  return request({
    url: '/stocks/validate',
    method: 'post',
    data: {
      queries: queries
    }
  });
}

/**
 * 获取热门股票列表
 * @param {number} limit - 返回结果数量限制
 * @returns {Promise} API响应
 */
export function getHotStocks(limit = 50) {
  return request({
    url: '/stocks/hot',
    method: 'get',
    params: {
      limit: limit
    }
  });
}

export default {
  getAllStocks,
  getStockInfo,
  searchStocks,
  getStocksByIndustry,
  validateStockQueries,
  getHotStocks
}; 