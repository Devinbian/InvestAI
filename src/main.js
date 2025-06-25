import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import App from "./App.vue";
import router from "./router";
// 导入 MessageBox z-index 修复样式
import "./assets/global-messagebox.css";

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
