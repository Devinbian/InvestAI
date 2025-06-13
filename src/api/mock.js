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
