import { ref, nextTick, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { recommendStock, api } from "@/api/api";
import { mockApi } from "@/api/mock";

export function useStockOperations() {
  // 股票相关状态
  const selectedStock = ref(null);
  const tradeType = ref("buy");
  const buyDialogVisible = ref(false);
  const showAITradingDialog = ref(false);
  const selectedStockForAITrading = ref(null);
  const showQuantReminderDialog = ref(false);
  const currentReminderMessage = ref(null);
  const activeReminders = ref([]);

  // 获取股票当前价格（模拟数据）
  const getCurrentStockPrice = (stockCode) => {
    const mockPrices = {
      "000001": 12.68,
      "000858": 52.3,
      "000002": 24.15,
      300750: 485.2,
      600519: 1680.5,
      "000700": 15.8,
      600036: 35.67,
      "002415": 28.9,
    };
    return mockPrices[stockCode] || 10.0;
  };

  // 格式化荐股时间
  const formatRecommendationTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "刚刚生成";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // 滚动到最新的荐股列表
  const scrollToRecommendation = () => {
    nextTick(() => {
      const recommendationElements = document.querySelectorAll(
        ".persistent-stock-list",
      );
      if (recommendationElements.length > 0) {
        // 滚动到最后一个荐股列表
        const lastRecommendation =
          recommendationElements[recommendationElements.length - 1];
        lastRecommendation.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // 添加高亮效果
        lastRecommendation.classList.add("highlight-recommendation");
        setTimeout(() => {
          lastRecommendation.classList.remove("highlight-recommendation");
        }, 2000);
      }
    });
  };

  // 用户偏好文本转换函数
  const getRiskLevelText = (level) => {
    const riskOptions = [
      { riskLevel: 1, title: "保守型" },
      { riskLevel: 2, title: "稳健型" },
      { riskLevel: 3, title: "平衡型" },
      { riskLevel: 4, title: "成长型" },
      { riskLevel: 5, title: "激进型" },
    ];
    const riskOption = riskOptions.find((option) => option.riskLevel === level);
    return riskOption ? riskOption.title : "未设置";
  };

  const getExperienceText = (experience) => {
    return experience === 1 ? "新手" : experience === 2 ? "有经验" : "未设置";
  };

  const getFocusIndustryText = (focusIndustry) => {
    const labels = [];
    focusIndustry = focusIndustry || [];
    focusIndustry.forEach((item) => {
      if (item.children && Array.isArray(item.children)) {
        item.children.forEach((child) => {
          if (child.label) labels.push(child.label);
        });
      }
    });
    return labels.length > 0 ? labels.join("、") : "未设置";
  };

  // 智能荐股功能
  const handleSmartRecommendation = async (
    userStore,
    chatHistoryStore,
    chatHistory,
    isChatMode,
    scrollToBottom,
    showChatShortcuts,
    showGuide,
    isStillGenerating, // 新增：中断检查函数
  ) => {
    // 登录检查已在调用处完成

    // 切换到聊天模式
    isChatMode.value = true;

    // 构建智能荐股消息
    const userPreferences = userStore.userInfo?.preferences;
    let message = "智能荐股：根据我的投资偏好推荐优质股票\n";
    let userPreferencesText = "";
    if (userPreferences) {
      userPreferencesText += `我的投资偏好：
            - 风险偏好：${getRiskLevelText(userPreferences.riskLevel)} 
            - 投资经验：${getExperienceText(userPreferences.experience)} 
            - 关注板块：${getFocusIndustryText(userPreferences.sectors?.categories)}`;
    }

    // 先显示初始消息
    const processingMessage = {
      role: "user",
      content: message.concat(userPreferencesText),
    };
    const processingMessage1 = {
      role: "assistant",
      content: "",
      isGenerating: true,
    };
    chatHistory.value.push(processingMessage, processingMessage1);

    // 检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 智能荐股 - 在API调用前被中断");
      return;
    }

    // 如果是新聊天，创建聊天记录
    if (!chatHistoryStore.currentChatId) {
      await chatHistoryStore.createNewChat();
    }
    const conversationId = chatHistoryStore.currentChatId;
    console.log("当前聊天ID:", conversationId);

    const mockRes = await mockApi.sendMessage(message);

    // 在API调用后再次检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 智能荐股 - 在API调用后被中断");
      return;
    }

    try {
      let response = await recommendStock({
        pageNo: 1,
        pageSize: 3,
        conversationId: conversationId,
      });

      // 在获取数据后再次检查是否被中断
      if (isStillGenerating && !isStillGenerating()) {
        console.log("🚀 智能荐股 - 在数据处理前被中断");
        return;
      }

      if (response && response.data && response.data.success) {
        let stockList = [];
        let data = response.data.data || [];
        data.forEach((item) => {
          stockList.push({
            name: item.name,
            code: item.code,
            recommendIndex: item.recommendScore,
            recommendLevel: item.recommendLevel,
            price: item.latestPrice, // 当前价格
            change: item.change || 0, // 涨跌额
            changePercent: (item.rise || 0).concat("%"), // 涨跌幅
            targetPrice: item.targetPrice,
            riskLevel: item.riskLevel,
            industry: item.industry,
            reason: item.recommendReason,
          });
        });
        stockList.sort((a, b) => b.recommendIndex - a.recommendIndex);

        console.log("智能荐股API响应:", stockList);

        // 更新最后一条AI消息为荐股结果
        const lastMessage = chatHistory.value[chatHistory.value.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content = mockRes.data.content;
          lastMessage.isGenerating = false; // 取消生成状态
          lastMessage.hasStockInfo = stockList.length > 0;
          lastMessage.isRecommendation = stockList.length > 0;
          lastMessage.stockList = stockList;
          lastMessage.isPersistent = true;
          lastMessage.messageId = `recommendation-${Date.now()}`;
          lastMessage.timestamp = new Date().toISOString();
          chatHistory.value = [...chatHistory.value]; // 触发响应式更新
        }

        await nextTick();
        scrollToBottom();
        ElMessage.success("已为您生成个性化股票推荐");

        // 使用快捷操作后自动收起
        if (showChatShortcuts.value) {
          setTimeout(() => {
            showChatShortcuts.value = false;
          }, 300);
        }
      } else {
        const lastMessage = chatHistory.value[chatHistory.value.length - 1];
        if (lastMessage.content) {
          lastMessage.content += `\n[已终止，${response.exceptionTip || "服务器繁忙"}]`;
        } else {
          lastMessage.content = `[已终止，${response.exceptionTip || "服务器繁忙"}]`;
        }
        lastMessage.isGenerating = false; // 错误时取消生成状态
        chatHistory.value = [...chatHistory.value];
      }
    } catch (err) {
      console.error("智能荐股API调用失败:", JSON.stringify(err));
      const lastMessage = chatHistory.value[chatHistory.value.length - 1];
      if (lastMessage.content) {
        lastMessage.content += `\n[已终止，${err.message || "服务器繁忙"}]`;
      } else {
        lastMessage.content = `[已终止，${err.message || "服务器繁忙"}]`;
      }
      lastMessage.isGenerating = false; // 错误时取消生成状态
      chatHistory.value = [...chatHistory.value];
    }
  };

  // 资讯推送功能
  const handleNewsUpdate = async (
    userStore,
    chatHistory,
    isChatMode,
    scrollToBottom,
    showChatShortcuts,
    showGuide,
    isStillGenerating, // 新增：中断检查函数
  ) => {
    // 登录检查已在调用处完成

    // 切换到聊天模式
    isChatMode.value = true;

    const userMessage = "资讯推送";

    // 添加用户消息和处理中的AI消息
    chatHistory.value.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: "", isGenerating: true },
    );

    // 检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 资讯推送 - 被中断");
      return;
    }

    const fullMessage = "资讯推送：今日重要财经新闻和市场动态";
    const res = await mockApi.sendMessage(fullMessage);

    // 在API调用后再次检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 资讯推送 - API调用后被中断");
      return;
    }

    // 更新最后一条AI消息
    const lastMessage = chatHistory.value[chatHistory.value.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      lastMessage.content = res.data.content;
      lastMessage.isGenerating = false; // 取消生成状态
      chatHistory.value = [...chatHistory.value];
    }

    await nextTick();
    scrollToBottom();
    ElMessage.success("已为您推送最新财经资讯");

    // 使用快捷操作后自动收起
    if (showChatShortcuts.value) {
      setTimeout(() => {
        showChatShortcuts.value = false;
      }, 300);
    }
  };

  // 生成完整的自选股数据（包含详情信息）
  const generateWatchlistStockData = (stock) => {
    const currentPrice = getCurrentStockPrice(stock.code);
    const yesterdayPrice = currentPrice * (1 - (Math.random() * 0.1 - 0.05));
    const changeAmount = currentPrice - yesterdayPrice;
    const changePercent = ((changeAmount / yesterdayPrice) * 100).toFixed(2);

    // 生成目标价格（当前价格的1.1-1.3倍）
    const targetPriceMultiplier = 1.1 + Math.random() * 0.2;
    const targetPrice = (currentPrice * targetPriceMultiplier).toFixed(2);

    // 计算预期收益
    const expectedReturnPercent = (
      ((targetPrice - currentPrice) / currentPrice) *
      100
    ).toFixed(1);

    // 根据股票代码生成风险等级
    const riskLevels = ["低风险", "中低风险", "中风险", "中高风险", "高风险"];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    // 根据股票代码生成推荐等级
    const recommendLevels = ["强烈推荐", "推荐", "中性", "谨慎", "不推荐"];
    const recommendLevel =
      recommendLevels[Math.floor(Math.random() * recommendLevels.length)];

    return {
      ...stock,
      price: stock.price || currentPrice.toFixed(2),
      change:
        stock.change ||
        (changeAmount >= 0
          ? `+${changeAmount.toFixed(2)}`
          : changeAmount.toFixed(2)),
      changePercent:
        stock.changePercent ||
        (parseFloat(changePercent) >= 0
          ? `+${changePercent}%`
          : `${changePercent}%`),
      currentPrice: currentPrice.toFixed(2),
      changeAmount: changeAmount.toFixed(2),
      changePct: parseFloat(changePercent),
      // 详情信息字段
      targetPrice: targetPrice,
      expectedReturn: `${expectedReturnPercent}%`,
      riskLevel: riskLevel,
      recommendLevel: recommendLevel,
      industry: stock.industry || "未分类",
    };
  };

  // 我的资产分析功能
  const handleAssetAnalysis = async (
    userStore,
    chatHistory,
    isChatMode,
    scrollToBottom,
    showChatShortcuts,
    showGuide,
    isStillGenerating, // 新增：中断检查函数
  ) => {
    // 登录检查已在调用处完成

    // 切换到聊天模式
    isChatMode.value = true;

    // 添加用户消息和处理中的AI消息
    const userMessage = "我的资产分析";

    chatHistory.value.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: "", isGenerating: true },
    );

    // 检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 资产分析 - 被中断");
      return;
    }

    // 如果用户没有持仓，添加一些示例数据用于演示
    if (userStore.portfolio.length === 0) {
      // 添加示例持仓数据
      const samplePortfolio = [
        {
          code: "000001",
          name: "平安银行",
          quantity: 1000,
          avgPrice: 11.5,
          industry: "银行",
          buyTime: "2024-01-10T09:30:00.000Z",
        },
        {
          code: "600036",
          name: "招商银行",
          quantity: 500,
          avgPrice: 34.2,
          industry: "银行",
          buyTime: "2024-01-08T10:15:00.000Z",
        },
        {
          code: "000858",
          name: "五粮液",
          quantity: 200,
          avgPrice: 155.8,
          industry: "食品饮料",
          buyTime: "2024-01-05T14:20:00.000Z",
        },
        {
          code: "300750",
          name: "宁德时代",
          quantity: 100,
          avgPrice: 180.5,
          industry: "新能源",
          buyTime: "2024-01-03T11:45:00.000Z",
        },
      ];

      userStore.portfolio.push(...samplePortfolio);
      localStorage.setItem("portfolio", JSON.stringify(userStore.portfolio));
      ElMessage.info("已为您添加示例持仓数据");
    }

    // 构建资产分析消息，包含用户的实际资产数据
    const totalAssets = userStore.getTotalAssets();
    const portfolioCount = userStore.portfolio.length;
    const watchlistCount = userStore.watchlist.length;

    // 计算持仓盈亏
    const portfolioData = userStore.portfolio.map((position) => {
      const currentPrice = getCurrentStockPrice(position.code); // 获取当前价格
      const marketValue = position.quantity * currentPrice;
      const costValue = position.quantity * position.avgPrice;
      const profit = marketValue - costValue;
      const profitPercent = ((profit / costValue) * 100).toFixed(2);

      return {
        ...position,
        currentPrice,
        marketValue,
        costValue,
        profit,
        profitPercent: parseFloat(profitPercent),
      };
    });

    // 计算总盈亏
    const totalProfit = portfolioData.reduce(
      (sum, item) => sum + item.profit,
      0,
    );
    const totalCostValue = portfolioData.reduce(
      (sum, item) => sum + item.costValue,
      0,
    );
    const totalProfitPercent =
      totalCostValue > 0
        ? ((totalProfit / totalCostValue) * 100).toFixed(2)
        : "0.00";

    // 计算持仓市值
    const portfolioValue = portfolioData.reduce(
      (sum, item) => sum + item.marketValue,
      0,
    );

    // 构建资产分析消息
    const message = `资产分析：请分析我的投资组合表现
        
持仓概况：
- 持仓股票数量：${portfolioCount}只
- 持仓总市值：¥${portfolioValue.toLocaleString()}
- 持仓成本：¥${totalCostValue.toLocaleString()}
- 总盈亏：¥${totalProfit.toLocaleString()} (${totalProfitPercent}%)
- 自选股数量：${watchlistCount}只

请提供投资组合优化建议和风险评估。`;

    const res = await mockApi.sendMessage(message);

    // 在API调用后再次检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 资产分析 - API调用后被中断");
      return;
    }

    // 更新最后一条AI消息
    const lastMessage = chatHistory.value[chatHistory.value.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      lastMessage.content = res.data.content;
      lastMessage.isGenerating = false; // 取消生成状态
      lastMessage.hasAssetInfo = true;
      lastMessage.assetData = {
        totalAssets,
        portfolioCount,
        watchlistCount,
        portfolioData: portfolioData.map((item) => ({
          ...item,
          price: item.currentPrice.toFixed(2),
          change: (item.currentPrice - item.avgPrice).toFixed(2),
          changePercent: `${item.profitPercent}%`,
        })),
        watchlistData: userStore.watchlist.map((stock) =>
          generateWatchlistStockData(stock),
        ),
        totalProfit,
        totalProfitPercent: parseFloat(totalProfitPercent),
        portfolioValue,
      };
      chatHistory.value = [...chatHistory.value]; // 触发响应式更新
    }

    await nextTick();
    scrollToBottom();
    ElMessage.success("已为您生成资产分析报告");

    // 使用快捷操作后自动收起
    if (showChatShortcuts.value) {
      setTimeout(() => {
        showChatShortcuts.value = false;
      }, 300);
    }
  };

  // 刷新荐股列表
  const refreshRecommendation = async (message, userStore, chatHistory) => {
    ElMessage.info("正在刷新荐股列表...");

    // 重新调用智能荐股API
    const userPreferences = userStore.userInfo?.preferences;
    let requestMessage = "智能荐股：根据我的投资偏好推荐优质股票";

    if (userPreferences) {
      requestMessage += `\n\n我的投资偏好：
- 风险偏好：${getRiskLevelText(userPreferences.riskLevel)}
- 投资经验：${userPreferences.experience === "beginner" ? "新手" : "有经验"}
- 关注板块：${userPreferences.sectors?.majorCategories?.join("、") || "未设置"}`;
    }

    try {
      const res = await mockApi.sendMessage(requestMessage);

      // 更新现有的荐股消息
      const messageIndex = chatHistory.value.findIndex(
        (msg) => msg.messageId === message.messageId,
      );
      if (messageIndex !== -1) {
        chatHistory.value[messageIndex] = {
          ...res.data,
          isPersistent: true,
          messageId: message.messageId, // 保持原有ID
          timestamp: new Date().toISOString(), // 更新时间戳
        };
      }

      ElMessage.success("荐股列表已刷新");

      // 滚动到更新的荐股列表
      nextTick(() => {
        scrollToRecommendation();
      });
    } catch (error) {
      ElMessage.error("刷新失败，请稍后重试");
    }
  };

  // 购买相关方法
  const showBuyDialog = (stockInfo, type = "buy") => {
    selectedStock.value = stockInfo;
    tradeType.value = type;
    buyDialogVisible.value = true;
  };

  // 处理来自侧边栏的卖出事件
  const handleShowSellDialog = (stockInfo) => {
    showBuyDialog(stockInfo, "sell");
  };

  // 付费量化分析
  const showPaidAnalysisDialog = (stock, userStore, continueAnalysis) => {
    ElMessageBox.confirm(
      `量化分析 ${stock.name}(${stock.code}) 促销价仅需 1智点（原价3智点），是否继续？`,
      "付费服务确认",
      {
        confirmButtonText: "确认支付 1智点",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "paid-service-dialog high-z-index-dialog",
        appendTo: "body",
      },
    )
      .then(() => {
        // 检查智点余额
        if (userStore.smartPointsBalance < 1) {
          ElMessage.error("智点余额不足，请先充值");
          return;
        }

        // 扣除智点并记录交易
        if (userStore.deductSmartPoints(1)) {
          // 记录智点消费
          userStore.addSmartPointsTransaction({
            type: "consumption",
            amount: 1,
            description: `量化分析报告 - ${stock.name}`,
            serviceType: "quant-analysis",
            stockInfo: {
              name: stock.name,
              code: stock.code,
            },
            balanceAfter: userStore.smartPointsBalance,
          });
          ElMessage.success("支付成功，正在生成量化分析报告...");
        } else {
          ElMessage.error("支付失败，智点余额不足");
          return;
        }

        // 执行量化分析
        continueAnalysis(stock, true);
      })
      .catch(() => {
        ElMessage.info("已取消付费分析");
      });
  };

  // 付费AI委托交易
  const showQuantAnalysisDialog = (stock) => {
    // 显示AI委托交易设置对话框
    showAITradingDialog.value = true;
    selectedStockForAITrading.value = stock;
  };

  // 处理AI委托交易确认事件
  const handleAITradingConfirmed = async (
    data,
    chatHistory,
    isChatMode,
    scrollToBottom,
  ) => {
    const { stock, tradingParams, message } = data;

    try {
      const res = await mockApi.sendMessage(message);
      chatHistory.value.push(
        {
          role: "user",
          content: `AI委托交易设置 ${stock.name}(${stock.code})`,
        },
        {
          ...res.data,
          hasStockInfo: true,
          stockInfo: stock,
          isAITradingReport: true,
          tradingParams: tradingParams,
        },
      );

      await nextTick();
      scrollToBottom();

      // 切换到聊天模式
      isChatMode.value = true;
    } catch (error) {
      ElMessage.error("设置失败，请稍后重试");
      console.error("AI委托交易设置失败:", error);
    }
  };

  // 量化分析报告操作方法
  const setQuantAnalysisReminder = (message) => {
    currentReminderMessage.value = message;
    showQuantReminderDialog.value = true;
  };

  // 提醒对话框处理方法
  const handleReminderConfirm = (newReminders) => {
    activeReminders.value.push(...newReminders);

    ElMessage.success(`已成功设置 ${newReminders.length} 个量化分析提醒`);

    // 模拟提醒触发（实际应用中应该是后台监控量化指标）
    newReminders.forEach((reminder, index) => {
      setTimeout(
        () => {
          const conditionText = getReminderDescription(reminder);
          ElMessage({
            message: `🔔 量化分析提醒触发：${reminder.stockName} ${conditionText}`,
            type: "warning",
            duration: 5000,
            showClose: true,
          });

          // 将提醒标记为已触发
          const reminderIndex = activeReminders.value.findIndex(
            (r) => r.id === reminder.id,
          );
          if (reminderIndex !== -1) {
            activeReminders.value[reminderIndex].triggered = true;
          }
        },
        (index + 1) * 3000,
      ); // 每3秒触发一个提醒
    });
  };

  // 获取提醒描述
  const getReminderDescription = (reminder) => {
    const conditionMap = {
      price_above: `价格突破 ¥${reminder.value}`,
      price_below: `价格跌破 ¥${reminder.value}`,
      volume_spike: `成交量异常放大`,
      rsi_oversold: `RSI指标超卖`,
      rsi_overbought: `RSI指标超买`,
      ma_golden_cross: `均线金叉`,
      ma_death_cross: `均线死叉`,
    };
    return conditionMap[reminder.condition] || reminder.condition;
  };

  // 检查聊天历史中是否有荐股列表
  const hasRecommendationInHistory = computed(() => {
    // 这个需要在使用的地方传入chatHistory
    return false; // 占位符，实际使用时需要传入chatHistory
  });

  return {
    // 状态
    selectedStock,
    tradeType,
    buyDialogVisible,
    showAITradingDialog,
    selectedStockForAITrading,
    showQuantReminderDialog,
    currentReminderMessage,
    activeReminders,

    // 方法
    getCurrentStockPrice,
    formatRecommendationTime,
    scrollToRecommendation,
    getRiskLevelText,
    getExperienceText,
    getFocusIndustryText,
    handleSmartRecommendation,
    handleNewsUpdate,
    handleAssetAnalysis,
    generateWatchlistStockData,
    refreshRecommendation,
    showBuyDialog,
    handleShowSellDialog,
    showPaidAnalysisDialog,
    showQuantAnalysisDialog,
    handleAITradingConfirmed,
    setQuantAnalysisReminder,
    handleReminderConfirm,
    getReminderDescription,
    hasRecommendationInHistory,
  };
}
