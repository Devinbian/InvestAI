import axios from "axios";
import { headUrl } from "@/config/baseUrl";
import { ElMessage } from "element-plus";
import router from "@/router/index.js";
import { useUserStore } from "@/store/user";

let flag = true;
const userStore = useUserStore();
// 创建 axios 实例
const request = axios.create({
  // API 请求的默认前缀
  baseURL: headUrl,
  timeout: 6000, // 请求超时时间
});

// request interceptor
request.interceptors.request.use((config) => {
  let userInfo = userStore.userInfo;
  if (userInfo && userInfo.token) {
    config.headers["Authorization"] = userInfo.token;
  }
  return config;
});

// response interceptor
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理网络错误和 CORS 错误
    if (!error.response) {
      // 网络错误或 CORS 错误
      let msg = "网络连接错误，请检查网络设置或联系管理员";
      if (error.code === "ECONNABORTED") {
        msg = "请求超时，请重试";
      } else if (error.message.includes("CORS")) {
        msg = "跨域请求被阻止，请联系管理员配置服务器";
      } else if (error.message.includes("Network Error")) {
        msg = "网络错误，请检查网络连接";
      }

      // 限制提示
      if (flag) {
        ElMessage.error(msg);
        flag = false;
        setTimeout(() => {
          flag = true;
        }, 2000);
      }

      return Promise.reject(error);
    }

    // 有响应的错误处理
    const { data } = error.response;
    let msg = data?.message || "服务器错误，请稍后重试";

    switch (data?.code) {
      case "A0307":
      case "B0301":
        router.push("/?showLogin=true");
        msg = "请先登录";
        break;
    }

    // 限制提示
    if (flag) {
      ElMessage.warning(msg);
      flag = false;
      setTimeout(() => {
        flag = true;
      }, 800);
    }

    return data;
  },
);

export default request;
