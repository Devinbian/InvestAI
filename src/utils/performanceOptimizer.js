// 定时器管理器
class TimerManager {
  constructor() {
    this.timers = new Map();
  }

  // 创建定时器
  create(name, callback, delay, isInterval = false) {
    // 清理同名定时器
    this.clear(name);

    const timerId = isInterval
      ? setInterval(callback, delay)
      : setTimeout(() => {
          callback();
          this.timers.delete(name); // 自动清理 timeout
        }, delay);

    this.timers.set(name, {
      id: timerId,
      type: isInterval ? "interval" : "timeout",
      created: Date.now(),
    });

    return timerId;
  }

  // 清理定时器
  clear(name) {
    const timer = this.timers.get(name);
    if (timer) {
      if (timer.type === "interval") {
        clearInterval(timer.id);
      } else {
        clearTimeout(timer.id);
      }
      this.timers.delete(name);
    }
  }

  // 清理所有定时器
  clearAll() {
    this.timers.forEach((timer, name) => {
      this.clear(name);
    });
  }

  // 获取活跃定时器数量
  getActiveCount() {
    return this.timers.size;
  }
}

// 事件监听器管理器
class EventListenerManager {
  constructor() {
    this.listeners = new Map();
  }

  // 添加事件监听器
  add(element, event, handler, options = {}) {
    const key = this.getKey(element, event, handler);

    if (this.listeners.has(key)) {
      console.warn("重复添加事件监听器:", key);
      return;
    }

    // 添加 passive 选项以优化性能
    const finalOptions = {
      passive: true,
      ...options,
    };

    element.addEventListener(event, handler, finalOptions);
    this.listeners.set(key, { element, event, handler, options: finalOptions });
  }

  // 移除事件监听器
  remove(element, event, handler) {
    const key = this.getKey(element, event, handler);
    const listener = this.listeners.get(key);

    if (listener) {
      element.removeEventListener(event, handler, listener.options);
      this.listeners.delete(key);
    }
  }

  // 清理所有事件监听器
  cleanup() {
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners.clear();
  }

  // 获取监听器的唯一键
  getKey(element, event, handler) {
    return `${element.constructor.name}-${event}-${handler.toString().slice(0, 50)}`;
  }
}

// 聊天历史数据管理器
class ChatHistoryManager {
  constructor(maxMessages = 30, maxChats = 20) {
    this.maxMessages = maxMessages;
    this.maxChats = maxChats;
  }

  // 限制单个聊天的消息数量
  limitChatMessages(messages) {
    if (!messages || messages.length <= this.maxMessages) {
      return messages || [];
    }

    // 保留最近的消息，但确保对话的连贯性
    const recentMessages = messages.slice(-this.maxMessages);

    // 如果第一条消息是 AI 回复，添加一条系统消息说明
    if (recentMessages[0]?.role === "assistant") {
      recentMessages.unshift({
        role: "system",
        content: "（为了优化性能，已省略部分历史消息）",
        timestamp: Date.now(),
      });
    }

    return recentMessages;
  }

  // 限制聊天历史数量
  limitChatHistory(chatList) {
    if (!chatList || chatList.length <= this.maxChats) {
      return chatList || [];
    }

    // 按最后消息时间排序，保留最近的聊天
    const sortedChats = [...chatList].sort(
      (a, b) => b.lastMessage - a.lastMessage,
    );
    return sortedChats.slice(0, this.maxChats);
  }

  // 压缩聊天数据
  compressChatData(chatList) {
    if (!chatList) return [];

    return chatList.map((chat) => ({
      ...chat,
      messages: this.limitChatMessages(chat.messages),
    }));
  }
}

// 性能优化工具类
class PerformanceOptimizer {
  constructor() {
    this.isMonitoring = false;
    this.memoryCheckTimer = null;
    this.lastCleanupTime = 0;
    this.cleanupCooldown = 30000; // 30秒清理冷却时间
    this.memoryManager = new SmartMemoryManager();
    this.metrics = {
      memoryUsage: [],
      renderTime: [],
      eventCount: 0,
      timerCount: 0,
    };
  }

  // 启动性能监控
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log("🚀 性能监控已启动");

