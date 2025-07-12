// 个股查询检测工具测试文件
import { detectStockQuery, formatStockQueryResult, extractStockInfoFromContent } from './stockQueryDetector.js';

// 测试用例
const testCases = [
  // 正面测试用例 - 应该被识别为个股查询
  {
    name: '股票代码查询',
    input: '000001怎么样',
    expected: true,
    description: '纯股票代码+查询词'
  },
  {
    name: '股票名称查询',
    input: '平安银行分析',
    expected: true,
    description: '股票名称+查询词'
  },
  {
    name: '股票代码和名称',
    input: '平安银行(000001)走势如何',
    expected: true,
    description: '股票名称+代码+查询词'
  },
  {
    name: '多个股票代码',
    input: '000001 600036 分析',
    expected: true,
    description: '多个股票代码+查询词'
  },
  {
    name: '上海股票代码',
    input: 'SH600519 茅台怎么样',
    expected: true,
    description: '上海股票代码+查询词'
  },
  {
    name: '深圳股票代码',
    input: 'SZ000858 五粮液前景',
    expected: true,
    description: '深圳股票代码+查询词'
  },
  {
    name: '技术分析查询',
    input: '000001的K线图分析',
    expected: true,
    description: '股票代码+技术分析词'
  },
  {
    name: '基本面查询',
    input: '平安银行的财报怎么样',
    expected: true,
    description: '股票名称+基本面分析词'
  },
  {
    name: '投资建议查询',
    input: '000001值得买入吗',
    expected: true,
    description: '股票代码+投资建议词'
  },
  {
    name: '风险评估查询',
    input: '茅台股票风险大吗',
    expected: true,
    description: '股票名称+风险评估词'
  },

  // 负面测试用例 - 不应该被识别为个股查询
  {
    name: '智能荐股',
    input: '智能荐股推荐',
    expected: false,
    description: '包含排除关键词'
  },
  {
    name: '自选股查询',
    input: '查看我的自选股',
    expected: false,
    description: '包含排除关键词'
  },
  {
    name: '市场分析',
    input: '今天大盘走势如何',
    expected: false,
    description: '市场整体分析'
  },
  {
    name: '板块分析',
    input: '新能源板块分析',
    expected: false,
    description: '板块分析'
  },
  {
    name: '纯数字',
    input: '123456',
    expected: false,
    description: '纯数字，无查询词'
  },
  {
    name: '普通对话',
    input: '你好，今天天气怎么样',
    expected: false,
    description: '普通对话'
  },
  {
    name: '资讯查询',
    input: '最新财经新闻',
    expected: false,
    description: '资讯查询'
  },
  {
    name: '量化策略',
    input: '量化交易策略',
    expected: false,
    description: '量化策略查询'
  },

  // 边界测试用例
  {
    name: '短股票名称',
    input: '万科A分析',
    expected: true,
    description: '短股票名称+查询词'
  },
  {
    name: '长查询内容',
    input: '请详细分析一下平安银行(000001)这只股票的基本面、技术面和投资价值，包括财务指标、行业地位、未来前景等各个方面',
    expected: true,
    description: '长查询内容'
  },
  {
    name: '包含其他数字',
    input: '000001今年涨了20%，后续走势如何',
    expected: true,
    description: '包含其他数字的查询'
  }
];

// 运行测试
export function runStockQueryDetectorTests() {
  console.log('🧪 开始运行个股查询检测器测试...\n');
  
  let passCount = 0;
  let failCount = 0;
  const failedTests = [];

  testCases.forEach((testCase, index) => {
    const result = detectStockQuery(testCase.input);
    const passed = result.isStockQuery === testCase.expected;
    
    if (passed) {
      passCount++;
      console.log(`✅ 测试 ${index + 1}: ${testCase.name} - 通过`);
    } else {
      failCount++;
      failedTests.push(testCase);
      console.log(`❌ 测试 ${index + 1}: ${testCase.name} - 失败`);
      console.log(`   输入: "${testCase.input}"`);
      console.log(`   期望: ${testCase.expected}, 实际: ${result.isStockQuery}`);
      console.log(`   置信度: ${result.confidence}%`);
      console.log(`   原因: ${result.reasons?.join(', ') || result.reason}`);
    }
  });

  console.log(`\n📊 测试结果统计:`);
  console.log(`总测试数: ${testCases.length}`);
  console.log(`通过: ${passCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`成功率: ${((passCount / testCases.length) * 100).toFixed(1)}%`);

  if (failedTests.length > 0) {
    console.log(`\n❌ 失败的测试用例:`);
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}: "${test.input}"`);
      console.log(`   说明: ${test.description}`);
    });
  }

  return {
    total: testCases.length,
    passed: passCount,
    failed: failCount,
    successRate: (passCount / testCases.length) * 100,
    failedTests
  };
}

