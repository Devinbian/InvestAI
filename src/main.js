import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import App from "./App.vue";
import router from "./router";
// 导入 MessageBox z-index 修复样式
import "./assets/global-messagebox.css";

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
      
      /* 强制隐藏微信底部工具栏 */
      body.wechat-browser {
        height: 100vh !important;
        height: calc(var(--vh, 1vh) * 100) !important;
        max-height: 100vh !important;
        max-height: calc(var(--vh, 1vh) * 100) !important;
        overflow: hidden !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        /* 禁用滚动弹性效果，防止触发浏览器UI */
        overscroll-behavior-y: none !important;
        overscroll-behavior-x: none !important;
        /* 强制触发硬件加速 */
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
      }
      
      /* 微信环境下强制所有容器占满全宽 */
      body.wechat-browser * {
        box-sizing: border-box !important;
      }
      
      body.wechat-browser #app {
        width: 100vw !important;
        max-width: 100vw !important;
        height: calc(var(--vh, 1vh) * 100) !important;
        max-height: calc(var(--vh, 1vh) * 100) !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        overflow-y: hidden !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
      }
      
      /* 微信环境下键盘弹起时的布局调整 */
      body.wechat-browser.keyboard-open {
        height: calc(var(--keyboard-vh, 1vh) * 100) !important;
        max-height: calc(var(--keyboard-vh, 1vh) * 100) !important;
      }
      
      body.wechat-browser.keyboard-open #app {
        height: calc(var(--keyboard-vh, 1vh) * 100) !important;
        max-height: calc(var(--keyboard-vh, 1vh) * 100) !important;
      }
      
      /* 微信环境下键盘弹起时欢迎区域上移 */
      body.wechat-browser.keyboard-open .welcome-section {
        transform: translateY(-20px) !important;
        transition: transform 0.3s ease !important;
      }
      
      /* 微信环境下键盘弹起时AI输入卡片适配 */
      body.wechat-browser.keyboard-open .ai-card {
        padding: 4px 0 4px 0 !important;
        transition: padding 0.3s ease !important;
      }
    `;
    document.head.appendChild(style);

    // 键盘检测和适配逻辑
    let isKeyboardOpen = false;
    let originalViewportHeight = window.innerHeight;

    function setViewportHeight() {
      const currentHeight = window.innerHeight;
      const heightDifference = originalViewportHeight - currentHeight;

      // 检测键盘状态（高度变化超过150px认为是键盘）
      const keyboardVisible = heightDifference > 150;

      if (keyboardVisible !== isKeyboardOpen) {
        isKeyboardOpen = keyboardVisible;

        console.log("键盘状态变化:", {
          visible: keyboardVisible,
          originalHeight: originalViewportHeight,
          currentHeight: currentHeight,
          difference: heightDifference,
        });

        // 添加或移除键盘状态CSS类
        if (keyboardVisible) {
          document.body.classList.add("keyboard-open");
        } else {
          document.body.classList.remove("keyboard-open");
        }
      }

      // 设置视口高度变量
      if (keyboardVisible) {
        // 键盘打开时使用当前高度
        const vh = currentHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        document.documentElement.style.setProperty("--keyboard-vh", `${vh}px`);
      } else {
        // 键盘关闭时使用原始高度
        const vh = originalViewportHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        document.documentElement.style.setProperty("--keyboard-vh", `${vh}px`);

        // 只在键盘完全收起且没有输入框获得焦点时才重置滚动
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.contentEditable === "true" ||
            activeElement.closest(".el-input, .el-textarea, .ai-input"));

        if (!isInputFocused) {
          // 延迟重置布局，确保键盘完全收起
          setTimeout(() => {
            // 再次检查输入框状态，避免在用户快速切换输入框时重置滚动
            const currentActiveElement = document.activeElement;
            const isStillInputFocused =
              currentActiveElement &&
              (currentActiveElement.tagName === "INPUT" ||
                currentActiveElement.tagName === "TEXTAREA" ||
                currentActiveElement.contentEditable === "true" ||
                currentActiveElement.closest(
                  ".el-input, .el-textarea, .ai-input",
                ));

            if (!isStillInputFocused) {
              window.scrollTo(0, 0);
            }
          }, 300);
        }
      }
    }

    // 初始化视口高度
    originalViewportHeight = window.innerHeight;
    setViewportHeight();

    // 监听视口变化
    window.addEventListener("resize", setViewportHeight);
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        originalViewportHeight = window.innerHeight;
        setViewportHeight();
      }, 100);
    });

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

    // 防止长按菜单 - 但保留输入框的原生操作功能
    document.addEventListener("contextmenu", function (e) {
      // 检查是否是输入相关元素
      const isInputElement =
        e.target.matches('input, textarea, [contenteditable="true"]') ||
        e.target.closest(".el-input, .el-textarea");

      // 如果不是输入元素，则阻止右键菜单
      if (!isInputElement) {
        e.preventDefault();
      }
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
