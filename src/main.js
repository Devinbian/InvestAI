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
        max-height: 100vh !important;
        overflow: hidden !important;
        position: relative !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* 微信环境下强制所有容器占满全宽 */
      body.wechat-browser * {
        box-sizing: border-box !important;
      }
      
      body.wechat-browser #app {
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
    `;
    document.head.appendChild(style);
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