    // 监控内存使用
    this.monitorMemory();
  }

  // 监控内存使用
  monitorMemory() {
    if (!performance.memory) return;

    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memory = performance.memory;
      const memoryInfo = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        timestamp: Date.now(),
      };

      // 只保留最近10条记录，减少内存占用
      this.metrics.memoryUsage.push(memoryInfo);
      if (this.metrics.memoryUsage.length > 10) {
        this.metrics.memoryUsage.shift();
      }

      // 记录到智能内存管理器
      this.memoryManager.recordMemoryUsage(memoryInfo.used);

      // 使用智能清理策略
      if (this.memoryManager.shouldCleanup(memoryInfo.used)) {
        console.warn(`⚠️ 内存使用需要清理: ${memoryInfo.used}MB`);
        this.triggerSmartCleanup();
      }

      // 增加检查间隔到20秒，进一步减少频繁检查
      this.memoryCheckTimer = setTimeout(checkMemory, 20000);
    };

    checkMemory();
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      memoryUsage: this.getMemoryStats(),
      renderPerformance: null,
      eventListeners: this.metrics.eventCount,
      activeTimers: this.metrics.timerCount,
      suggestions: this.getOptimizationSuggestions(),
    };
  }

  // 获取内存统计
  getMemoryStats() {
    if (this.metrics.memoryUsage.length === 0) return null;

    const latest =
      this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const avg =
      this.metrics.memoryUsage.reduce((sum, item) => sum + item.used, 0) /
      this.metrics.memoryUsage.length;

    return {
      current: latest.used,
      average: Math.round(avg),
      peak: Math.max(...this.metrics.memoryUsage.map((item) => item.used)),
      trend: "stable",
    };
  }

  // 获取优化建议
  getOptimizationSuggestions() {
    const suggestions = [];

    // 内存优化建议
    const memoryStats = this.getMemoryStats();
    if (memoryStats && memoryStats.current > 120) {
      suggestions.push("内存使用过高，建议清理不必要的数据和对象引用");
    }

    return suggestions;
  }

  // 智能清理
  triggerSmartCleanup() {
    console.log("🧹 开始智能内存清理...");

    try {
      // 1. 深度清理Vue组件
      this.deepCleanVueComponents();

      // 2. 清理聊天历史数据
      this.cleanupChatHistory();

      // 3. 清理localStorage
      this.cleanupLocalStorage();

      // 4. 清理DOM元素
      this.cleanupDOMElements();

      // 5. 清理监控数据
      this.cleanupMetrics();

      // 6. 清理浏览器缓存
      this.cleanupBrowserCache();

      // 7. 强制垃圾回收
      if (window.gc) {
        window.gc();
        console.log("✅ 已触发垃圾回收");
      }

      // 标记已清理
      this.memoryManager.markCleaned();

      console.log("🎉 智能内存清理完成");
    } catch (error) {
      console.error("智能内存清理失败:", error);
    }
  }

  // 深度清理Vue组件
  deepCleanVueComponents() {
    try {
      // 清理Pinia store
      if (window.pinia) {
        const stores = window.pinia._s;
        stores.forEach((store) => {
          // 清理大型数组数据
          Object.keys(store).forEach((key) => {
            if (Array.isArray(store[key]) && store[key].length > 50) {
              store[key] = store[key].slice(-25);
              console.log(`✅ 已清理store.${key}，保留最近25条`);
            }
          });
        });
      }

      console.log("✅ 已清理Vue组件缓存");
    } catch (error) {
      console.warn("清理Vue组件时出错:", error);
    }
  }

  // 清理浏览器缓存
  cleanupBrowserCache() {
    try {
      // 清理图片缓存
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        if (img.src && img.src.startsWith("blob:")) {
          URL.revokeObjectURL(img.src);
        }
      });

      console.log("✅ 已清理浏览器缓存");
    } catch (error) {
      console.warn("清理浏览器缓存时出错:", error);
    }
  }

  // 触发内存清理 (保留原方法用于兼容)
  triggerMemoryCleanup() {
    this.triggerSmartCleanup();
  }

  // 清理聊天历史
  cleanupChatHistory() {
    try {
      // 全局聊天历史清理
      if (window.chatHistoryManager) {
        const chatHistory = window.chatHistory;
        if (chatHistory && chatHistory.value && chatHistory.value.length > 30) {
          chatHistory.value = window.chatHistoryManager.limitChatMessages(
            chatHistory.value.slice(-15),
          );
          console.log("✅ 已清理聊天历史，保留最近15条消息");
        }
      }

      // 清理Pinia store中的数据
      if (window.pinia) {
        const stores = window.pinia._s;
        stores.forEach((store) => {
          if (store.chatHistory && Array.isArray(store.chatHistory)) {
            if (store.chatHistory.length > 30) {
              store.chatHistory = store.chatHistory.slice(-15);
              console.log("✅ 已清理store聊天历史");
            }
          }
        });
      }
    } catch (error) {
      console.warn("清理聊天历史时出错:", error);
    }
  }

  // 清理localStorage
  cleanupLocalStorage() {
    try {
      const keysToClean = ["chatHistoryList", "chatHistory", "userMessages"];

      keysToClean.forEach((key) => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 20) {
              const cleaned = parsed.slice(-10);
              localStorage.setItem(key, JSON.stringify(cleaned));
              console.log(`✅ 已清理localStorage ${key}，保留最近10条`);
            }
          } catch (parseError) {
            console.warn(`解析localStorage ${key}时出错:`, parseError);
          }
        }
      });
    } catch (error) {
      console.warn("清理localStorage时出错:", error);
    }
  }

  // 清理监控数据
  cleanupMetrics() {
    try {
      // 清理内存使用记录
      if (this.metrics.memoryUsage.length > 5) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-5);
      }

      // 清理渲染时间记录
      if (this.metrics.renderTime.length > 5) {
        this.metrics.renderTime = this.metrics.renderTime.slice(-5);
      }

      console.log("✅ 已清理监控数据");
    } catch (error) {
      console.warn("清理监控数据时出错:", error);
    }
  }

  // 清理DOM元素
  cleanupDOMElements() {
    try {
      // 清理可能的内存泄漏元素
      const elementsToClean = [
        ".chat-message",
        ".notification-item",
        ".market-data-item",
        ".message-item",
        ".history-item",
      ];

      elementsToClean.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 50) {
          // 只保留最近的25个元素
          Array.from(elements)
            .slice(0, elements.length - 25)
            .forEach((el) => {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
            });
          console.log(`✅ 已清理 ${selector} 元素，保留最近25个`);
        }
      });
    } catch (error) {
      console.warn("清理DOM元素时出错:", error);
    }
  }

  // 停止监控
  stopMonitoring() {
    this.isMonitoring = false;

    // 清理定时器
    if (this.memoryCheckTimer) {
      clearTimeout(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
    }

    console.log("⏹️ 性能监控已停止");
  }
}

