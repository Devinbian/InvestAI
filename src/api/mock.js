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
    // 确保message是字符串类型
    if (typeof message !== "string") {
      if (message && typeof message === "object") {
        // 如果是对象，尝试获取content或title字段，或转换为JSON字符串
        message = message.content || message.title || JSON.stringify(message);
      } else {
        // 其他类型转换为字符串
        message = String(message || "");
      }
    }

    // 检查是否是智能荐股查询
    const isSmartRecommendation = message.includes("智能荐股");

    // 检查是否是资讯推送查询
    const isNewsUpdate = message.includes("资讯推送");

    // 检查是否是我的资产查询
    const isAssetAnalysis = message.includes("我的资产");

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

    // 检查是否是复盘相关查询
    const isReviewQuery =
      message.includes("复盘") || message.includes("昨日复盘");

    let response;

    if (isReviewQuery) {
      // 昨日复盘响应 - 优先级最高
      response = {
        role: "assistant",
        content: `📊 **昨日市场复盘分析**

**🏛️ 大盘走势回顾**
• **上证指数**：收盘3,245.68点，上涨+1.23%（+39.45点）
• **深证成指**：收盘10,892.34点，上涨+0.87%（+93.67点）  
• **创业板指**：收盘2,156.78点，上涨+2.15%（+45.32点）
• **成交量**：沪深两市成交额8,567亿元，较前日放量12.3%

**🔥 热点板块分析**
• **领涨板块**：新能源汽车(+3.2%)、人工智能(+2.8%)、医药生物(+2.1%)
• **资金流向**：主力净流入156.8亿元，其中科技股获得78.2亿元净流入
• **板块轮动**：资金从传统周期股流向成长股，科技板块重新获得关注
• **题材热点**：ChatGPT概念、锂电池产业链、创新药研发

**💼 个人持仓表现**
基于您当前的持仓情况分析：
• **整体表现**：持仓股票平均涨幅+1.45%，跑赢大盘0.22个百分点
• **最佳表现**：如有新能源相关持仓，昨日表现突出
• **需要关注**：传统行业股票表现相对较弱，建议关注仓位配置

**📈 技术面变化**
• **趋势判断**：大盘突破短期阻力位，多头情绪回暖
• **技术指标**：MACD金叉确认，RSI(58)处于健康区间
• **支撑阻力**：上证指数支撑位3,200点，阻力位3,280点
• **成交量**：放量上涨，资金入场意愿增强

**💡 今日操作建议**
• **短线策略**：关注昨日强势板块的持续性，可适当参与
• **中线布局**：逢低关注优质成长股，分批建仓
• **风险控制**：设置3,200点止损位，控制单日亏损在2%以内
• **仓位管理**：建议保持6-7成仓位，留有机动资金

**⚠️ 风险提示**
• **政策风险**：关注监管政策变化对相关板块的影响
• **外围市场**：美股走势和美联储政策动向需密切关注
• **技术风险**：大盘虽然上涨但成交量需要持续放大确认
• **个股风险**：避免追高，选择有基本面支撑的标的

**📅 今日关注事项**
• **重要数据**：14:00发布工业增加值数据
• **公司公告**：关注重点持仓股票的业绩预告和重大事项
• **市场情绪**：观察北向资金流向和机构调研动向
• **技术位置**：关注3,280点阻力位的突破情况

**🎯 投资策略调整**
• **配置建议**：适当增加科技成长股配置，减少周期股权重
• **选股思路**：关注业绩确定性强、估值合理的优质标的
• **操作节奏**：不追高不杀跌，坚持价值投资理念
• **风控措施**：严格执行止损纪律，保持理性投资心态

*以上分析基于公开市场数据，仅供参考，投资有风险，决策需谨慎*`,
        hasStockInfo: false,
        isReview: true,
      };
    } else if (isSmartRecommendation) {
      // 智能荐股响应 - 返回多只股票的推荐列表
      const recommendedStocks = [
        {
          code: "000001",
          name: "平安银行",
          price: "12.45",
          change: 0.23,
          changePercent: 1.88,
          targetPrice: "14.20",
          expectedReturn: "14.1%",
          reason: "估值合理，ROE持续提升，银行业复苏预期强烈",
          riskLevel: "中等",
          industry: "银行",
          pe: 5.2,
          pb: 0.8,
          marketCap: 240000000000,
          score: 85,
          recommendation: "买入",
          recommendIndex: 4.2,
          recommendLevel: "推荐",
        },
        {
          code: "600519",
          name: "贵州茅台",
          price: "1678.90",
          change: -12.5,
          changePercent: -0.74,
          targetPrice: "1850.00",
          expectedReturn: "10.2%",
          reason: "品牌价值稳固，消费复苏带动业绩增长",
          riskLevel: "较低",
          industry: "白酒",
          pe: 28.5,
          pb: 8.2,
          marketCap: 2100000000000,
          score: 88,
          recommendation: "买入",
          recommendIndex: 4.6,
          recommendLevel: "强烈推荐",
        },
        {
          code: "300750",
          name: "宁德时代",
          price: "185.50",
          change: 8.2,
          changePercent: 4.62,
          targetPrice: "220.00",
          expectedReturn: "18.6%",
          reason: "新能源车产业链核心，技术领先优势明显",
          riskLevel: "较高",
          industry: "新能源",
          pe: 35.8,
          pb: 4.5,
          marketCap: 432000000000,
          score: 82,
          recommendation: "买入",
          recommendIndex: 4.0,
          recommendLevel: "推荐",
        },
      ];

      response = {
        role: "assistant",
        content: `🎯 **智能荐股推荐**

基于您的投资偏好和当前市场环境，我为您推荐以下优质股票：

**推荐股票列表**
以下股票均经过多维度分析筛选，具有良好的投资价值。您可以点击下方的股票操作按钮进行进一步分析、添加自选股或购买操作。

**投资建议**
• 建议分散投资，每只股票配置不超过总资金的20%
• 关注市场情绪变化，适时调整仓位
• 设置止损位，控制单笔投资风险在10%以内
• 定期关注公司基本面变化和行业发展趋势

**风险提示**
以上推荐仅供参考，投资有风险，入市需谨慎。建议结合自身风险承受能力做出投资决策。`,
        hasStockInfo: true,
        stockList: recommendedStocks, // 返回股票列表而不是单只股票
        isRecommendation: true,
      };
    } else if (message.includes("【付费深度分析】")) {
      // 付费深度分析响应
      const stockMatch = message.match(/【付费深度分析】请对(.+?)\((.+?)\)/);
      const stockName = stockMatch ? stockMatch[1] : "该股票";
      const stockCode = stockMatch ? stockMatch[2] : "";

      response = {
        role: "assistant",
        content: `🔍 **${stockName}(${stockCode}) 深度分析报告**

**📊 基本面分析**
• 财务指标：ROE 15.2%，净利润增长率 18.5%，资产负债率 45.3%
• 盈利能力：毛利率 35.8%，净利率 12.4%，营收增长稳定
• 成长性：近三年复合增长率 22.1%，业务扩张能力强

**📈 技术面分析**
• K线形态：突破上升三角形，多头排列明显
• 技术指标：MACD金叉，RSI(65)适中，布林带上轨突破
• 支撑阻力：支撑位¥${(parseFloat("168.50") * 0.95).toFixed(2)}，阻力位¥${(parseFloat("168.50") * 1.08).toFixed(2)}

**🏭 行业对比分析**
• 市场地位：行业前三，市占率15.2%
• 竞争优势：技术壁垒高，品牌影响力强
• 行业前景：预计未来3年行业增速12-15%

**🔮 未来发展前景**
• 业务增长点：新产品线贡献30%增量，海外市场拓展
• 风险因素：原材料价格波动，政策监管变化
• 催化剂：新技术应用，战略合作推进

**💡 投资建议**
• 买入时机：回调至¥${(parseFloat("168.50") * 0.97).toFixed(2)}附近分批建仓
• 目标价位：6个月目标价¥185.00，12个月目标价¥195.00
• 止损位：跌破¥${(parseFloat("168.50") * 0.92).toFixed(2)}止损

**📋 资金配置建议**
• 仓位管理：建议配置5-8%仓位，分3次建仓
• 分批策略：首次30%，回调加仓40%，突破确认30%
• 风控措施：设置8%止损，20%止盈减仓50%

*本报告基于当前市场数据分析，投资有风险，请谨慎决策*`,
        hasStockInfo: false,
        isPaidAnalysis: true,
      };
    } else if (message.includes("【付费量化分析】")) {
      // 付费量化分析响应
      const stockMatch = message.match(/【付费量化分析】请对(.+?)\((.+?)\)/);
      const stockName = stockMatch ? stockMatch[1] : "该股票";
      const stockCode = stockMatch ? stockMatch[2] : "";

      response = {
        role: "assistant",
        content: `⚡ **${stockName}(${stockCode}) 量化分析报告**

**📊 技术指标分析**
• MACD：DIF(1.25) > DEA(0.89)，金叉信号强度85%
• RSI：14日RSI(65.2)，处于强势区间，未超买
• 布林带：价格突破上轨，带宽扩张，趋势加速
• KDJ：K(78) > D(65) > J(85)，多头排列

**🔢 量化选股因子评分**
• 价值因子：PE(18.5) PB(2.1) 评分7.2/10
• 成长因子：营收增长(18.5%) 净利增长(22.1%) 评分8.5/10
• 质量因子：ROE(15.2%) 资产周转率(1.8) 评分7.8/10
• 综合评分：7.8/10 (超越78%同行业股票)

**⚠️ 风险评估模型**
• 历史波动率：年化波动率28.5%，属中等风险
• 最大回撤：近一年最大回撤15.2%，风控良好
• 夏普比率：1.35，风险调整后收益优秀
• VaR(95%)：日风险价值2.1%

**🎯 量化交易信号**
• 买入信号：多因子模型评分85/100，信号强度【强】
• 信号类型：趋势突破+动量确认，双重验证
• 持续性：预计信号有效期5-8个交易日
• 成功概率：基于历史回测，成功率72%

**📈 回测数据分析**
• 策略表现：近一年收益率35.2% vs 基准15.8%
• 胜率统计：交易胜率68%，盈亏比1.8:1
• 最佳持仓：平均最佳持仓周期12个交易日
• 风险指标：最大连续亏损3次，平均亏损1.2%

**🤖 量化投资策略建议**
• 策略类型：趋势跟踪+均值回归组合策略
• 参数设置：
  - 买入阈值：多因子评分>80
  - 止盈设置：15%分批止盈
  - 止损设置：8%严格止损
• 风控措施：
  - 单股最大仓位8%
  - 相关性控制<0.6
  - 动态调仓周期7天

**📊 量化评级：A级 (强烈推荐)**

*本量化分析基于历史数据建模，市场有风险，量化策略仅供参考*`,
        hasStockInfo: false,
        isQuantAnalysis: true,
      };
    } else if (isNewsUpdate) {
      // 资讯推送响应
      const newsItems = [
        {
          title: "央行降准0.25个百分点，释放流动性约5000亿元",
          time: "2024-01-15 09:30",
          impact: "利好",
          summary:
            "央行宣布下调存款准备金率，为市场注入流动性，有利于降低融资成本",
        },
        {
          title: "新能源汽车销量创新高，产业链公司受益",
          time: "2024-01-15 10:15",
          impact: "利好",
          summary:
            "12月新能源车销量同比增长46.8%，宁德时代、比亚迪等龙头股有望受益",
        },
        {
          title: "美联储暗示年内可能降息，全球股市普涨",
          time: "2024-01-15 08:45",
          impact: "利好",
          summary:
            "美联储主席鲍威尔表示通胀压力缓解，为降息打开空间，利好风险资产",
        },
        {
          title: "房地产政策进一步放松，地产股集体上涨",
          time: "2024-01-15 11:20",
          impact: "利好",
          summary: "多地出台房地产支持政策，万科A、保利发展等地产股涨幅居前",
        },
      ];

      let newsContent = newsItems
        .map(
          (news) =>
            `**${news.title}**
📅 ${news.time} | ${news.impact === "利好" ? "📈" : "📉"} ${news.impact}
${news.summary}`,
        )
        .join("\n\n");

      response = {
        role: "assistant",
        content: `📰 **今日财经资讯**

${newsContent}

**市场观点**
• 货币政策边际宽松，有利于提振市场信心
• 新能源板块景气度持续，关注产业链投资机会
• 全球流动性预期改善，A股有望迎来估值修复
• 房地产政策底部确认，相关板块或迎来反弹

**投资策略**
• 短期关注政策受益板块：银行、地产、新能源
• 中期布局高景气赛道：人工智能、生物医药
• 长期配置核心资产：消费白马、科技龙头

💡 **温馨提示**：以上资讯仅供参考，投资决策请结合个人风险偏好。`,
        hasStockInfo: false,
        isNewsUpdate: true,
      };
    } else if (isAssetAnalysis) {
      // 我的资产分析响应
      response = {
        role: "assistant",
        content: `💰 **资产配置分析报告**

根据您提供的资产信息，我为您做出以下分析：

**资产结构评估**
• 现金比例：根据您的余额情况，建议保持20-30%的现金仓位
• 股票配置：当前持仓分散度${message.includes("持仓股票：0只") ? "不足，建议增加" : "适中，可以优化"}
• 行业分布：${message.includes("持仓股票：0只") ? "暂无持仓" : "建议关注行业配置均衡性"}

**投资组合建议**
• **核心配置(50%)**：选择业绩稳定的蓝筹股，如银行、消费龙头
• **成长配置(30%)**：关注新兴行业，如新能源、人工智能
• **防御配置(20%)**：配置高分红股票或债券基金

**风险控制建议**
• 单只股票仓位不超过总资产的15%
• 同一行业配置不超过总资产的25%
• 设置止损线，及时控制亏损
• 定期调仓，保持组合活力

**优化方案**
${
  message.includes("持仓股票：0只")
    ? "• 建议从稳健的蓝筹股开始建仓\n• 可以考虑定投方式分批买入\n• 优先配置自选股中的优质标的"
    : "• 检查持仓股票基本面变化\n• 适当调整仓位配置\n• 考虑增加防御性资产"
}

**下一步行动**
1. 完善投资偏好设置，获得更精准的建议
2. 关注市场热点，寻找投资机会
3. 定期回顾投资组合表现
4. 学习投资知识，提升投资能力

📊 **个性化提醒**：建议您定期查看资产配置情况，根据市场变化及时调整投资策略。`,
        hasStockInfo: false,
        isAssetAnalysis: true,
      };
    } else if (isBuyQuery) {
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

// 模拟微信登录API
export const wechatLoginApi = {
  // 获取微信登录二维码
  getQRCode: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            qrCode:
              "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=mock_ticket_" +
              Date.now(),
            ticket: "mock_ticket_" + Date.now(),
            expireTime: Date.now() + 5 * 60 * 1000, // 5分钟过期
          },
        });
      }, 500);
    });
  },

  // 检查扫码状态
  checkScanStatus: (ticket) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟不同的扫码状态
        const random = Math.random();
        if (random < 0.3) {
          // 30% 概率还未扫码
          resolve({
            success: true,
            data: {
              status: "waiting",
              message: "等待扫码",
            },
          });
        } else if (random < 0.6) {
          // 30% 概率已扫码但未确认
          resolve({
            success: true,
            data: {
              status: "scanned",
              message: "已扫码，请在手机上确认登录",
            },
          });
        } else {
          // 40% 概率登录成功
          resolve({
            success: true,
            data: {
              status: "confirmed",
              message: "登录成功",
              userInfo: {
                openid: "wx_" + Date.now(),
                nickname: "微信用户" + Math.floor(Math.random() * 1000),
                avatar:
                  "https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL4JuXdK8rM8tO3dJKuKcuXiaBL7jb9h9ib9nz1CpweE8icQJ4EjHsjzHMrKKKfFSr6zrKx7gtKvCUA/132",
                unionid: "union_" + Date.now(),
              },
            },
          });
        }
      }, 1000);
    });
  },

  // 直接微信登录（移动端）
  mobileLogin: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            token: "wechat-token-" + Date.now(),
            userInfo: {
              openid: "wx_" + Date.now(),
              nickname: "微信用户" + Math.floor(Math.random() * 1000),
              avatar:
                "https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL4JuXdK8rM8tO3dJKuKcuXiaBL7jb9h9ib9nz1CpweE8icQJ4EjHsjzHMrKKKfFSr6zrKx7gtKvCUA/132",
              unionid: "union_" + Date.now(),
              loginType: "wechat",
            },
          },
        });
      }, 2000);
    });
  },
};
