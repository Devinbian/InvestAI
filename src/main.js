import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import App from "./App.vue";
import router from "./router";
// 导入 MessageBox z-index 修复样式
import "./assets/global-messagebox.css";
// 导入性能优化工具
import { performanceOptimizer } from "./utils/performanceOptimizer";

// 微信环境检测和处理
function detectEnvironment() {
  const ua = navigator.userAgent.toLowerCase();
  const body = document.body;

  // 微信浏览器检测
  if (ua.includes("micromessenger")) {
    body.classList.add("wechat-browser");
    console.log("WeChat browser detected");

    // 强制隐藏微信底部工具栏
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover",
      );
    }

    // 添加微信环境特殊样式
    const style = document.createElement("style");
    style.textContent = `
      /* 微信环境强制全屏显示 */
      html, body {
        height: 100vh !important;
        max-height: 100vh !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        max-width: 100vw !important;
        position: relative !important;
        -webkit-overflow-scrolling: auto !important;
        overscroll-behavior: none !important;
      }
      
      /* 微信环境简化样式 - 移除所有键盘相关的动态调整 */
      body.wechat-browser {
        height: 100vh !important;
        max-height: 100vh !important;
        overflow: auto !important;
        position: relative !important;
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        /* 禁用滚动弹性效果，防止触发浏览器UI */
        overscroll-behavior-y: none !important;
        overscroll-behavior-x: none !important;
      }
      
      /* 微信环境下强制所有容器占满全宽 */
      body.wechat-browser * {
        box-sizing: border-box !important;
      }
      
      body.wechat-browser #app {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        max-height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        position: relative !important;
      }
    `;
    document.head.appendChild(style);

    // 完全禁用键盘检测和适配逻辑
    console.log("微信环境检测到，但键盘检测已完全禁用");

    // 设置固定的视口高度变量，不再动态调整
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    document.documentElement.style.setProperty("--keyboard-vh", `${vh}px`);

    // 不再监听任何键盘相关事件
    console.log("已设置固定视口高度变量，不再进行键盘检测");

    // 不再监听视口变化，保持固定布局
    console.log("微信环境键盘检测已完全禁用，使用固定布局");

    // 智能防止页面滚动触发浏览器UI
    document.addEventListener(
      "touchmove",
      function (e) {
        // 使用智能检测：只阻止真正需要阻止的滚动
        if (e.touches.length === 1) {
          const target = e.target;

          // 1. 检查元素是否在明确的可滚动容器内
          const scrollableContainer = target.closest(`
            .chat-history-area,
            .chat-messages,
            .messages-container,
            .notifications-list,
            .history-list-container,
            .settings-content,
            .detail-content,
            .sidebar-content,
            .category-scroll,
            .onboarding-flow,
            .form-container,
            .step-content,
            .step-content-scrollable,
            .preferences-form-container,
            [data-scrollable],
            .el-scrollbar,
            .el-dialog,
            .el-drawer,
            .el-select-dropdown,
            .el-table__body-wrapper,
            .dropdown-menu,
            .modal-content,
            .popup-content,
            [style*="overflow-y: auto"],
            [style*="overflow-y: scroll"], 
            [style*="overflow: auto"],
            [style*="overflow: scroll"]
          `);

          // 2. 检查元素本身是否可滚动
          const computedStyle = window.getComputedStyle(target);
          const isScrollable =
            ["auto", "scroll"].includes(computedStyle.overflowY) ||
            ["auto", "scroll"].includes(computedStyle.overflow);

          // 3. 检查是否是表单元素（应该允许滚动）
          const isFormElement =
            target.matches("input, textarea, select") ||
            target.contentEditable === "true" ||
            target.closest(".el-input, .el-textarea, .ai-input, .ai-input-row");

          // 4. 检查是否在弹窗或浮层中
          const inModal = target.closest(
            ".el-dialog, .el-drawer, .el-popover, .el-tooltip, .modal, .popup, .overlay, .settings-overlay, .detail-overlay",
          );

          // 5. 检查是否是聊天相关区域
          const inChatArea = target.closest(
            ".chat-history-area, .chat-message, .message-text, .markdown-content",
          );

          // 如果满足以下任一条件，允许滚动：
          // - 在可滚动容器内
          // - 元素本身可滚动
          // - 是表单元素
          // - 在弹窗/浮层中
          // - 在聊天区域内
          if (
            scrollableContainer ||
            isScrollable ||
            isFormElement ||
            inModal ||
            inChatArea
          ) {
            return; // 允许滚动
          }

          // 6. 检查是否是主页面背景区域的无意义滚动
          const isMainPageBackground =
            target === document.body ||
            target === document.documentElement ||
            target.classList.contains("main-modern");

          if (isMainPageBackground) {
            e.preventDefault(); // 阻止主页面背景滚动
          }
        }
      },
      { passive: false },
    );

    // 防止双指缩放
    document.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    // 防止长按菜单 - 但保留输入框和聊天消息的原生操作功能
    document.addEventListener("contextmenu", function (e) {
      // 检查是否是输入相关元素或聊天消息内容
      const isInputElement =
        e.target.matches('input, textarea, [contenteditable="true"]') ||
        e.target.closest(".el-input, .el-textarea");

      const isChatMessage = e.target.closest(
        ".chat-message-content, .message-text, .markdown-content",
      );

      // 如果不是输入元素或聊天消息，则阻止右键菜单
      if (!isInputElement && !isChatMessage) {
        e.preventDefault();
      }
    });

    // 确保聊天消息文本可以被选择
    const ensureChatTextSelectable = () => {
      const chatMessages = document.querySelectorAll(
        ".chat-message-content, .message-text, .markdown-content",
      );
      chatMessages.forEach((element) => {
        element.style.userSelect = "text";
        element.style.webkitUserSelect = "text";
        element.style.mozUserSelect = "text";
        element.style.msUserSelect = "text";
        element.style.webkitTouchCallout = "default";

        // 对所有子元素也设置文本选择
        const children = element.querySelectorAll("*");
        children.forEach((child) => {
          child.style.userSelect = "text";
          child.style.webkitUserSelect = "text";
          child.style.mozUserSelect = "text";
          child.style.msUserSelect = "text";
          child.style.webkitTouchCallout = "default";
        });
      });
    };

    // 页面加载完成后确保文本可选择
    setTimeout(ensureChatTextSelectable, 1000);

    // 监听DOM变化，确保新添加的聊天消息也可以选择文本
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // 元素节点
              const chatElements =
                node.querySelectorAll &&
                node.querySelectorAll(
                  ".chat-message-content, .message-text, .markdown-content",
                );
              if (chatElements && chatElements.length > 0) {
                setTimeout(ensureChatTextSelectable, 100);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 强制隐藏微信底部工具栏
    function hideWechatToolbar() {
      // 检查是否有输入框正在获得焦点
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true" ||
          activeElement.closest(".el-input, .el-textarea, .ai-input"));

      // 如果输入框正在获得焦点，不执行滚动操作
      if (isInputFocused) {
        console.log("输入框获得焦点，跳过滚动重置");
        return;
      }

      // 检查键盘是否正在显示
      if (isKeyboardOpen) {
        console.log("键盘正在显示，跳过滚动重置");
        return;
      }

      window.scrollTo(0, 0);
      document.body.style.height = `${window.innerHeight}px`;
      document.documentElement.style.height = `${window.innerHeight}px`;
    }

    // 页面加载完成后隐藏工具栏
    setTimeout(hideWechatToolbar, 500);

    // 用户交互后隐藏工具栏 - 但要避免在输入时触发
    document.addEventListener("touchend", (e) => {
      // 检查触摸结束的目标是否是输入相关元素
      const isInputElement =
        e.target.matches('input, textarea, [contenteditable="true"]') ||
        e.target.closest(".el-input, .el-textarea, .ai-input, .ai-input-row");

      if (!isInputElement) {
        setTimeout(hideWechatToolbar, 100);
      }
    });

    document.addEventListener("click", (e) => {
      // 检查点击的目标是否是输入相关元素
      const isInputElement =
        e.target.matches('input, textarea, [contenteditable="true"]') ||
        e.target.closest(".el-input, .el-textarea, .ai-input, .ai-input-row");

      if (!isInputElement) {
        setTimeout(hideWechatToolbar, 100);
      }
    });

    // 页面获得焦点时隐藏工具栏 - 但要检查焦点元素
    window.addEventListener("focus", (e) => {
      const isInputElement =
        e.target &&
        (e.target.matches('input, textarea, [contenteditable="true"]') ||
          e.target.closest(
            ".el-input, .el-textarea, .ai-input, .ai-input-row",
          ));

      if (!isInputElement) {
        hideWechatToolbar();
      }
    });

    window.addEventListener("pageshow", hideWechatToolbar);
  }

  // 其他浏览器检测
  if (ua.includes("chrome") && ua.includes("android")) {
    body.classList.add("android-chrome");
  } else if (ua.includes("safari") && ua.includes("iphone")) {
    body.classList.add("ios-safari");
  } else if (ua.includes("chrome") && ua.includes("iphone")) {
    body.classList.add("ios-chrome");
  }
}

