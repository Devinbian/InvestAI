import Mock from "mockjs";

// 模拟股票数据
const stockList = Mock.mock({
  "list|10": [
    {
      "code|600000-603999": 1,
      name: "@cword(2,4)",
      "price|10-100.2": 1,
      "change|0-10.2": 1,
      "changePercent|0-10.2": 1,
      industry:
        '@pick(["科技", "金融", "医疗健康", "消费", "能源", "房地产", "制造业", "农业"])',
      "pe|0-100.2": 1,
      "pb|0-10.2": 1,
      "marketCap|100000000-10000000000": 1,
    },
  ],
}).list;

// 模拟对话历史
const chatHistory = [
  {
    role: "assistant",
    content:
      "您好！我是您的智能投资助手。我可以帮您分析股票、提供投资建议，以及回答您的投资相关问题。请问有什么我可以帮您的吗？",
  },
];

// 模拟API响应
export const mockApi = {
  // 获取股票列表
  getStockList: () => {
    return Promise.resolve({
      code: 200,
      data: stockList,
      message: "success",
    });
  },

  // 获取对话历史
  getChatHistory: () => {
    return Promise.resolve({
      code: 200,
      data: chatHistory,
      message: "success",
    });
  },

  // 发送消息
  sendMessage: (message) => {
    // 检查是否是股票相关查询
    const stockKeywords = [
      "股票",
      "分析",
      "平安银行",
      "五粮液",
      "万科",
      "宁德时代",
      "茅台",
      "腾讯",
      "阿里",
      "比亚迪",
    ];
    const isStockQuery = stockKeywords.some((keyword) =>
      message.includes(keyword),
    );

    // 检查是否是购买相关查询
    const buyKeywords = ["购买", "买入", "买", "下单"];
    const isBuyQuery = buyKeywords.some((keyword) => message.includes(keyword));

    // 检查是否是量化相关查询
    const quantKeywords = [
      "量化",
      "策略",
      "回测",
      "因子",
      "算法",
      "信号",
      "多因子",
      "技术指标",
    ];
    const isQuantQuery = quantKeywords.some((keyword) =>
      message.includes(keyword),
    );

    let response;

    if (isBuyQuery) {
      // 购买相关响应
      const stockInfo = {
        code: "000001",
        name: "平安银行",
        price: "12.45",
        change: 0.23,
        changePercent: 1.88,
        industry: "银行",
        pe: 5.2,
        pb: 0.8,
        marketCap: 240000000000,
      };

      response = {
        role: "assistant",
        content: `我为您找到了${stockInfo.name}(${stockInfo.code})的交易信息：

**当前价格**：¥${stockInfo.price}
**今日涨跌**：${stockInfo.change > 0 ? "+" : ""}${stockInfo.change}(${stockInfo.changePercent > 0 ? "+" : ""}${stockInfo.changePercent}%)

您可以通过下方的购买按钮进行交易操作。建议您：
• 根据自己的风险承受能力确定购买数量
• 注意分散投资，不要把所有资金投入单一股票
• 关注市场动态，适时调整投资策略`,
        stockInfo: stockInfo,
        hasStockInfo: true,
        isBuyMode: true, // 标识这是购买模式
      };
    } else if (isQuantQuery) {
      // 量化相关响应
      const quantResponses = {
        strategy: `🤖 **量化策略推荐**

基于当前市场环境，我为您推荐以下适合散户的量化策略：

**1. 均值回归策略**
• 适用场景：震荡市场
• 预期年化收益：12-18%
• 风险等级：中等
• 策略原理：利用价格偏离均值后的回归特性

**2. 动量策略**
• 适用场景：趋势明确的市场
• 预期年化收益：15-25%
• 风险等级：较高
• 策略原理：追踪强势股票的持续上涨

**3. 多因子选股模型**
• 适用场景：长期投资
• 预期年化收益：10-20%
• 风险等级：中等
• 策略原理：综合估值、盈利、成长等多个因子

💡 **建议**：可以在侧边栏的"量化分析"中进行详细的策略回测和因子分析。`,

        factor: `📊 **多因子选股分析**

基于量化因子模型，我为您分析了当前市场的有效因子：

**估值因子**
• PE因子：当前有效性较高，IC值0.08
• PB因子：在银行、地产板块表现突出
• 建议权重：25%

**盈利因子**
• ROE因子：持续有效，适合长期持有
• 净利润增长率：在成长股中表现优异
• 建议权重：30%

**技术因子**
• 动量因子：短期有效性强，适合波段操作
• 反转因子：在超跌股中表现良好
• 建议权重：20%

**质量因子**
• 资产负债率：在当前环境下重要性提升
• 现金流因子：防御性较强
• 建议权重：25%

🎯 **选股建议**：建议使用多因子综合评分，选择排名前20%的股票构建投资组合。`,

        signal: `📡 **技术指标交易信号**

基于多种技术指标组合，当前市场信号如下：

**买入信号**
• 平安银行(000001)：MACD金叉 + RSI超卖反弹
• 招商银行(600036)：均线多头排列 + 成交量放大
• 五粮液(000858)：布林带下轨反弹 + KDJ金叉

**卖出信号**
• 某科技股：RSI超买 + 顶背离
• 某地产股：跌破重要支撑位

**观望信号**
• 大盘指数：在关键阻力位附近震荡
• 建议等待明确突破信号

⚠️ **风险提示**：技术指标具有滞后性，建议结合基本面分析使用。信号仅供参考，投资需谨慎。`,

        backtest: `📈 **策略回测结果**

我为您模拟了一个多因子策略的历史回测：

**回测参数**
• 回测期间：2020-01-01 至 2024-01-01
• 初始资金：100万元
• 股票池：沪深300
• 调仓频率：月度

**回测结果**
• 总收益率：+68.5%
• 年化收益率：+14.2%
• 最大回撤：-12.8%
• 夏普比率：1.35
• 胜率：58.3%
• 交易次数：156次

**基准对比**
• 沪深300指数同期收益：+28.3%
• 超额收益：+40.2%
• 信息比率：1.12

✅ **策略评价**：该策略在历史数据中表现良好，具有较好的风险调整收益。但请注意，历史表现不代表未来收益。`,
      };

      // 根据消息内容选择合适的响应
      let quantContent;
      if (message.includes("策略")) {
        quantContent = quantResponses.strategy;
      } else if (message.includes("因子")) {
        quantContent = quantResponses.factor;
      } else if (message.includes("信号") || message.includes("技术指标")) {
        quantContent = quantResponses.signal;
      } else if (message.includes("回测")) {
        quantContent = quantResponses.backtest;
      } else {
        quantContent = quantResponses.strategy; // 默认返回策略介绍
      }

      response = {
        role: "assistant",
        content: quantContent,
        hasStockInfo: false,
        isQuantAnalysis: true, // 标识这是量化分析
      };
    } else if (isStockQuery) {
      // 模拟股票分析响应，包含结构化股票信息
      const stockInfo = {
        code: "000001",
        name: "平安银行",
        price: "12.45",
        change: 0.23,
        changePercent: 1.88,
        industry: "银行",
        pe: 5.2,
        pb: 0.8,
        marketCap: 240000000000,
        analysis: {
          fundamental: "公司基本面良好，ROE持续提升，资产质量稳定。",
          technical: "技术面显示股价处于上升通道，MACD金叉，RSI指标健康。",
          recommendation: "建议适量配置，目标价位13.5元。",
          risk: "需关注银行业监管政策变化和利率环境影响。",
        },
      };

      response = {
        role: "assistant",
        content: `根据您的查询，我为您分析了${stockInfo.name}(${stockInfo.code})：

**基本信息**
• 当前价格：¥${stockInfo.price}
• 涨跌幅：${stockInfo.change > 0 ? "+" : ""}${stockInfo.change}(${stockInfo.changePercent > 0 ? "+" : ""}${stockInfo.changePercent}%)
• 所属行业：${stockInfo.industry}
• 市盈率：${stockInfo.pe}
• 市净率：${stockInfo.pb}

**投资分析**
📊 **基本面分析**：${stockInfo.analysis.fundamental}

📈 **技术面分析**：${stockInfo.analysis.technical}

💡 **投资建议**：${stockInfo.analysis.recommendation}

⚠️ **风险提示**：${stockInfo.analysis.risk}`,
        stockInfo: stockInfo, // 附加股票信息用于自选股功能
        hasStockInfo: true,
      };
    } else {
      // 普通AI响应
      const responses = [
        "根据您的风险偏好和投资目标，我建议您可以关注以下股票。",
        "从技术面分析，该股票目前处于上升趋势，但需要注意风险控制。",
        "根据基本面分析，该公司的财务状况良好，具有长期投资价值。",
        "建议您关注该行业的龙头企业，它们通常具有更好的抗风险能力。",
        "从估值角度来看，目前该股票的PE处于历史低位，具有投资价值。",
      ];

      response = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        hasStockInfo: false,
      };
    }

    chatHistory.push({ role: "user", content: message }, response);

    return Promise.resolve({
      code: 200,
      data: response,
      message: "success",
    });
  },
};
