import axios from "axios";
import { headUrl } from "@/config/baseUrl";
import { ElMessage } from "element-plus";
import router from "@/router/index.js";
import { useUserStore } from "@/store/user";
import {
  fetchEventSource,
  EventStreamContentType,
} from "@microsoft/fetch-event-source";

let flag = true;
// 创建 axios 实例
const request = axios.create({
  // API 请求的默认前缀
  baseURL: headUrl,
  timeout: 600000, // 请求超时时间
});

// request interceptor
request.interceptors.request.use((config) => {
  // 在每次请求时重新获取userStore，确保获取最新的token
  const userStore = useUserStore();
  // 优先从userStore.token获取，如果没有则从userInfo.token获取
  const token = userStore.token || userStore.userInfo?.token;
  if (token) {
    config.headers["Authorization"] = token;
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
        // 在错误处理时也重新获取userStore
        const userStore = useUserStore();
        userStore.logout(false); // 系统自动退出，不清空引导进度
        router.push("/?showLogin=true").then(() => {
          window.location.reload();
        });
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

//============================= 封装的 fetchEventSource 方法 =================================
let sseFlag = true; // 单独用于 SSE 的错误提示节流

/**
 * 封装的 fetchEventSource 方法，添加认证和错误拦截
 * @param url 请求地址
 * @param options 配置选项
 */
export const authFetchEventSource = async (url, options = {}) => {
  // const ctrl = options.signal;

  try {
    // 在SSE请求时也重新获取userStore，确保获取最新的token
    const userStore = useUserStore();
    // 优先从userStore.token获取，如果没有则从userInfo.token获取
    const token = userStore.token || userStore.userInfo?.token;
    await fetchEventSource(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: token || "", // 添加认证 token
      },
      signal: options.signal,
      async onopen(response) {
        // 处理 HTTP 错误响应
        if (response.status !== 200) {
          const errorData = await response.json().catch(() => ({}));
          handleSSEError(response.status, errorData);
          return;
        }

        // 检查内容类型是否是事件流
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes(EventStreamContentType)) {
          throw new Error(
            `Expected event-stream content type, got: ${contentType}`,
          );
        }

        // 调用用户自定义的 onopen
        if (options.onopen) {
          return options.onopen(response);
        }
      },
      onerror(err) {
        // 网络错误处理
        err.message = handleNetworkError(err);
        options.onerror(err);
        throw err;
      },
    });
  } catch (err) {
    console.error("SSE Connection Error:", err);
  }
};

/**
 * 处理 SSE 的 HTTP 错误
 *
 * @param status HTTP 状态码
 * @param errorData 错误响应数据
 */
function handleSSEError(status, errorData) {
  const { code, message } = errorData;
  let errorMsg = message || `服务器错误 (${status})`;

  // 认证错误处理
  if (status === 401 || code === "A0307" || code === "B0301") {
    // 在SSE错误处理时也重新获取userStore
    const userStore = useUserStore();
    userStore.logout(false); // 系统自动退出，不清空引导进度
    router.push("/?showLogin=true").then(() => {
      window.location.reload();
    });
    errorMsg = "登录已过期，请重新登录";
  }

  showThrottledMessage(errorMsg, "warning");
}

/**
 * 处理网络错误
 *
 * @param err 错误对象
 * @return 错误消息字符串
 */
function handleNetworkError(err) {
  let msg = "网络连接错误，请检查网络设置";

  if (err.name === "AbortError") return; // 忽略手动中止的错误

  if (err.message.includes("Failed to fetch")) {
    msg = "无法连接到服务器，请检查网络";
  } else if (err.message.includes("Timeout")) {
    msg = "连接超时，请重试";
  } else if (err.message.includes("CORS")) {
    msg = "跨域请求被阻止，请联系管理员";
  }

  showThrottledMessage(msg, "warning");

  return msg;
}

/**
 * 节流错误提示
 *
 * @param msg 消息内容
 * @param type 消息类型
 */
function showThrottledMessage(msg, type) {
  if (!sseFlag) return;

  sseFlag = false;
  ElMessage[type](msg);

  setTimeout(() => {
    sseFlag = true;
  }, 2000);
}

export default request;