// 智能内存管理器
class SmartMemoryManager {
  constructor() {
    this.memoryHistory = [];
    this.leakDetectionThreshold = 5; // 连续5次内存增长视为可能泄漏
    this.baselineMemory = 0;
    this.isLeakDetected = false;
    this.lastCleanupTime = 0;
    this.cleanupInterval = 60000; // 1分钟清理间隔
  }

  // 记录内存使用情况
  recordMemoryUsage(memoryMB) {
    const now = Date.now();

    // 设置基线内存
    if (this.baselineMemory === 0) {
      this.baselineMemory = memoryMB;
    }

    this.memoryHistory.push({
      usage: memoryMB,
      timestamp: now,
      baseline: this.baselineMemory,
    });

    // 只保留最近20条记录
    if (this.memoryHistory.length > 20) {
      this.memoryHistory.shift();
    }

    // 检测内存泄漏
    this.detectMemoryLeak();
  }

  // 检测内存泄漏
  detectMemoryLeak() {
    if (this.memoryHistory.length < this.leakDetectionThreshold) {
      return false;
    }

    const recent = this.memoryHistory.slice(-this.leakDetectionThreshold);
    let increasingCount = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].usage > recent[i - 1].usage) {
        increasingCount++;
      }
    }

    // 如果连续增长且超过基线30%，判定为可能泄漏
    const latestUsage = recent[recent.length - 1].usage;
    const isLeaking =
      increasingCount >= this.leakDetectionThreshold - 1 &&
      latestUsage > this.baselineMemory * 1.3;

    if (isLeaking && !this.isLeakDetected) {
      this.isLeakDetected = true;
      console.warn("🔍 检测到可能的内存泄漏，当前使用:", latestUsage + "MB");
      return true;
    }

    return false;
  }

  // 是否需要清理
  shouldCleanup(currentMemory) {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.lastCleanupTime;

    // 内存过高或检测到泄漏或距离上次清理时间过长
    return (
      currentMemory > 150 ||
      this.isLeakDetected ||
      timeSinceLastCleanup > this.cleanupInterval
    );
  }

  // 标记已清理
  markCleaned() {
    this.lastCleanupTime = Date.now();
    this.isLeakDetected = false;
  }
}

// 创建全局实例
const performanceOptimizer = new PerformanceOptimizer();
const chatHistoryManager = new ChatHistoryManager();
const eventListenerManager = new EventListenerManager();
const timerManager = new TimerManager();
const smartMemoryManager = new SmartMemoryManager();

// 导出
export {
  PerformanceOptimizer,
  ChatHistoryManager,
  EventListenerManager,
  TimerManager,
  SmartMemoryManager,
  performanceOptimizer,
  chatHistoryManager,
  eventListenerManager,
  timerManager,
  smartMemoryManager,
};
