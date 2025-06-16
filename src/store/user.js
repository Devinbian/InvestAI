import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    userInfo: JSON.parse(localStorage.getItem("userInfo") || "{}"),
    isLoggedIn: !!localStorage.getItem("token"),
    watchlist: JSON.parse(localStorage.getItem("watchlist") || "[]"), // 自选股列表
    portfolio: JSON.parse(localStorage.getItem("portfolio") || "[]"), // 持仓列表
    balance: parseFloat(localStorage.getItem("balance") || "100000"), // 账户余额，默认10万
  }),

  actions: {
    setToken(token) {
      this.token = token;
      this.isLoggedIn = true;
      localStorage.setItem("token", token);
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    },

    logout() {
      this.token = "";
      this.userInfo = {};
      this.isLoggedIn = false;
      this.watchlist = [];
      this.portfolio = [];
      this.balance = 100000;
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("watchlist");
      localStorage.removeItem("portfolio");
      localStorage.removeItem("balance");
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
  },
});
