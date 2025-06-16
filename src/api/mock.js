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
      "均值回归",
      "动量策略",
      "配对交易",
      "夏普比率",
      "最大回撤",
      "年化收益",
      "交易信号",
      "MACD",
      "RSI",
      "布林带",
      "均线交叉",
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

      // 检查是否是具体的策略分析请求
      if (message.includes("均值回归策略")) {
        quantContent = `🤖 **均值回归策略详细分析**

**策略原理**
均值回归策略基于"价格会回归到其长期均值"的理论，当价格偏离均值过多时进行反向操作。

**具体实施方案**
1. **参数设置**
   • 均值计算周期：20日移动平均线
   • 偏离阈值：±2个标准差
   • 持仓周期：5-15个交易日

2. **交易规则**
   • 买入条件：价格跌破均值-2σ时买入
   • 卖出条件：价格回归到均值+1σ时卖出
   • 止损条件：价格继续偏离超过-3σ时止损

3. **风险控制**
   • 单笔投资不超过总资金的10%
   • 同时持仓不超过5只股票
   • 设置15%的止损线

**适用环境**
• 最适合：震荡市场，波动率适中
• 不适合：单边趋势市场
• 推荐板块：大盘蓝筹股、银行股

**预期表现**
• 年化收益：12-18%
• 最大回撤：-8.2%
• 胜率：约65%
• 夏普比率：1.34

**实操建议**
1. 选择流动性好的大盘股
2. 避免在重大事件前后使用
3. 定期检查参数有效性
4. 结合基本面筛选标的`;
      } else if (message.includes("动量策略")) {
        quantContent = `🚀 **动量策略详细分析**

**策略原理**
动量策略基于"强者恒强"的市场规律，追踪价格趋势的持续性，在上涨趋势中买入强势股票。

**具体实施方案**
1. **参数设置**
   • 动量周期：过去20个交易日
   • 强势阈值：涨幅排名前20%
   • 持仓周期：1-3个月

2. **交易规则**
   • 买入条件：股票20日涨幅>15%且成交量放大
   • 加仓条件：突破前期高点且量价齐升
   • 卖出条件：跌破20日均线或涨幅排名跌出前50%

3. **风险控制**
   • 严格止损：跌破买入价8%立即止损
   • 分批建仓：分3次建仓，每次1/3仓位
   • 行业分散：不超过3个行业

**适用环境**
• 最适合：牛市或明确上升趋势
• 不适合：震荡市或熊市
• 推荐板块：科技股、新能源、医药

**预期表现**
• 年化收益：15-25%
• 最大回撤：-15.7%
• 胜率：约55%
• 夏普比率：1.12

**实操建议**
1. 关注市场热点和题材股
2. 严格执行止损纪律
3. 在趋势确立后再进入
4. 注意仓位管理，避免追高`;
      } else if (message.includes("配对交易")) {
        quantContent = `⚖️ **配对交易策略详细分析**

**策略原理**
配对交易通过做多被低估的股票，同时做空被高估的股票，利用两只相关股票间的价差回归获利。

**具体实施方案**
1. **股票配对选择**
   • 同行业龙头股：如招商银行 vs 平安银行
   • 相关系数>0.7的股票对
   • 基本面相似但估值有差异

2. **交易规则**
   • 价差偏离历史均值2σ时建仓
   • 做多相对便宜的股票
   • 做空相对昂贵的股票（A股可用融券）
   • 价差回归到均值时平仓

3. **风险控制**
   • 市场中性：多空仓位基本平衡
   • 止损线：价差继续扩大超过3σ
   • 时间止损：持仓超过3个月强制平仓

**适用环境**
• 最适合：任何市场环境（市场中性）
• 特别适合：震荡市场
• 推荐配对：银行股、地产股、钢铁股

**预期表现**
• 年化收益：8-12%
• 最大回撤：-4.1%
• 胜率：约70%
• 夏普比率：1.67

**实操建议**
1. 选择流动性好的股票对
2. 定期检查相关性是否稳定
3. 注意融券成本和可融券数量
4. 避免在重大事件期间操作`;
      } else if (message.includes("多因子模型")) {
        quantContent = `🧮 **多因子选股模型详细分析**

**策略原理**
多因子模型通过综合多个有效因子对股票进行评分排序，选择综合评分最高的股票构建投资组合。

**具体实施方案**
1. **因子体系**
   • 估值因子（25%权重）：PE、PB、PS
   • 盈利因子（30%权重）：ROE、ROA、净利润增长率
   • 成长因子（25%权重）：营收增长率、EPS增长率
   • 质量因子（20%权重）：资产负债率、现金流

2. **选股流程**
   • 因子标准化处理
   • 加权计算综合得分
   • 选择得分前20%的股票
   • 等权重构建投资组合

3. **调仓规则**
   • 调仓频率：每月调仓一次
   • 换手率控制：单次调仓不超过30%
   • 行业中性：各行业权重不偏离基准过多

**适用环境**
• 最适合：中长期投资
• 适用市场：各种市场环境
• 推荐范围：全市场选股

**预期表现**
• 年化收益：15-20%
• 最大回撤：-9.8%
• 胜率：约62%
• 夏普比率：1.45

**实操建议**
1. 定期检查因子有效性
2. 根据市场环境调整因子权重
3. 注意因子间的相关性
4. 结合宏观环境优化模型`;
      } else if (message.includes("因子")) {
        quantContent = quantResponses.factor;
      } else if (
        message.includes("信号") ||
        message.includes("技术指标") ||
        message.includes("MACD") ||
        message.includes("RSI")
      ) {
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
