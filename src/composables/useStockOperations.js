import { ref, nextTick, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { recommendStock, api } from "@/api/api";
import { mockApi } from "@/api/mock";
import {
  getRiskLevelText,
  getExperienceText,
  getFocusIndustryText,
} from "@/utils/userPortraitHelpers";
import { generateMessageId } from "@/utils/formatters";
import { authFetchEventSource } from "@/utils/request";

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
      const recommendationElements = document.querySelectorAll(".stock-list");
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
    const userPreferences = userStore.getUserPreferences();
    let message = "智能荐股：根据我的投资偏好推荐优质股票\n";
    let userPreferencesText = "";
    if (userPreferences && userPreferences.riskLevel) {
      userPreferencesText += `\n\n我的投资偏好：
- 风险偏好：${getRiskLevelText(userPreferences.riskLevel)}
- 投资经验：${getExperienceText(userPreferences.experience)}
- 关注板块：${getFocusIndustryText(userPreferences.sectors?.categories)}`;
    } else {
      // 如果没有偏好设置，提示用户先设置偏好
      userPreferencesText =
        "\n\n💡 提示：您还没有设置投资偏好，建议先完善投资偏好设置以获得更精准的推荐。";
    }

    // 先显示初始消息
    const processingMessage = {
      id: generateMessageId(),
      role: "user",
      content: message.concat(userPreferencesText),
      timestamp: Date.now(),
    };
    const processingMessage1 = {
      id: generateMessageId(),
      role: "assistant",
      content: "",
      isGenerating: true,
      timestamp: Date.now(),
      messageType: "smart_recommendation", // 设置消息类型
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

    // 在API调用后再次检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 智能荐股 - 在API调用后被中断");
      return;
    }

    try {
      console.log("🔍 智能推荐API调用参数:", {
        pageNo: 1,
        pageSize: 3,
        conversationId: conversationId,
        userInfo: userStore.userInfo,
        hasPreferences: !!userStore.userInfo?.preferences,
      });

      let response = await recommendStock({
        pageNo: 1,
        pageSize: 3,
        conversationId: conversationId,
      });

      console.log("🔍 智能推荐API响应:", response);

      // 在获取数据后再次检查是否被中断
      if (isStillGenerating && !isStillGenerating()) {
        console.log("🚀 智能荐股 - 在数据处理前被中断");
        return;
      }

      // 检查响应是否有效
      if (!response) {
        throw new Error("服务器响应为空，请稍后重试");
      }

      // 检查是否有错误信息
      if (response.code && response.code !== "B0001") {
        throw new Error(response.message || "智能荐股服务暂时不可用");
      }

      // 处理不同的响应格式
      let stockList = [];
      let apiData = null;

      // 尝试多种响应格式
      if (
        response &&
        response.data &&
        response.data.success &&
        response.data.data
      ) {
        // 格式1: { data: { success: true, data: [...] } }
        apiData = response.data.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        // 格式2: { data: [...] }
        apiData = response.data;
      } else if (response && Array.isArray(response)) {
        // 格式3: [...]
        apiData = response;
      } else if (response && response.success && response.data) {
        // 格式4: { success: true, data: [...] }
        apiData = response.data;
      }

      if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
        throw new Error("暂无推荐股票数据，请稍后重试");
      }

      // 处理API数据
      apiData.forEach((item) => {
        stockList.push({
          name: item.name || item.stockName,
          code: item.code || item.stockCode,
          recommendIndex: item.recommendScore || item.score || 4.0,
          recommendLevel: item.recommendLevel || item.level || "推荐",
          price: item.latestPrice || item.price || item.currentPrice,
          change: item.change || 0,
          changePercent: item.rise
            ? item.rise + "%"
            : item.changePercent || "0%",
          targetPrice: item.targetPrice || item.target,
          expectedReturn:
            item.expectedReturn ||
            item.expectedBenefits ||
            item.expected_return,
          riskLevel: item.riskLevel || item.risk || "中等",
          industry: item.industry || item.sector || "未分类",
          reason: item.recommendReason || item.reason || "基于AI算法推荐",
        });
      });
      stockList.sort((a, b) => b.recommendIndex - a.recommendIndex);

      console.log("✅ 智能荐股API处理成功:", stockList);

      // 获取推荐内容文本
      const mockRes = await mockApi.sendMessage(message);

      // 更新最后一条AI消息为荐股结果
      const lastMessage = chatHistory.value[chatHistory.value.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        lastMessage.content = mockRes.data.content;
        lastMessage.isGenerating = false;
        lastMessage.hasStockInfo = true;
        lastMessage.isRecommendation = true;
        lastMessage.stockList = stockList;
        lastMessage.messageType = "smart_recommendation"; // 设置消息类型备份
        lastMessage.isPersistent = true;
        lastMessage.messageId = `recommendation-${Date.now()}`;
        lastMessage.timestamp = new Date().toISOString();
        chatHistory.value = [...chatHistory.value];
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
    } catch (err) {
      console.error("智能荐股API调用失败:", err);

      // 不使用mock数据，而是返回失败提示
      const lastMessage = chatHistory.value[chatHistory.value.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        // 根据错误类型提供不同的提示信息
        let errorMessage = "抱歉，智能荐股服务暂时不可用。";

        if (err.message && err.message.includes("500")) {
          errorMessage = "服务器繁忙，请稍后再试。";
        } else if (err.message && err.message.includes("网络")) {
          errorMessage = "网络连接异常，请检查网络后重试。";
        } else if (err.message && err.message.includes("timeout")) {
          errorMessage = "请求超时，请稍后再试。";
        }

        lastMessage.content = `❌ ${errorMessage}\n\n您可以稍后重试，或者：\n• 查看市场指数了解大盘走势\n• 浏览推荐股票获取投资灵感\n• 设置投资偏好获得更精准推荐`;
        lastMessage.isGenerating = false;
        lastMessage.hasStockInfo = false;
        lastMessage.isRecommendation = false;
        lastMessage.stockList = [];
        lastMessage.isPersistent = false;
        lastMessage.messageId = `error-${Date.now()}`;
        lastMessage.timestamp = new Date().toISOString();
        chatHistory.value = [...chatHistory.value];
      }

      await nextTick();
      scrollToBottom();

      // 根据错误类型提供不同的提示
      if (err.message && err.message.includes("500")) {
        ElMessage.error("服务器繁忙，请稍后再试");
      } else if (err.message && err.message.includes("网络")) {
        ElMessage.error("网络连接异常，请检查网络后重试");
      } else {
        ElMessage.error("智能荐股服务暂时不可用，请稍后再试");
      }

      // 使用快捷操作后自动收起
      if (showChatShortcuts.value) {
        setTimeout(() => {
          showChatShortcuts.value = false;
        }, 300);
      }
    }

    // 移除最终安全检查中的默认数据添加逻辑
    await nextTick();
    const finalMessage = chatHistory.value[chatHistory.value.length - 1];
    if (
      finalMessage &&
      finalMessage.role === "assistant" &&
      !finalMessage.stockList &&
      finalMessage.hasStockInfo !== false // 只有当hasStockInfo不是false时才需要检查
    ) {
      console.warn(
        "最终安全检查：消息缺少股票数据，但API调用成功，这可能是数据格式问题",
      );

      // 如果是API调用成功但数据格式有问题，提供友好提示
      finalMessage.content =
        "❌ 智能荐股数据格式异常，请稍后再试。\n\n您可以稍后重试，或者：\n• 查看市场指数了解大盘走势\n• 浏览推荐股票获取投资灵感\n• 设置投资偏好获得更精准推荐";
      finalMessage.hasStockInfo = false;
      finalMessage.isRecommendation = false;
      finalMessage.stockList = [];
      finalMessage.isPersistent = false;
      finalMessage.messageId = `format-error-${Date.now()}`;
      finalMessage.timestamp = new Date().toISOString();
      chatHistory.value = [...chatHistory.value];
    }
  };

  // 资讯推送功能
  const handleNewsUpdate = async (
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

    const userMessage = "资讯推送";

    // 添加用户消息和处理中的AI消息
    chatHistory.value.push(
      {
        id: generateMessageId(),
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      },
      {
        id: generateMessageId(),
        role: "assistant",
        content: "",
        isGenerating: true,
        timestamp: Date.now(),
        messageType: "news_update",
      },
    );

    // 检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 资讯推送 - 被中断");
      return;
    }

    const fullMessage =
      "请为我推送今日重要财经新闻和市场动态，包括政策动向、行业热点、个股新闻等";

    // 使用真实的聊天流式API获取资讯推送
    const res = await new Promise((resolve, reject) => {
      let responseContent = "";

      // 获取当前聊天会话ID
      const conversationId = chatHistoryStore.currentChatId || "default";

      // 调用流式API
      authFetchEventSource(
        `${api.devPrefix}${api.chatStreamApi}?conversationId=${conversationId}&userInput=${encodeURIComponent(fullMessage)}`,
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
          },
          onopen: async (response) => {
            console.log("🔄 资讯推送 - 流式连接已建立");
          },
          onmessage: (event) => {
            try {
              const data = event.data;
              if (data.trim().length === 0) return;
              responseContent += data;
            } catch (err) {
              console.error("🔄 资讯推送 - 解析消息时出错:", err);
            }
          },
          onclose: () => {
            console.log("🔄 资讯推送 - 流式连接已关闭");
            resolve({
              data: {
                content: responseContent,
                isNewsUpdate: true,
                hasInteractionButtons: false,
                interactionData: null,
                hasStockInfo: false,
              },
            });
          },
          onerror: (err) => {
            console.error("🔄 资讯推送 - 流式连接错误:", err);
            reject(err);
          },
        },
      );
    });

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
      lastMessage.isNewsUpdate = res.data.isNewsUpdate;
      lastMessage.messageType = "news_update"; // 设置消息类型备份
      lastMessage.hasInteractionButtons = res.data.hasInteractionButtons;
      lastMessage.interactionData = res.data.interactionData;

      // 确保所有必要的字段都被正确设置
      if (res.data.hasStockInfo !== undefined) {
        lastMessage.hasStockInfo = res.data.hasStockInfo;
      }

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
      {
        id: generateMessageId(),
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      },
      {
        id: generateMessageId(),
        role: "assistant",
        content: "",
        isGenerating: true,
        timestamp: Date.now(),
        messageType: "asset_analysis",
      },
    );

    // 检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 资产分析 - 被中断");
      return;
    }

    // 只使用用户的真实持仓数据，不使用mock数据
    const portfolioForAnalysis = [...userStore.portfolio];

    // 构建资产分析消息，包含用户的实际资产数据
    const totalAssets = userStore.getTotalAssets();
    const portfolioCount = portfolioForAnalysis.length;
    const watchlistCount = userStore.watchlist.length;

    // 计算持仓盈亏
    const portfolioData = portfolioForAnalysis.map((position) => {
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

    // 检查是否被中断
    if (isStillGenerating && !isStillGenerating()) {
      console.log("🚀 资产分析 - 生成过程中被中断");
      return;
    }

    // 更新最后一条AI消息
    const lastMessage = chatHistory.value[chatHistory.value.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      // 资产分析不需要文本内容，只显示数据卡片
      lastMessage.content = "";
      lastMessage.isGenerating = false; // 取消生成状态
      lastMessage.hasAssetInfo = true;
      lastMessage.isAssetAnalysis = true;
      lastMessage.messageType = "asset_analysis"; // 设置消息类型备份
      lastMessage.assetData = {
        totalAssets,
        balance: totalAssets - portfolioValue, // 可用资金 = 总资产 - 持仓市值
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
    const userPreferences = userStore.getUserPreferences();
    let requestMessage = "智能荐股：根据我的投资偏好推荐优质股票";

    if (userPreferences && userPreferences.riskLevel) {
      requestMessage += `\n\n我的投资偏好：
- 风险偏好：${getRiskLevelText(userPreferences.riskLevel)}
- 投资经验：${getExperienceText(userPreferences.experience)}
- 关注板块：${getFocusIndustryText(userPreferences.sectors?.categories)}`;
    }

    try {
      // 调用真实的荐股API而不是mock
      const response = await recommendStock({
        pageNo: 1,
        pageSize: 3,
        conversationId: message.conversationId || "refresh-" + Date.now(),
      });

      // 检查响应是否有效
      if (!response) {
        throw new Error("API响应为空");
      }

      // 检查是否有错误信息
      if (response.code && response.code !== "B0001") {
        throw new Error(response.message || "API调用失败");
      }

      // 处理不同的响应格式
      let stockList = [];
      let apiData = null;

      // 尝试多种响应格式
      if (
        response &&
        response.data &&
        response.data.success &&
        response.data.data
      ) {
        apiData = response.data.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        apiData = response.data;
      } else if (response && Array.isArray(response)) {
        apiData = response;
      } else if (response && response.success && response.data) {
        apiData = response.data;
      }

      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        // 处理API数据
        apiData.forEach((item) => {
          stockList.push({
            name: item.name || item.stockName,
            code: item.code || item.stockCode,
            recommendIndex: item.recommendScore || item.score || 4.0,
            recommendLevel: item.recommendLevel || item.level || "推荐",
            price: item.latestPrice || item.price || item.currentPrice,
            change: item.change || 0,
            changePercent: item.rise
              ? item.rise + "%"
              : item.changePercent || "0%",
            targetPrice: item.targetPrice || item.target,
            expectedReturn:
              item.expectedReturn ||
              item.expectedBenefits ||
              item.expected_return,
            riskLevel: item.riskLevel || item.risk || "中等",
            industry: item.industry || item.sector || "未分类",
            reason: item.recommendReason || item.reason || "基于AI算法推荐",
          });
        });
        stockList.sort((a, b) => b.recommendIndex - a.recommendIndex);

        // 更新现有的荐股消息
        const messageIndex = chatHistory.value.findIndex(
          (msg) => msg.messageId === message.messageId,
        );
        if (messageIndex !== -1) {
          // 获取mock内容作为文本描述
          const mockRes = await mockApi.sendMessage(requestMessage);

          chatHistory.value[messageIndex] = {
            ...chatHistory.value[messageIndex],
            content: mockRes.data.content,
            hasStockInfo: true,
            isRecommendation: true,
            stockList: stockList,
            isPersistent: true,
            messageId: message.messageId, // 保持原有ID
            timestamp: new Date().toISOString(), // 更新时间戳为刷新时间
          };
        }

        ElMessage.success("荐股列表已刷新");
      } else {
        throw new Error("API返回数据格式不正确或无数据");
      }
    } catch (error) {
      console.error("刷新荐股列表失败:", error);

      // 更新消息为错误状态
      const messageIndex = chatHistory.value.findIndex(
        (msg) => msg.messageId === message.messageId,
      );
      if (messageIndex !== -1) {
        let errorMessage = "抱歉，刷新荐股列表失败。";

        if (error.message && error.message.includes("500")) {
          errorMessage = "服务器繁忙，请稍后再试。";
        } else if (error.message && error.message.includes("网络")) {
          errorMessage = "网络连接异常，请检查网络后重试。";
        } else if (error.message && error.message.includes("timeout")) {
          errorMessage = "请求超时，请稍后再试。";
        }

        chatHistory.value[messageIndex] = {
          ...chatHistory.value[messageIndex],
          content: `❌ ${errorMessage}\n\n您可以稍后重试，或者：\n• 查看市场指数了解大盘走势\n• 浏览推荐股票获取投资灵感\n• 设置投资偏好获得更精准推荐`,
          hasStockInfo: false,
          isRecommendation: false,
          stockList: [],
          isPersistent: false,
          messageId: message.messageId, // 保持原有ID
          timestamp: new Date().toISOString(),
        };
      }

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