// 详细测试示例
export function runDetailedTest() {
  console.log('🔍 详细测试示例:\n');
  
  const detailedTestCases = [
    '000001分析',
    '平安银行怎么样',
    '茅台(600519)投资价值',
    '智能荐股推荐',
    '查看自选股'
  ];

  detailedTestCases.forEach((input, index) => {
    console.log(`\n--- 测试 ${index + 1}: "${input}" ---`);
    const result = detectStockQuery(input);
    console.log('检测结果:', result);
    
    if (result.isStockQuery) {
      const formatted = formatStockQueryResult(result);
      console.log('格式化结果:', formatted);
    }
  });
}

// 智能提取功能测试
export function runExtractionTest() {
  console.log('🔍 股票信息智能提取测试:\n');
  
  const extractionTestCases = [
    {
      name: '完整格式提取',
      userInput: '平安银行怎么样',
      aiResponse: '平安银行(000001)是一家优秀的银行股，具有良好的投资价值...',
      expected: { name: '平安银行', code: '000001' }
    },
    {
      name: '仅用户输入有股票名称',
      userInput: '茅台分析',
      aiResponse: '贵州茅台是白酒行业的龙头企业，具有很强的护城河...',
      expected: { name: '茅台', code: '000000' }
    },
    {
      name: '仅AI回复有股票代码',
      userInput: '这只股票怎么样',
      aiResponse: '根据分析，股票代码600519的表现非常优秀...',
      expected: { name: '股票600519', code: '600519' }
    },
    {
      name: '用户输入股票代码',
      userInput: '000001怎么样',
      aiResponse: '这是一只银行股，基本面良好，适合长期投资...',
      expected: { name: '股票000001', code: '000001' }
    },
    {
      name: '知名股票名称匹配',
      userInput: '腾讯投资价值',
      aiResponse: '腾讯控股是互联网行业的领军企业...',
      expected: { name: '腾讯', code: '000000' }
    }
  ];
  
  extractionTestCases.forEach((testCase, index) => {
    console.log(`\n--- 提取测试 ${index + 1}: ${testCase.name} ---`);
    console.log(`用户输入: "${testCase.userInput}"`);
    console.log(`AI回复: "${testCase.aiResponse.substring(0, 50)}..."`);
    
    const detection = detectStockQuery(testCase.userInput);
    const extracted = extractStockInfoFromContent(testCase.aiResponse, testCase.userInput, detection);
    
    console.log('提取结果:', extracted);
    console.log('期望结果:', testCase.expected);
    
    const nameMatch = extracted.name === testCase.expected.name;
    const codeMatch = extracted.code === testCase.expected.code;
    const passed = nameMatch && codeMatch;
    
    console.log(`结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
    if (!passed) {
      console.log(`  名称匹配: ${nameMatch ? '✅' : '❌'} (期望: ${testCase.expected.name}, 实际: ${extracted.name})`);
      console.log(`  代码匹配: ${codeMatch ? '✅' : '❌'} (期望: ${testCase.expected.code}, 实际: ${extracted.code})`);
    }
  });
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.runStockQueryDetectorTests = runStockQueryDetectorTests;
  window.runDetailedTest = runDetailedTest;
  window.runExtractionTest = runExtractionTest;
  
  console.log('🔧 个股查询检测器测试工具已加载');
  console.log('运行测试: runStockQueryDetectorTests()');
  console.log('详细测试: runDetailedTest()');
  console.log('提取测试: runExtractionTest()');
} 