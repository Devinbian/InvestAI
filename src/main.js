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

        // 延迟重置布局，确保键盘完全收起
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
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

    // 防止页面滚动触发浏览器UI
    document.addEventListener(
      "touchmove",
      function (e) {
        // 只允许特定元素的滚动
        if (e.touches.length === 1) {
          const target = e.target;
          if (
            !target.closest(
              ".modern-content, .chat-history-content, .tab-content, .ai-input",
            )
          ) {
            e.preventDefault();
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

    // 防止长按菜单
    document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });

    // 强制隐藏微信底部工具栏
    function hideWechatToolbar() {
      window.scrollTo(0, 0);
      document.body.style.height = `${window.innerHeight}px`;
      document.documentElement.style.height = `${window.innerHeight}px`;
    }

    // 页面加载完成后隐藏工具栏
    setTimeout(hideWechatToolbar, 500);

    // 用户交互后隐藏工具栏
    document.addEventListener("touchend", hideWechatToolbar);
    document.addEventListener("click", hideWechatToolbar);

    // 页面获得焦点时隐藏工具栏
    window.addEventListener("focus", hideWechatToolbar);
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