// 立即执行环境检测
detectEnvironment();

// 添加调试信息
console.log("Base URL:", import.meta.env.BASE_URL);
console.log("Environment:", import.meta.env.MODE);
console.log("Current path:", window.location.pathname);

const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error("App error:", err);
  console.error("Component:", vm);
  console.error("Error info:", info);
};

app.use(createPinia());
app.use(router);
app.use(ElementPlus, {
  locale: zhCn,
});

app.mount("#app");

// 启动性能监控
if (process.env.NODE_ENV === "development") {
  performanceOptimizer.startMonitoring();

  // 每60秒输出性能报告，进一步减少频率
  setInterval(() => {
    const report = performanceOptimizer.getPerformanceReport();
    if (report.memoryUsage && report.memoryUsage.current > 150) {
      console.warn("🚨 内存使用过高:", report.memoryUsage.current + "MB");
    }
    if (report.suggestions.length > 0) {
      console.warn("💡 性能优化建议:", report.suggestions);
    }
  }, 60000);
}

// 生产环境也启用基础监控
if (process.env.NODE_ENV === "production") {
  // 监控严重的内存问题
  if (performance.memory) {
    setInterval(() => {
      const memoryMB = Math.round(
        performance.memory.usedJSHeapSize / 1024 / 1024,
      );
      if (memoryMB > 150) {
        console.warn("🚨 内存使用过高:", memoryMB + "MB");
        // 触发自动清理
        performanceOptimizer.triggerMemoryCleanup();

        if (memoryMB > 200) {
          console.error("🔥 内存使用严重过高，建议刷新页面");
        }
      }
    }, 120000); // 2分钟检查一次
  }
}
