import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    userInfo: JSON.parse(localStorage.getItem("userInfo") || "{}"),
    isLoggedIn: !!localStorage.getItem("token"), // 根据token判断登录状态
    watchlist: JSON.parse(localStorage.getItem("watchlist") || "[]"), // 自选股列表
    portfolio: JSON.parse(localStorage.getItem("portfolio") || "[]"), // 持仓列表
    balance: parseFloat(localStorage.getItem("balance") || "0"), // 股票交易账户余额
    smartPointsBalance: parseFloat(
      localStorage.getItem("smartPointsBalance") || "0",
    ), // 智点账户余额

    // 记录中心数据
    quantAnalysisReports: JSON.parse(
      localStorage.getItem("quantAnalysisReports") || "[]",
    ), // 量化分析报告记录
    smartPointsTransactions: JSON.parse(
      localStorage.getItem("smartPointsTransactions") || "[]",
    ), // 智点交易记录
    aiTradingRecords: JSON.parse(
      localStorage.getItem("aiTradingRecords") || "[]",
    ), // AI委托交易记录
    userTradingRecords: JSON.parse(
      localStorage.getItem("userTradingRecords") || "[]",
    ), // 用户自助交易记录

    // 委托单管理
    pendingOrders: JSON.parse(localStorage.getItem("pendingOrders") || "[]"), // 待成交委托单

    // 引导流程状态管理
    onboardingStatus: JSON.parse(
      localStorage.getItem("onboardingStatus") ||
        '{"completed": false, "currentStep": 0, "preferences": null}',
    ), // 引导流程状态
  }),

  actions: {
    setToken(token) {
      this.token = token;
      this.isLoggedIn = true;
      localStorage.setItem("token", token);
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo;
      try {
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
      } catch (error) {
        console.error("Failed to save user info to localStorage:", error);
        // This can happen if localStorage is full.
        // The app state will be updated, but it won't persist across reloads.
      }
    },

    setUserPortrait(preferences) {
      let userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (userInfo) {
        userInfo.preferences = preferences;
        this.userInfo = userInfo;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
      }
    },

    logout(clearOnboarding = true) {
      this.token = "";
      this.userInfo = {};
      this.isLoggedIn = false;
      this.watchlist = [];
      this.portfolio = [];
      this.balance = 0;
      this.smartPointsBalance = 0;
      this.quantAnalysisReports = [];
      this.smartPointsTransactions = [];
      this.aiTradingRecords = [];
      this.userTradingRecords = [];
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("watchlist");
      localStorage.removeItem("portfolio");
      localStorage.removeItem("balance");
      localStorage.removeItem("smartPointsBalance");
      localStorage.removeItem("quantAnalysisReports");
      localStorage.removeItem("smartPointsTransactions");
      localStorage.removeItem("aiTradingRecords");
      localStorage.removeItem("userTradingRecords");
      localStorage.removeItem("pendingOrders");

      // 引导状态处理逻辑：
      // 1. 如果用户已完成引导，退出时可以选择性清除引导状态
      // 2. 如果用户未完成引导，保留引导进度，下次登录时继续
      if (clearOnboarding && this.onboardingStatus.completed) {
        // 用户已完成引导，可以清除引导状态（避免重复引导）
        localStorage.removeItem("onboardingStatus");
        localStorage.removeItem("onboardingCompleted");
        this.onboardingStatus = {
          completed: false,
          currentStep: 0,
          preferences: null,
        };
      }
      // 如果用户未完成引导，保留引导状态和进度，下次登录时继续
    },

    // 自选股管理
    addToWatchlist(stock) {
      const exists = this.watchlist.find((item) => item.code === stock.code);
      if (!exists) {
        this.watchlist.push({
          ...stock,
          addedAt: new Date().toISOString(),
        });
        localStorage.setItem("watchlist", JSON.stringify(this.watchlist));
        return true;
      }
      return false;
    },

    removeFromWatchlist(stockCode) {
      const index = this.watchlist.findIndex((item) => item.code === stockCode);
      if (index > -1) {
        this.watchlist.splice(index, 1);
        localStorage.setItem("watchlist", JSON.stringify(this.watchlist));
        return true;
      }
      return false;
    },

    isInWatchlist(stockCode) {
      return this.watchlist.some((item) => item.code === stockCode);
    },

    // 股票交易相关
    buyStock(stock, quantity, price) {
      const totalCost = quantity * price;

      if (this.balance < totalCost) {
        return { success: false, message: "余额不足" };
      }

      // 检查是否已有该股票持仓
      const existingPosition = this.portfolio.find(
        (item) => item.code === stock.code,
      );

      if (existingPosition) {
        // 更新现有持仓
        const totalShares = existingPosition.quantity + quantity;
        const totalValue =
          existingPosition.quantity * existingPosition.avgPrice + totalCost;
        existingPosition.quantity = totalShares;
        existingPosition.avgPrice = totalValue / totalShares;
        existingPosition.lastBuyTime = new Date().toISOString();
      } else {
        // 新增持仓
        this.portfolio.push({
          ...stock,
          quantity: quantity,
          avgPrice: price,
          buyTime: new Date().toISOString(),
          lastBuyTime: new Date().toISOString(),
        });
      }

      // 扣除余额
      this.balance -= totalCost;

      // 记录交易记录
      this.addUserTradingRecord({
        type: "buy",
        stockCode: stock.code,
        stockName: stock.name,
        quantity: quantity,
        price: price,
        totalAmount: totalCost,
        fee: totalCost * 0.0003, // 假设手续费为0.03%
        status: "completed",
        executedAt: new Date().toISOString(),
      });

      // 保存到本地存储
      localStorage.setItem("portfolio", JSON.stringify(this.portfolio));
      localStorage.setItem("balance", this.balance.toString());

      return {
        success: true,
        message: `成功购买${stock.name} ${quantity}股，花费¥${totalCost.toFixed(2)}`,
      };
    },

    sellStock(stockCode, quantity, price) {
      const position = this.portfolio.find((item) => item.code === stockCode);

      if (!position) {
        return { success: false, message: "未持有该股票" };
      }

      if (position.quantity < quantity) {
        return { success: false, message: "持仓数量不足" };
      }

      const totalRevenue = quantity * price;

      // 更新持仓
      position.quantity -= quantity;

      // 如果全部卖出，移除持仓
      if (position.quantity === 0) {
        const index = this.portfolio.findIndex(
          (item) => item.code === stockCode,
        );
        this.portfolio.splice(index, 1);
      }

      // 增加余额
      this.balance += totalRevenue;

      // 记录交易记录
      this.addUserTradingRecord({
        type: "sell",
        stockCode: stockCode,
        stockName: position.name,
        quantity: quantity,
        price: price,
        totalAmount: totalRevenue,
        fee: totalRevenue * 0.0003, // 假设手续费为0.03%
        status: "completed",
        executedAt: new Date().toISOString(),
      });

      // 保存到本地存储
      localStorage.setItem("portfolio", JSON.stringify(this.portfolio));
      localStorage.setItem("balance", this.balance.toString());

      return {
        success: true,
        message: `成功卖出${position.name} ${quantity}股，获得¥${totalRevenue.toFixed(2)}`,
      };
    },

    getPosition(stockCode) {
      return this.portfolio.find((item) => item.code === stockCode);
    },

    getTotalAssets() {
      // 计算总资产 = 现金余额 + 持仓市值
      const portfolioValue = this.portfolio.reduce((total, position) => {
        // 这里应该用实时价格，暂时用平均成本价
        return (
          total +
          position.quantity * parseFloat(position.price || position.avgPrice)
        );
      }, 0);

      return this.balance + portfolioValue;
    },

    // 扣费方法（用于付费服务）
    deductBalance(amount) {
      if (this.balance >= amount) {
        this.balance -= amount;
        localStorage.setItem("balance", this.balance.toString());
        return true;
      }
      return false;
    },

    // 充值方法
    addBalance(amount) {
      this.balance += parseFloat(amount);
      localStorage.setItem("balance", this.balance.toString());
    },

    // 设置余额
    setBalance(amount) {
      this.balance = parseFloat(amount);
      localStorage.setItem("balance", this.balance.toString());
    },

    //设置点数
    setSmartPointsBalance(amount) {
      this.smartPointsBalance = amount;
      localStorage.setItem("smartPointsBalance", this.smartPointsBalance.toString());
    },

    // 智点账户管理
    deductSmartPoints(amount) {
      if (this.smartPointsBalance >= amount) {
        this.smartPointsBalance -= amount;
        localStorage.setItem(
          "smartPointsBalance",
          this.smartPointsBalance.toString(),
        );
        return true;
      }
      return false;
    },

    addSmartPoints(amount) {
      this.smartPointsBalance += amount;
      localStorage.setItem(
        "smartPointsBalance",
        this.smartPointsBalance.toString(),
      );
    },

    // 充值智点（使用现金购买智点，1元=1智点）
    purchaseSmartPoints(cashAmount) {
      const smartPointsAmount = cashAmount * 1;
      if (this.balance >= cashAmount) {
        this.balance -= cashAmount;
        this.smartPointsBalance += smartPointsAmount;
        localStorage.setItem("balance", this.balance.toString());
        localStorage.setItem(
          "smartPointsBalance",
          this.smartPointsBalance.toString(),
        );

        // 记录充值交易
        this.addSmartPointsTransaction({
          type: "recharge",
          amount: smartPointsAmount,
          description: `现金充值智点`,
          paymentMethod: "cash",
          orderId: `RECHARGE_${Date.now()}`,
          balanceAfter: this.smartPointsBalance,
        });

        return {
          success: true,
          message: `成功购买${smartPointsAmount}智点，花费¥${cashAmount}`,
          smartPointsAmount,
        };
      }
      return {
        success: false,
        message: "股票交易账户余额不足",
      };
    },

    // 量化分析报告管理
    addQuantAnalysisReport(report) {
      const reportData = {
        id: `REPORT_${Date.now()}`,
        ...report,
        createdAt: new Date().toISOString(),
        fileSize: `${Math.floor(Math.random() * 500 + 100)}KB`,
      };

      this.quantAnalysisReports.unshift(reportData);
      localStorage.setItem(
        "quantAnalysisReports",
        JSON.stringify(this.quantAnalysisReports),
      );

      // 记录智点消费
      if (report.cost > 0) {
        this.addSmartPointsTransaction({
          type: "consumption",
          amount: report.cost,
          description: `量化分析报告 - ${report.stockName}`,
          serviceType: "quant-analysis",
          stockInfo: {
            name: report.stockName,
            code: report.stockCode,
          },
          balanceAfter: this.smartPointsBalance,
        });
      }

      return reportData;
    },

    deleteQuantAnalysisReport(reportId) {
      const index = this.quantAnalysisReports.findIndex(
        (report) => report.id === reportId,
      );
      if (index > -1) {
        this.quantAnalysisReports.splice(index, 1);
        localStorage.setItem(
          "quantAnalysisReports",
          JSON.stringify(this.quantAnalysisReports),
        );
        return true;
      }
      return false;
    },

    cleanExpiredReports() {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const originalLength = this.quantAnalysisReports.length;
      this.quantAnalysisReports = this.quantAnalysisReports.filter((report) => {
        return new Date(report.createdAt) > threeMonthsAgo;
      });

      const expiredCount = originalLength - this.quantAnalysisReports.length;
      if (expiredCount > 0) {
        localStorage.setItem(
          "quantAnalysisReports",
          JSON.stringify(this.quantAnalysisReports),
        );
      }

      return expiredCount;
    },

    // 智点交易记录管理
    addSmartPointsTransaction(transaction) {
      const transactionData = {
        id: `TRANS_${Date.now()}`,
        ...transaction,
        createdAt: new Date().toISOString(),
      };

      this.smartPointsTransactions.unshift(transactionData);
      localStorage.setItem(
        "smartPointsTransactions",
        JSON.stringify(this.smartPointsTransactions),
      );

      return transactionData;
    },

    // AI委托交易记录管理
    addAITradingRecord(trade) {
      const tradeData = {
        id: `TRADE_${Date.now()}`,
        ...trade,
        createdAt: new Date().toISOString(),
        status: trade.status || "pending",
      };

      this.aiTradingRecords.unshift(tradeData);
      localStorage.setItem(
        "aiTradingRecords",
        JSON.stringify(this.aiTradingRecords),
      );

      return tradeData;
    },

    updateAITradingRecord(tradeId, updates) {
      const index = this.aiTradingRecords.findIndex(
        (trade) => trade.id === tradeId,
      );
      if (index > -1) {
        this.aiTradingRecords[index] = {
          ...this.aiTradingRecords[index],
          ...updates,
        };
        localStorage.setItem(
          "aiTradingRecords",
          JSON.stringify(this.aiTradingRecords),
        );
        return true;
      }
      return false;
    },

    cancelAITradingOrder(tradeId) {
      return this.updateAITradingRecord(tradeId, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      });
    },

    // 用户自助交易记录管理
    addUserTradingRecord(record) {
      const recordData = {
        id: `USER_TRADE_${Date.now()}`,
        ...record,
        createdAt: new Date().toISOString(),
      };

      this.userTradingRecords.unshift(recordData);
      localStorage.setItem(
        "userTradingRecords",
        JSON.stringify(this.userTradingRecords),
      );

      return recordData;
    },

    getUserTradingRecords() {
      return this.userTradingRecords;
    },

    deleteUserTradingRecord(recordId) {
      const index = this.userTradingRecords.findIndex(
        (record) => record.id === recordId,
      );
      if (index > -1) {
        this.userTradingRecords.splice(index, 1);
        localStorage.setItem(
          "userTradingRecords",
          JSON.stringify(this.userTradingRecords),
        );
        return true;
      }
      return false;
    },

    // 模拟生成一些测试数据
    generateMockRecords() {
      // 生成量化分析报告测试数据
      const mockReports = [
        {
          title: "比亚迪(002594)深度量化分析报告",
          stockName: "比亚迪",
          stockCode: "002594",
          type: "quant-analysis",
          cost: 1.0,
          summary:
            "基于技术分析和基本面分析，该股票呈现上升趋势，建议适量买入。",
          content: "详细的量化分析内容...",
          createdAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          title: "贵州茅台(600519)AI交易策略报告",
          stockName: "贵州茅台",
          stockCode: "600519",
          type: "ai-trading",
          cost: 2.0,
          summary: "AI模型预测短期内可能出现调整，建议谨慎操作。",
          content: "AI交易策略详细分析...",
          createdAt: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];

      mockReports.forEach((report) => this.addQuantAnalysisReport(report));

      // 生成智点交易记录测试数据
      const mockTransactions = [
        {
          type: "recharge",
          amount: 10.0,
          description: "支付宝充值智点",
          paymentMethod: "alipay",
          orderId: "ALIPAY_20241201001",
          balanceAfter: 10.0,
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];

      mockTransactions.forEach((trans) =>
        this.addSmartPointsTransaction(trans),
      );

      // 生成AI委托交易记录测试数据
      const mockTrades = [
        {
          stockInfo: { name: "平安银行", code: "000001" },
          type: "buy",
          status: "completed",
          quantity: 1000,
          expectedPrice: 12.2,
          executedPrice: 12.25,
          totalAmount: 12250,
          fee: 5.0,
          profit: 2.5,
          analysis: "基于AI算法分析，该股票具有较好的投资价值，建议买入。",
          executedAt: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          createdAt: new Date(
            Date.now() - 4 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];

      mockTrades.forEach((trade) => this.addAITradingRecord(trade));

      // 生成用户自助交易记录测试数据
      const mockUserTrades = [
        {
          type: "buy",
          stockCode: "000001",
          stockName: "平安银行",
          quantity: 1000,
          price: 12.18,
          totalAmount: 12180,
          fee: 3.65,
          status: "completed",
          executedAt: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          type: "sell",
          stockCode: "600519",
          stockName: "贵州茅台",
          quantity: 100,
          price: 1685.0,
          totalAmount: 168500,
          fee: 50.55,
          status: "completed",
          executedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          type: "buy",
          stockCode: "000002",
          stockName: "万科A",
          quantity: 2000,
          price: 8.45,
          totalAmount: 16900,
          fee: 5.07,
          status: "completed",
          executedAt: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          type: "sell",
          stockCode: "000858",
          stockName: "五粮液",
          quantity: 300,
          price: 128.5,
          totalAmount: 38550,
          fee: 11.57,
          status: "completed",
          executedAt: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          type: "buy",
          stockCode: "300750",
          stockName: "宁德时代",
          quantity: 200,
          price: 185.6,
          totalAmount: 37120,
          fee: 11.14,
          status: "completed",
          executedAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];

      mockUserTrades.forEach((trade) => this.addUserTradingRecord(trade));

      // 生成委托单测试数据
      if (this.pendingOrders.length === 0) {
        const mockOrders = [
          {
            stockCode: "000001",
            stockName: "平安银行",
            type: "buy",
            orderType: "limit",
            price: 12.2,
            quantity: 1000,
          },
          {
            stockCode: "600519",
            stockName: "贵州茅台",
            type: "sell",
            orderType: "limit",
            price: 1680.0,
            quantity: 100,
          },
          {
            stockCode: "000001",
            stockName: "平安银行",
            type: "buy",
            orderType: "limit",
            price: 12.15,
            quantity: 500,
          },
        ];

        mockOrders.forEach((order) => this.addPendingOrder(order));
      }
    },

    // 委托单管理
    addPendingOrder(order) {
      const newOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...order,
        status: "pending", // pending, partial, filled, cancelled
        createdAt: new Date().toISOString(),
        filledQuantity: 0,
      };

      this.pendingOrders.push(newOrder);
      localStorage.setItem("pendingOrders", JSON.stringify(this.pendingOrders));
      return newOrder;
    },

    cancelPendingOrder(orderId) {
      const order = this.pendingOrders.find((o) => o.id === orderId);
      if (order && order.status === "pending") {
        order.status = "cancelled";
        order.cancelledAt = new Date().toISOString();
        localStorage.setItem(
          "pendingOrders",
          JSON.stringify(this.pendingOrders),
        );
        return true;
      }
      return false;
    },

    getPendingOrdersByStock(stockCode) {
      return this.pendingOrders.filter(
        (order) => order.stockCode === stockCode && order.status === "pending",
      );
    },

    getAllPendingOrders() {
      return this.pendingOrders.filter((order) => order.status === "pending");
    },

    // 模拟委托单部分成交
    simulateOrderExecution(orderId, filledQuantity) {
      const order = this.pendingOrders.find((o) => o.id === orderId);
      if (order && order.status === "pending") {
        order.filledQuantity += filledQuantity;

        if (order.filledQuantity >= order.quantity) {
          order.status = "filled";
          order.filledAt = new Date().toISOString();
        } else {
          order.status = "partial";
        }

        localStorage.setItem(
          "pendingOrders",
          JSON.stringify(this.pendingOrders),
        );
        return true;
      }
      return false;
    },

    // 引导流程状态管理
    updateOnboardingProgress(stepIndex, preferences = null) {
      this.onboardingStatus = {
        ...this.onboardingStatus,
        currentStep: stepIndex,
        preferences: preferences || this.onboardingStatus.preferences,
      };
      localStorage.setItem(
        "onboardingStatus",
        JSON.stringify(this.onboardingStatus),
      );
    },

    completeOnboarding(preferences) {
      this.onboardingStatus = {
        completed: true,
        currentStep: -1, // -1 表示已完成
        preferences: preferences,
      };
      localStorage.setItem(
        "onboardingStatus",
        JSON.stringify(this.onboardingStatus),
      );
      // 同时保存到用户信息中
      this.setUserInfo({
        ...this.userInfo,
        preferences: preferences,
      });
      // 保留旧的标记以兼容现有代码
      localStorage.setItem("onboardingCompleted", "true");
    },

    isOnboardingCompleted() {
      return this.onboardingStatus.completed;
    },

    getOnboardingProgress() {
      return this.onboardingStatus;
    },

    shouldShowOnboarding() {
      // 必须是登录用户
      if (!this.isLoggedIn) {
        return false;
      }

      // 如果引导状态明确显示已完成，不显示引导
      if (this.onboardingStatus.completed) {
        return false;
      }

      // 如果用户信息中有完整的偏好设置，说明已完成引导
      if (this.hasUserPreferences()) {
        return false;
      }

      // 其他情况显示引导流程
      return true;
    },

    // 检查用户是否有偏好设置
    hasUserPreferences() {
      // 优先检查userInfo中的preferences（完整的偏好设置）
      if (
        this.userInfo?.preferences?.riskLevel &&
        this.userInfo?.preferences?.experience
      ) {
        return true;
      }

      // 检查旧版本的标记
      if (localStorage.getItem("onboardingCompleted") === "true") {
        return true;
      }

      return false;
    },

    // 获取用户偏好设置（优先级：userInfo > onboardingStatus > null）
    getUserPreferences() {
      // 优先从userInfo.preferences获取（引导完成后的数据）
      if (this.userInfo?.preferences?.riskLevel) {
        return this.userInfo.preferences;
      }

      // 其次从onboardingStatus.preferences获取（引导过程中的数据）
      if (this.onboardingStatus?.preferences?.riskLevel) {
        return this.onboardingStatus.preferences;
      }

      // 检查localStorage中的数据
      const localUserInfo = localStorage.getItem("userInfo");
      const localOnboardingStatus = localStorage.getItem("onboardingStatus");

      if (localUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(localUserInfo);
          if (parsedUserInfo?.preferences?.riskLevel) {
            return parsedUserInfo.preferences;
          }
        } catch (error) {
          console.error("解析localStorage userInfo失败:", error);
        }
      }

      if (localOnboardingStatus) {
        try {
          const parsedOnboardingStatus = JSON.parse(localOnboardingStatus);
          if (parsedOnboardingStatus?.preferences?.riskLevel) {
            return parsedOnboardingStatus.preferences;
          }
        } catch (error) {
          console.error("解析localStorage onboardingStatus失败:", error);
        }
      }

      return null;
    },
  },
});
